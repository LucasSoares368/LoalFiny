import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import nodemailer from "nodemailer";
import { v4 as uuidv4 } from "uuid";
import { pool, query } from "./db.js";
import {
  TABLE_COLUMNS,
  USER_OWNED_TABLES,
  assertColumn,
  assertTable,
  normalizeRow,
  pickAllowedColumns,
} from "./schema.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT || 3001);
const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || "";
const APP_BASE_URL = process.env.APP_BASE_URL || "https://app.localfiny.com";
const uploadRoot = path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, "..", "uploads"));
const smtpPort = Number(process.env.SMTP_PORT || 587);

const mailer = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
      tls: {
        rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== "false",
      },
    })
  : null;

fs.mkdirSync(uploadRoot, { recursive: true });

app.use(cors({ origin: process.env.CORS_ORIGIN || true, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use("/uploads", express.static(uploadRoot));

const upload = multer({ dest: uploadRoot, limits: { fileSize: 5 * 1024 * 1024 } });
const marketQuoteCacheTtlMs = Number(process.env.MARKET_QUOTES_CACHE_TTL_MS || 60000);
let marketQuoteCache = null;

async function runSqlFileIfExists(filePath) {
  if (!fs.existsSync(filePath)) return;
  const sql = fs.readFileSync(filePath, "utf8");
  const statements = sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await pool.query(statement);
  }
}

async function ensureColumn(tableName, columnName, definition) {
  const rows = await query(
    `select column_name
       from information_schema.columns
      where table_schema = database()
        and table_name = ?
        and column_name = ?
      limit 1`,
    [tableName, columnName],
  );

  if (!rows.length) {
    await query(`alter table ${tableName} add column ${columnName} ${definition}`);
  }
}

async function runMigrations() {
  await runSqlFileIfExists(path.join(__dirname, "..", "database", "mysql", "localfiny_2_0.sql"));
  await ensureColumn("transactions", "payment_method", "varchar(50) null after bank_id");
  await ensureColumn("debt_payments", "bank_id", "char(36) null after debt_id");
  await ensureColumn("debt_payments", "transaction_id", "char(36) null after bank_id");
  await ensureColumn("debt_payments", "payment_method", "varchar(50) null after payment_date");
  await ensureColumn("debt_payments", "profile_type", "varchar(20) null after payment_method");
  await ensureColumn("custom_goals", "profile_type", "varchar(20) not null default 'personal' after user_id");
}

const marketQuoteSymbols = [
  { symbol: "USDBRL=X", label: "Dólar", type: "currency", currency: "BRL" },
  { symbol: "EURBRL=X", label: "Euro", type: "currency", currency: "BRL" },
  { symbol: "GBPBRL=X", label: "Libra", type: "currency", currency: "BRL" },
  { symbol: "ARSBRL=X", label: "Peso Argentino", type: "currency", currency: "BRL", maximumFractionDigits: 5 },
  { symbol: "^BVSP", label: "Ibovespa", type: "index" },
  { symbol: "^GSPC", label: "S&P 500", type: "index" },
  { symbol: "^IXIC", label: "Nasdaq", type: "index" },
  { symbol: "GC=F", label: "Ouro", type: "commodity", currency: "USD" },
  { symbol: "CL=F", label: "Petróleo", type: "commodity", currency: "USD" },
  { symbol: "BTC-USD", label: "Bitcoin", type: "crypto", currency: "USD" },
  { symbol: "ETH-USD", label: "Ethereum", type: "crypto", currency: "USD" },
];

async function fetchYahooChartQuote(config) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(config.symbol)}?range=5d&interval=1d`,
      {
        signal: controller.signal,
        headers: {
          "user-agent": "Mozilla/5.0 LocalFiny/1.0",
          accept: "application/json",
        },
      },
    );

    if (!response.ok) throw new Error(`Yahoo Finance respondeu ${response.status}`);

    const payload = await response.json();
    const result = payload.chart?.result?.[0];
    const meta = result?.meta;
    const quotes = result?.indicators?.quote?.[0];
    const closes = (quotes?.close || []).filter((value) => Number.isFinite(value));
    const current = Number(meta?.regularMarketPrice ?? closes.at(-1));
    const previous = Number(meta?.chartPreviousClose ?? closes.at(-2));

    if (!Number.isFinite(current)) throw new Error(`Cotacao indisponivel para ${config.symbol}`);

    const changePercent = Number.isFinite(previous) && previous !== 0
      ? ((current - previous) / previous) * 100
      : null;

    return {
      symbol: config.symbol,
      label: config.label,
      type: config.type,
      currency: config.currency || meta?.currency || null,
      value: current,
      previousClose: Number.isFinite(previous) ? previous : null,
      changePercent,
      maximumFractionDigits: config.maximumFractionDigits || null,
      updatedAt: meta?.regularMarketTime
        ? new Date(meta.regularMarketTime * 1000).toISOString()
        : new Date().toISOString(),
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function getMarketQuotes() {
  const now = Date.now();
  if (marketQuoteCache && now - marketQuoteCache.fetchedAt < marketQuoteCacheTtlMs) {
    return { ...marketQuoteCache.payload, cached: true };
  }

  const settled = await Promise.allSettled(marketQuoteSymbols.map(fetchYahooChartQuote));
  const quotes = settled
    .map((result) => (result.status === "fulfilled" ? result.value : null))
    .filter(Boolean);
  const errors = settled
    .map((result, index) => (result.status === "rejected" ? `${marketQuoteSymbols[index].label}: ${result.reason.message}` : null))
    .filter(Boolean);

  if (!quotes.length) {
    const error = new Error(errors[0] || "Nao foi possivel carregar indicadores de mercado");
    error.status = 502;
    throw error;
  }

  const payload = {
    quotes,
    errors,
    provider: "Yahoo Finance",
    fetchedAt: new Date(now).toISOString(),
    cacheTtlMs: marketQuoteCacheTtlMs,
  };
  marketQuoteCache = { fetchedAt: now, payload };
  return { ...payload, cached: false };
}

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
  );
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role || "user",
    user_metadata: {
      name: user.name,
      full_name: user.name,
      organization_name: user.organization_name,
      telefone: user.telefone,
    },
  };
}

async function sendPasswordResetEmail(user, resetUrl) {
  if (!mailer) {
    const error = new Error("SMTP nao configurado");
    error.status = 500;
    throw error;
  }

  const appName = process.env.APP_NAME || "LocalFiny";
  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  const logoUrl = `${PUBLIC_BASE_URL || "https://app.localfiny.com"}/brand/logo.png`;
  await mailer.sendMail({
    from: `${appName} <${from}>`,
    to: user.email,
    subject: `Redefina sua senha no ${appName}`,
    text: [
      `Ola${user.name ? `, ${user.name}` : ""}.`,
      "",
      `Recebemos uma solicitacao para redefinir sua senha no ${appName}.`,
      `Acesse o link abaixo para criar uma nova senha:`,
      "",
      resetUrl,
      "",
      "Este link expira em 1 hora. Se voce nao solicitou esta alteracao, ignore este email.",
    ].join("\n"),
    html: `
      <div style="margin:0;background:#f8fafc;padding:32px;font-family:Arial,sans-serif;color:#0f172a">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:18px;padding:32px;border:1px solid #e2e8f0">
          <img src="${logoUrl}" alt="${appName}" style="display:block;width:180px;max-width:100%;height:auto;margin:0 0 28px;border-radius:10px" />
          <h1 style="margin:0 0 12px;font-size:24px;color:#0f172a">Redefina sua senha</h1>
          <p style="margin:0 0 20px;line-height:1.6;color:#475569">
            Recebemos uma solicitação para redefinir sua senha no <strong>${appName}</strong>.
          </p>
          <a href="${resetUrl}" style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;font-weight:700;border-radius:12px;padding:14px 22px">
            Criar nova senha
          </a>
          <p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:#64748b">
            Este link expira em 1 hora. Se você não solicitou esta alteração, ignore este email.
          </p>
        </div>
      </div>
    `,
  });
}

async function authRequired(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Nao autenticado" });
    const payload = jwt.verify(token, JWT_SECRET);
    const rows = await query("select * from users where id = ? limit 1", [payload.sub]);
    if (!rows.length) return res.status(401).json({ error: "Usuario nao encontrado" });
    req.user = rows[0];
    next();
  } catch (error) {
    res.status(401).json({ error: "Sessao invalida" });
  }
}

async function optionalAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (token) {
      const payload = jwt.verify(token, JWT_SECRET);
      const rows = await query("select * from users where id = ? limit 1", [payload.sub]);
      req.user = rows[0] || null;
    }
  } catch {
    req.user = null;
  }
  next();
}

function isAdminUser(user) {
  return ["admin", "superadmin"].includes(String(user?.role || "").toLowerCase());
}

function defaultPlan() {
  return {
    plan_type: "starter",
    plan_name: "Starter",
    is_active: true,
    max_banks: 999,
    max_goals: 1,
    max_reminders: 3,
    whatsapp_enabled: false,
    reports_enabled: false,
    cashflow_projection_enabled: false,
    export_enabled: false,
    split_enabled: false,
    business_profile_enabled: false,
    advanced_dashboard_enabled: false,
    annual_projection_enabled: false,
    history_months: 3,
    monthly_planning_enabled: false,
    ai_enabled: false,
    import_enabled: false,
  };
}

function fullFeaturePlan(planName = "Business") {
  return {
    ...defaultPlan(),
    plan_type: "business",
    plan_name: planName,
    max_goals: 999,
    max_reminders: 999,
    whatsapp_enabled: true,
    reports_enabled: true,
    cashflow_projection_enabled: true,
    export_enabled: true,
    split_enabled: true,
    business_profile_enabled: true,
    advanced_dashboard_enabled: true,
    annual_projection_enabled: true,
    history_months: 9999,
    monthly_planning_enabled: true,
    ai_enabled: true,
    import_enabled: true,
  };
}

function handleError(res, error) {
  const status = error.status || 500;
  res.status(status).json({ error: error.message || "Erro interno" });
}

function buildWhere(table, filters, userId, params) {
  const clauses = [];
  if (USER_OWNED_TABLES.has(table)) {
    clauses.push(table === "profiles" ? "(user_id = ? or id = ?)" : "user_id = ?");
    params.push(userId);
    if (table === "profiles") params.push(userId);
  }

  for (const filter of filters || []) {
    const { column, op, operator, value } = filter;
    assertColumn(table, column);
    if (column === "user_id" && value !== userId) continue;

    if (op === "eq") {
      clauses.push(`${column} = ?`);
      params.push(value);
    } else if (op === "neq") {
      clauses.push(`${column} <> ?`);
      params.push(value);
    } else if (op === "lt" || op === "lte" || op === "gt" || op === "gte") {
      const sqlOp = { lt: "<", lte: "<=", gt: ">", gte: ">=" }[op];
      clauses.push(`${column} ${sqlOp} ?`);
      params.push(value);
    } else if (op === "in") {
      const values = Array.isArray(value) ? value : [];
      if (!values.length) {
        clauses.push("1 = 0");
      } else {
        clauses.push(`${column} in (${values.map(() => "?").join(", ")})`);
        params.push(...values);
      }
    } else if (op === "is") {
      if (value === null) {
        clauses.push(`${column} is null`);
      } else if (value === true) {
        clauses.push(`${column} is true`);
      } else if (value === false) {
        clauses.push(`${column} is false`);
      } else {
        clauses.push(`${column} = ?`);
        params.push(value);
      }
    } else if (op === "not") {
      if (operator === "is" && value === null) {
        clauses.push(`${column} is not null`);
      } else if (operator === "is" && value === true) {
        clauses.push(`${column} is not true`);
      } else if (operator === "is" && value === false) {
        clauses.push(`${column} is not false`);
      } else {
        const err = new Error(`Operador not nao permitido: ${operator}`);
        err.status = 400;
        throw err;
      }
    } else if (op === "ilike") {
      clauses.push(`lower(${column}) like lower(?)`);
      params.push(String(value).replace(/\*/g, "%"));
    } else {
      const err = new Error(`Operador nao permitido: ${op}`);
      err.status = 400;
      throw err;
    }
  }
  return clauses.length ? ` where ${clauses.join(" and ")}` : "";
}

function parseOrExpression(table, expression, params, userId) {
  const parts = String(expression || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const clauses = [];

  for (const part of parts) {
    const [column, op, ...rawValue] = part.split(".");
    const value = rawValue.join(".");
    assertColumn(table, column);
    if (column === "user_id" && value !== userId) {
      clauses.push("user_id = ?");
      params.push(userId);
      continue;
    }
    if (op === "eq") {
      clauses.push(`${column} = ?`);
      params.push(value === "true" ? true : value === "false" ? false : value);
    } else if (op === "ilike") {
      clauses.push(`lower(${column}) like lower(?)`);
      params.push(value.replace(/\*/g, "%"));
    }
  }

  return clauses.length ? `(${clauses.join(" or ")})` : "";
}

async function enrichRows(table, rows) {
  const normalized = rows.map(normalizeRow);

  async function attachById(fieldName, targetTable, targetField, outputName) {
    const ids = [...new Set(normalized.map((row) => row[fieldName]).filter(Boolean))];
    if (!ids.length) return;
    const related = await query(
      `select * from ${targetTable} where id in (${ids.map(() => "?").join(", ")})`,
      ids,
    );
    const map = new Map(related.map((row) => [row.id, normalizeRow(row)]));
    for (const row of normalized) {
      row[outputName] = row[fieldName] ? map.get(row[fieldName]) || null : null;
    }
  }

  if (["receitas", "despesas", "transacoes", "ia_analysis_results"].includes(table)) {
    await attachById("categoria_id", "categorias", "id", "categorias");
  }
  if (table === "transactions") {
    await attachById("category_id", "categories", "id", "categories");
    await attachById("bank_id", "banks", "id", "banks");
  }
  if (table === "receitas") {
    await attachById("bank_account_id", "bank_accounts", "id", "bank_accounts");
  }
  if (table === "itens_mercado") {
    await attachById("categoria_mercado_id", "categorias_mercado", "id", "categorias_mercado");
  }
  if (table === "metas") {
    await attachById("categoria_meta_id", "categorias_metas", "id", "categorias_metas");
  }
  return normalized;
}

async function selectRows(table, body, userId) {
  assertTable(table);
  const params = [];
  let where = buildWhere(table, body.filters, userId, params);
  const extraOrClauses = [];
  for (const expression of body.orFilters || []) {
    const clause = parseOrExpression(table, expression, params, userId);
    if (clause) extraOrClauses.push(clause);
  }
  if (extraOrClauses.length) {
    where += `${where ? " and " : " where "}${extraOrClauses.join(" and ")}`;
  }

  let count;
  if (body.selectOptions?.count) {
    const countRows = await query(`select count(*) as count from ${table}${where}`, params);
    count = Number(countRows[0]?.count || 0);
    if (body.selectOptions?.head) return { rows: [], count };
  }

  let sql = `select * from ${table}${where}`;

  if (body.order?.column) {
    assertColumn(table, body.order.column);
    sql += ` order by ${body.order.column} ${body.order.ascending === false ? "desc" : "asc"}`;
  }
  if (body.range) {
    const from = Math.max(0, Number(body.range.from || 0));
    const to = Math.max(from, Number(body.range.to || from));
    sql += " limit ? offset ?";
    params.push(to - from + 1, from);
  } else if (body.limit) {
    sql += " limit ?";
    params.push(Number(body.limit));
  }

  const rows = await query(sql, params);
  return { rows: await enrichRows(table, rows), count };
}

async function insertRows(table, payload, userId) {
  assertTable(table);
  const rows = Array.isArray(payload) ? payload : [payload];
  const inserted = [];

  for (const original of rows) {
    const data = pickAllowedColumns(table, original);
    data.id ||= uuidv4();
    if (USER_OWNED_TABLES.has(table)) data.user_id = userId;
    const columns = Object.keys(data);
    const values = columns.map((column) => data[column]);
    await query(
      `insert into ${table} (${columns.join(", ")}) values (${columns.map(() => "?").join(", ")})`,
      values,
    );
    const found = await query(`select * from ${table} where id = ? limit 1`, [data.id]);
    inserted.push(found[0]);
  }

  return enrichRows(table, inserted);
}

async function updateRows(table, body, userId) {
  assertTable(table);
  const data = pickAllowedColumns(table, body.payload);
  delete data.id;
  delete data.user_id;
  const columns = Object.keys(data);
  if (!columns.length) return [];

  const params = columns.map((column) => data[column]);
  const where = buildWhere(table, body.filters, userId, params);
  await query(`update ${table} set ${columns.map((column) => `${column} = ?`).join(", ")}${where}`, params);
  const selected = await selectRows(table, body, userId);
  return selected.rows;
}

async function deleteRows(table, body, userId) {
  assertTable(table);
  const params = [];
  const where = buildWhere(table, body.filters, userId, params);
  await query(`delete from ${table}${where}`, params);
  return [];
}

async function upsertRows(table, body, userId) {
  const rows = Array.isArray(body.payload) ? body.payload : [body.payload];
  const inserted = [];
  const conflictColumns = String(body.onConflict || "")
    .split(",")
    .map((column) => column.trim())
    .filter(Boolean);

  for (const row of rows) {
    const data = pickAllowedColumns(table, row);
    data.id ||= uuidv4();
    if (USER_OWNED_TABLES.has(table)) data.user_id = userId;
    const columns = Object.keys(data);
    const updateColumns = columns.filter((column) => column !== "id" && !conflictColumns.includes(column));
    const sql = `
      insert into ${table} (${columns.join(", ")})
      values (${columns.map(() => "?").join(", ")})
      on duplicate key update ${body.ignoreDuplicates ? "id = id" : updateColumns.map((column) => `${column} = values(${column})`).join(", ")}
    `;
    await query(sql, columns.map((column) => data[column]));
    const found = await query(`select * from ${table} where id = ? limit 1`, [data.id]);
    if (found[0]) inserted.push(found[0]);
  }
  return enrichRows(table, inserted);
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/market/quotes", async (_req, res) => {
  try {
    res.json(await getMarketQuotes());
  } catch (error) {
    handleError(res, error);
  }
});

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, password, name, organizationName, telefone } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email e senha sao obrigatorios" });
    const id = uuidv4();
    const passwordHash = await bcrypt.hash(password, 12);
    await query(
      "insert into users (id, email, password_hash, role, name, organization_name, telefone) values (?, ?, ?, 'user', ?, ?, ?)",
      [id, email, passwordHash, name || null, organizationName || null, telefone || null],
    );
    await query(
      "insert into profiles (id, user_id, name, full_name, email, organization_name, telefone) values (?, ?, ?, ?, ?, ?, ?)",
      [id, id, name || email, name || email, email, organizationName || null, telefone || null],
    );
    const user = { id, email, role: "user", name, organization_name: organizationName, telefone };
    res.json({ user: publicUser(user), session: { access_token: signToken(user), user: publicUser(user) } });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "Email ja cadastrado" });
    handleError(res, error);
  }
});

app.post("/api/auth/signin", async (req, res) => {
  try {
    const { email, password } = req.body;
    const rows = await query("select * from users where email = ? limit 1", [email]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password || "", user.password_hash))) {
      return res.status(401).json({ error: "Email ou senha invalidos" });
    }
    res.json({ user: publicUser(user), session: { access_token: signToken(user), user: publicUser(user) } });
  } catch (error) {
    handleError(res, error);
  }
});

app.get("/api/auth/me", authRequired, (req, res) => {
  const user = publicUser(req.user);
  res.json({ user, session: { user } });
});

app.post("/api/auth/update-password", async (req, res) => {
  try {
    const { password, token } = req.body;
    if (!password || password.length < 6) return res.status(400).json({ error: "Senha invalida" });

    if (token) {
      const tokenHash = crypto.createHash("sha256").update(String(token)).digest("hex");
      const rows = await query(
        "select * from users where reset_token_hash = ? and reset_token_expires_at > now() limit 1",
        [tokenHash],
      );
      const user = rows[0];
      if (!user) return res.status(400).json({ error: "Link de redefinicao invalido ou expirado" });
      await query(
        "update users set password_hash = ?, reset_token_hash = null, reset_token_expires_at = null where id = ?",
        [await bcrypt.hash(password, 12), user.id],
      );
      return res.json({ ok: true });
    }

    const header = req.headers.authorization || "";
    const jwtToken = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!jwtToken) return res.status(401).json({ error: "Nao autenticado" });
    const payload = jwt.verify(jwtToken, JWT_SECRET);
    await query("update users set password_hash = ? where id = ?", [await bcrypt.hash(password, 12), payload.sub]);
    res.json({ ok: true });
  } catch (error) {
    handleError(res, error);
  }
});

app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { email, redirectTo } = req.body;
    if (!email) return res.status(400).json({ error: "Email e obrigatorio" });

    const rows = await query("select * from users where email = ? limit 1", [email]);
    const user = rows[0];
    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      await query(
        "update users set reset_token_hash = ?, reset_token_expires_at = date_add(now(), interval 1 hour) where id = ?",
        [tokenHash, user.id],
      );
      const baseUrl = redirectTo || `${APP_BASE_URL}/#/reset-password`;
      const resetUrl = new URL(baseUrl);
      resetUrl.searchParams.set("type", "recovery");
      resetUrl.searchParams.set("token", token);
      await sendPasswordResetEmail(user, resetUrl.toString());
    }

    res.json({ ok: true });
  } catch (error) {
    handleError(res, error);
  }
});

