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

function handleError(res, error) {
  const status = error.status || 500;
  res.status(status).json({ error: error.message || "Erro interno" });
}

function buildWhere(table, filters, userId, params) {
  const clauses = [];
  if (USER_OWNED_TABLES.has(table)) {
    clauses.push("user_id = ?");
    params.push(userId);
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
    } else {
      const err = new Error(`Operador nao permitido: ${op}`);
      err.status = 400;
      throw err;
    }
  }
  return clauses.length ? ` where ${clauses.join(" and ")}` : "";
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
  const where = buildWhere(table, body.filters, userId, params);
  let sql = `select * from ${table}${where}`;

  if (body.order?.column) {
    assertColumn(table, body.order.column);
    sql += ` order by ${body.order.column} ${body.order.ascending === false ? "desc" : "asc"}`;
  }
  if (body.limit) {
    sql += " limit ?";
    params.push(Number(body.limit));
  }

  const rows = await query(sql, params);
  return enrichRows(table, rows);
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
  return selectRows(table, body, userId);
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
      "insert into profiles (id, user_id, name, organization_name, telefone) values (?, ?, ?, ?, ?)",
      [uuidv4(), id, name || email, organizationName || null, telefone || null],
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
      const baseUrl = redirectTo || `${PUBLIC_BASE_URL}/login?type=recovery`;
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
    if (action === "select") data = await selectRows(table, req.body, req.user.id);
    else if (action === "insert") data = await insertRows(table, req.body.payload, req.user.id);
    else if (action === "update") data = await updateRows(table, req.body, req.user.id);
    else if (action === "delete") data = await deleteRows(table, req.body, req.user.id);
    else if (action === "upsert") data = await upsertRows(table, req.body, req.user.id);
    else return res.status(400).json({ error: `Acao nao permitida: ${action}` });

    if (req.body.single) data = data[0] || null;
    if (req.body.maybeSingle) data = data[0] || null;
    res.json({ data, error: null });
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
  app.use(express.static(distPath));
  app.use((_req, res) => res.sendFile(path.join(distPath, "index.html")));
}

app.listen(PORT, () => {
  console.log(`LocalFiny API listening on port ${PORT}`);
});
