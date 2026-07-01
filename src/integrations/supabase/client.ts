import type { Database } from "./types";

type AuthUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

type AuthSession = {
  access_token: string;
  user: AuthUser;
};

type Filter = {
  column: string;
  op: "eq" | "neq" | "lt" | "lte" | "gt" | "gte" | "in" | "is" | "not" | "ilike";
  operator?: string;
  value: unknown;
};

const API_BASE = import.meta.env.VITE_API_URL || "/api";
const TOKEN_KEY = "localfiny_session";

function getStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setStoredSession(session: AuthSession | null) {
  if (session) {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

function getRecoveryToken() {
  const searchToken = new URLSearchParams(window.location.search).get("token");
  if (searchToken) return searchToken;

  const hash = window.location.hash || "";
  const queryIndex = hash.indexOf("?");
  if (queryIndex === -1) return null;
  return new URLSearchParams(hash.slice(queryIndex + 1)).get("token");
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const session = getStoredSession();
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { data: null, error: { message: payload.error || "Erro na API" } };
  }
  if (!("data" in payload) && !("error" in payload)) {
    return { data: payload, error: null };
  }
  return payload;
}

class QueryBuilder {
  private action: "select" | "insert" | "update" | "delete" | "upsert" = "select";
  private filters: Filter[] = [];
  private orFilters: string[] = [];
  private selected = "*";
  private selectOptions: Record<string, unknown> = {};
  private payload: unknown;
  private orderBy: { column: string; ascending?: boolean } | null = null;
  private limitCount: number | null = null;
  private rangeFrom: number | null = null;
  private rangeTo: number | null = null;
  private singleResult = false;
  private maybeSingleResult = false;
  private upsertOptions: Record<string, unknown> = {};

  constructor(private table: string) {}

  select(columns = "*", options: Record<string, unknown> = {}) {
    this.selected = columns;
    this.selectOptions = options;
    return this;
  }

  insert(payload: unknown) {
    this.action = "insert";
    this.payload = payload;
    return this;
  }

  update(payload: unknown) {
    this.action = "update";
    this.payload = payload;
    return this;
  }

  delete() {
    this.action = "delete";
    return this;
  }

  upsert(payload: unknown, options: Record<string, unknown> = {}) {
    this.action = "upsert";
    this.payload = payload;
    this.upsertOptions = options;
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ column, op: "eq", value });
    return this;
  }

  neq(column: string, value: unknown) {
    this.filters.push({ column, op: "neq", value });
    return this;
  }

  lt(column: string, value: unknown) {
    this.filters.push({ column, op: "lt", value });
    return this;
  }

  lte(column: string, value: unknown) {
    this.filters.push({ column, op: "lte", value });
    return this;
  }

  gt(column: string, value: unknown) {
    this.filters.push({ column, op: "gt", value });
    return this;
  }

  gte(column: string, value: unknown) {
    this.filters.push({ column, op: "gte", value });
    return this;
  }

  in(column: string, value: unknown[]) {
    this.filters.push({ column, op: "in", value });
    return this;
  }

  is(column: string, value: unknown) {
    this.filters.push({ column, op: "is", value });
    return this;
  }

  not(column: string, operator: string, value: unknown) {
    this.filters.push({ column, op: "not", operator, value });
    return this;
  }

  ilike(column: string, value: string) {
    this.filters.push({ column, op: "ilike", value });
    return this;
  }

  or(expression: string) {
    this.orFilters.push(expression);
    return this;
  }

  order(column: string, options: { ascending?: boolean } = {}) {
    this.orderBy = { column, ascending: options.ascending };
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  range(from: number, to: number) {
    this.rangeFrom = from;
    this.rangeTo = to;
    return this;
  }

  single() {
    this.singleResult = true;
    return this;
  }

  maybeSingle() {
    this.maybeSingleResult = true;
    return this;
  }

  async execute() {
    return apiFetch(`/db/${this.table}`, {
      method: "POST",
      body: JSON.stringify({
        action: this.action,
        columns: this.selected,
        selectOptions: this.selectOptions,
        filters: this.filters,
        orFilters: this.orFilters,
        payload: this.payload,
        order: this.orderBy,
        limit: this.limitCount,
        range: this.rangeFrom === null || this.rangeTo === null ? null : { from: this.rangeFrom, to: this.rangeTo },
        single: this.singleResult,
        maybeSingle: this.maybeSingleResult,
        ...this.upsertOptions,
      }),
    });
  }

  then<TResult1 = unknown, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return this.execute().then(onfulfilled, onrejected);
  }
}

export const supabase = {
  from(_table: keyof Database["public"]["Tables"] | string) {
    return new QueryBuilder(String(_table));
  },

  rpc(name: string, params?: Record<string, unknown>) {
    return apiFetch(`/rpc/${name}`, {
      method: "POST",
      body: JSON.stringify(params || {}),
    });
  },

  functions: {
    invoke(name: string, options: { body?: unknown } = {}) {
      return apiFetch(`/functions/${name}`, {
        method: "POST",
        body: JSON.stringify(options.body || {}),
      });
    },
  },

  auth: {
    onAuthStateChange(callback: (_event: string, session: AuthSession | null) => void) {
      const session = getStoredSession();
      queueMicrotask(() => callback(session ? "SIGNED_IN" : "SIGNED_OUT", session));
      return {
        data: {
          subscription: {
            unsubscribe() {},
          },
        },
      };
    },

    async getSession() {
      const session = getStoredSession();
      if (!session) return { data: { session: null }, error: null };
      const { data, error } = await apiFetch("/auth/me");
      if (error) {
        setStoredSession(null);
        return { data: { session: null }, error };
      }
      const nextSession = { ...session, user: data.user };
      setStoredSession(nextSession);
      return { data: { session: nextSession }, error: null };
    },

    async refreshSession() {
      return this.getSession();
    },

    async getUser() {
      const { data, error } = await this.getSession();
      return { data: { user: data.session?.user || null }, error };
    },

    async signUp({ email, password, options }: any) {
      const { data, error } = await apiFetch("/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          name: options?.data?.full_name || options?.data?.name,
          organizationName: options?.data?.organization_name,
          telefone: options?.data?.telefone,
        }),
      });
      if (!error && data?.session) setStoredSession(data.session);
      return { data, error };
    },

    async signInWithPassword({ email, password }: { email: string; password: string }) {
      const { data, error } = await apiFetch("/auth/signin", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (!error && data?.session) setStoredSession(data.session);
      return { data, error };
    },

    async signOut() {
      setStoredSession(null);
      return { error: null };
    },

    async resetPasswordForEmail(email: string, options: { redirectTo?: string } = {}) {
      return apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email, redirectTo: options.redirectTo }),
      });
    },

    async updateUser(updates: { password?: string }) {
      if (!updates.password) return { data: null, error: null };
      const token = getRecoveryToken();
      return apiFetch("/auth/update-password", {
        method: "POST",
        body: JSON.stringify({ password: updates.password, token }),
      });
    },
  },

  storage: {
    from(bucket: string) {
      return {
        async upload(filePath: string, file: File) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("filePath", filePath);
          return apiFetch(`/storage/${bucket}/upload`, {
            method: "POST",
            body: formData,
          });
        },
        getPublicUrl(filePath: string) {
          const normalizedPath = filePath.replace(/^\/+/, "");
          return {
            data: {
              publicUrl: `${API_BASE.replace(/\/api$/, "")}/uploads/${bucket}/${normalizedPath}`,
            },
          };
        },
      };
    },
  },
};