app.post("/api/db/:table", authRequired, async (req, res) => {
  try {
    const { table } = req.params;
    const { action } = req.body;
    let data;
    let count;
    if (action === "select") {
      const result = await selectRows(table, req.body, req.user.id);
      data = result.rows;
      count = result.count;
    }
    else if (action === "insert") data = await insertRows(table, req.body.payload, req.user.id);
    else if (action === "update") data = await updateRows(table, req.body, req.user.id);
    else if (action === "delete") data = await deleteRows(table, req.body, req.user.id);
    else if (action === "upsert") data = await upsertRows(table, req.body, req.user.id);
    else return res.status(400).json({ error: `Acao nao permitida: ${action}` });

    if (req.body.single) data = data[0] || null;
    if (req.body.maybeSingle) data = data[0] || null;
    res.json({ data, count, error: null });
  } catch (error) {
    handleError(res, error);
  }
});

app.post("/api/rpc/delete_user_account", authRequired, async (req, res) => {
  try {
    await query("delete from users where id = ?", [req.user.id]);
    res.json({ data: true, error: null });
  } catch (error) {
    handleError(res, error);
  }
});

app.post("/api/rpc/has_role", authRequired, async (req, res) => {
  try {
    const requestedUserId = req.body?._user_id || req.body?.user_id || req.user.id;
    const requestedRole = String(req.body?._role || req.body?.role || "").toLowerCase();
    const roleRows = await query("select role from user_roles where user_id = ? limit 1", [requestedUserId]).catch(() => []);
    const roles = new Set([
      String(req.user.role || "").toLowerCase(),
      ...roleRows.map((row) => String(row.role || "").toLowerCase()),
    ]);
    const data = roles.has(requestedRole) || (requestedRole === "admin" && roles.has("superadmin"));
    res.json({ data, error: null });
  } catch (error) {
    handleError(res, error);
  }
});

app.post("/api/rpc/get_user_plan", authRequired, async (_req, res) => {
  try {
    if (isAdminUser(_req.user)) {
      return res.json({
        data: [fullFeaturePlan("Admin")],
        error: null,
      });
    }

    const rows = await query(
      `
        select
          p.plan_type,
          p.name as plan_name,
          p.max_banks,
          p.max_goals,
          p.max_reminders,
          p.whatsapp_enabled,
          p.reports_enabled,
          p.cashflow_projection_enabled,
          p.export_enabled,
          p.split_enabled,
          p.business_profile_enabled,
          p.advanced_dashboard_enabled,
          p.annual_projection_enabled,
          p.history_months,
          p.monthly_planning_enabled,
          s.status
        from subscriptions s
        join plans p on p.id = s.plan_id
        where s.user_id = ?
          and s.status = 'active'
          and (s.current_period_end is null or s.current_period_end > now())
        order by s.updated_at desc, s.created_at desc
        limit 1
      `,
      [_req.user.id],
    ).catch(() => []);

    if (rows[0]) {
      const plan = rows[0];
      const planType = String(plan.plan_type || "starter").toLowerCase();
      return res.json({
        data: [{
          ...defaultPlan(),
          ...normalizeRow(plan),
          plan_type: planType,
          plan_name: plan.plan_name || planType,
          is_active: true,
          ai_enabled: !["starter", "free"].includes(planType),
          import_enabled: !["starter", "free"].includes(planType),
        }],
        error: null,
      });
    }

    res.json({ data: [defaultPlan()], error: null });
  } catch (error) {
    handleError(res, error);
  }
});

app.post("/api/rpc/is_registration_allowed", optionalAuth, async (_req, res) => {
  try {
    const rows = await query("select allow_registration from app_settings order by created_at desc limit 1").catch(() => []);
    res.json({ data: rows.length ? Boolean(rows[0].allow_registration) : true, error: null });
  } catch (error) {
    handleError(res, error);
  }
});

app.post("/api/rpc/update_app_setting", authRequired, async (req, res) => {
  try {
    if (!isAdminUser(req.user)) return res.status(403).json({ error: "Acesso negado" });
    const allowRegistration = Boolean(req.body?.p_allow_registration ?? req.body?.allow_registration);
    const rows = await query("select id, allow_registration from app_settings order by created_at desc limit 1");
    if (rows[0]) {
      await query("update app_settings set allow_registration = ? where id = ?", [allowRegistration, rows[0].id]);
    } else {
      await query("insert into app_settings (id, allow_registration) values (?, ?)", [uuidv4(), allowRegistration]);
    }
    await query(
      "insert into app_settings_logs (id, changed_by, setting_key, old_value, new_value) values (?, ?, 'allow_registration', ?, ?)",
      [uuidv4(), req.user.id, rows[0] ? String(Boolean(rows[0].allow_registration)) : null, String(allowRegistration)],
    ).catch(() => null);
    res.json({ data: true, error: null });
  } catch (error) {
    handleError(res, error);
  }
});

async function adminSettingsHandler(req, res) {
  if (!isAdminUser(req.user)) return res.status(403).json({ error: "Acesso negado" });
  const { action, table, data = {} } = req.body || {};
  assertTable(table);

  if (action === "get") {
    const page = Math.max(1, Number(data.page || 1));
    const pageSize = Math.min(100, Math.max(1, Number(data.pageSize || 50)));
    const countRows = await query(`select count(*) as count from ${table}`);
    const rows = await query(`select * from ${table} order by created_at desc limit ? offset ?`, [pageSize, (page - 1) * pageSize])
      .catch(() => query(`select * from ${table} limit ? offset ?`, [pageSize, (page - 1) * pageSize]));
    return res.json({ data: table === "payments" ? { data: rows.map(normalizeRow), count: Number(countRows[0]?.count || 0) } : rows.map(normalizeRow), error: null });
  }

  if (action === "update") {
    const id = data.id || uuidv4();
    const payload = pickAllowedColumns(table, { ...data, id });
    const columns = Object.keys(payload);
    const updates = columns.filter((column) => column !== "id").map((column) => `${column} = values(${column})`);
    await query(
      `insert into ${table} (${columns.join(", ")}) values (${columns.map(() => "?").join(", ")}) on duplicate key update ${updates.length ? updates.join(", ") : "id = id"}`,
      columns.map((column) => payload[column]),
    );
    return res.json({ data: true, error: null });
  }

  if (action === "delete") {
    if (data.id) await query(`delete from ${table} where id = ?`, [data.id]);
    return res.json({ data: true, error: null });
  }

  if (action === "clear_all" && table === "payments") {
    await query("delete from payments");
    return res.json({ data: true, error: null });
  }

  return res.status(400).json({ error: `Acao nao permitida: ${action}` });
}

app.post("/api/functions/:name", optionalAuth, async (req, res) => {
  try {
    const { name } = req.params;

    if (name === "validate-signup") {
      const { email, password, fullName, captchaVerified } = req.body || {};
      if (!captchaVerified) return res.json({ data: { error: "Verificacao anti-spam invalida" }, error: null });
      if (!email || !password || !fullName) return res.json({ data: { error: "Preencha todos os campos" }, error: null });
      if (String(password).length < 8) return res.json({ data: { error: "Senha muito curta" }, error: null });
      return res.json({ data: { success: true }, error: null });
    }

    if (name === "get-market-quotes") {
      const payload = await getMarketQuotes();
      return res.json({
        data: {
          success: true,
          quotes: payload.quotes.map((quote) => ({
            symbol: quote.symbol,
            name: quote.label,
            price: quote.value,
            change: quote.previousClose === null ? 0 : quote.value - quote.previousClose,
            changePercent: quote.changePercent || 0,
            type: quote.type,
          })),
          lastUpdate: payload.fetchedAt,
        },
        error: null,
      });
    }

    if (name === "get-exchange-rates") {
      return res.json({
        data: {
          success: true,
          rates: { BRL: 5.5, USD: 1, EUR: 0.93, GBP: 0.79, JPY: 160, CNY: 7.25, ARS: 900, CAD: 1.36, AUD: 1.5, CHF: 0.9, MXN: 18, CLP: 930, PEN: 3.75, COP: 4100, UYU: 40 },
          lastUpdate: new Date().toISOString(),
        },
        error: null,
      });
    }

    if (name === "get-financial-news") {
      return res.json({ data: { success: true, news: [], lastUpdate: new Date().toISOString() }, error: null });
    }

    if (name === "admin-settings") return adminSettingsHandler(req, res);

    if (name === "ai-chat") {
      return res.json({
        data: {
          success: false,
          message: "A assistente IA ja esta na interface do LocalFiny 2.0, mas a chave/configuracao da IA ainda precisa ser conectada no backend MySQL.",
        },
        error: null,
      });
    }

    if (["openai-config", "evolution-api", "send-whatsapp", "create-mercadopago-checkout", "process-transaction-image", "check-achievements"].includes(name)) {
      return res.json({ data: { success: false, message: "Integracao ainda nao configurada no MySQL" }, error: null });
    }

    res.status(404).json({ error: `Funcao nao encontrada: ${name}` });
  } catch (error) {
    handleError(res, error);
  }
});

app.post("/api/storage/:bucket/upload", authRequired, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Arquivo ausente" });
    const bucket = req.params.bucket;
    const requestedPath = String(req.body.filePath || `${req.user.id}/${req.file.originalname}`);
    const safePath = requestedPath
      .split("/")
      .map((part) => part.replace(/[^\w.\-]/g, "_"))
      .filter(Boolean)
      .join("/");
    const bucketDir = path.join(uploadRoot, bucket, path.dirname(safePath));
    fs.mkdirSync(bucketDir, { recursive: true });
    const finalPath = path.join(uploadRoot, bucket, safePath);
    fs.renameSync(req.file.path, finalPath);
    const storagePath = safePath;
    const publicUrl = `${PUBLIC_BASE_URL}/uploads/${bucket}/${storagePath}`.replace(/([^:]\/)\/+/g, "$1");
    res.json({ data: { path: storagePath, publicUrl }, error: null });
  } catch (error) {
    handleError(res, error);
  }
});

const distPath = path.join(__dirname, "..", "dist");
if (fs.existsSync(distPath)) {
  app.use(
    express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
          res.setHeader("Pragma", "no-cache");
          res.setHeader("Expires", "0");
        }
      },
    }),
  );
  app.use((_req, res) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.sendFile(path.join(distPath, "index.html"));
  });
}

await runMigrations();

app.listen(PORT, () => {
  console.log(`LocalFiny API listening on port ${PORT}`);
});
