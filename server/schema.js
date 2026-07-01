export const USER_OWNED_TABLES = new Set([
  "profiles",
  "categorias",
  "categorias_mercado",
  "categorias_metas",
  "bank_accounts",
  "cards",
  "transacoes",
  "receitas",
  "despesas",
  "metas",
  "itens_mercado",
  "orcamentos_mercado",
  "veiculos",
  "tipos_manutencao",
  "manutencoes",
  "ia_configuracoes",
  "ia_uploads",
  "ia_analysis_results",
  "achievements",
  "banks",
  "categories",
  "cookie_consents",
  "custom_goals",
  "debt_payments",
  "debts",
  "emergency_goals",
  "fixed_costs",
  "notes",
  "price_records",
  "products",
  "reminders",
  "shopping_list_items",
  "smart_alerts_config",
  "smart_indicators_logs",
  "split_rules",
  "stores",
  "subscriptions",
  "transactions",
  "user_balance",
  "user_roles",
  "whatsapp_config",
  "whatsapp_messages_log",
]);

export const TABLE_COLUMNS = {
  profiles: [
    "id", "user_id", "name", "organization_name", "telefone", "endereco", "avatar_url", "email", "full_name",
    "is_blocked", "onboarding_completed", "phone_number", "whatsapp_notifications_enabled", "created_at", "updated_at",
  ],
  categorias: ["id", "user_id", "nome", "tipo", "cor", "icone", "created_at", "updated_at"],
  categorias_mercado: ["id", "user_id", "nome", "descricao", "cor", "ativa", "created_at", "updated_at"],
  categorias_metas: ["id", "user_id", "nome", "descricao", "cor", "ativa", "created_at", "updated_at"],
  bank_accounts: [
    "id", "user_id", "name", "bank_name", "account_type", "balance", "balance_reference_date",
    "account_holder_name", "notes", "is_active", "provider", "external_id", "last_sync_at", "created_at", "updated_at",
  ],
  cards: [
    "id", "user_id", "name", "issuer_bank", "bank_code", "bank_name", "bank_slug", "brand_color",
    "card_holder_name", "credit_limit", "closing_day", "due_day", "provider", "external_id", "last_sync_at", "created_at", "updated_at",
  ],
  transacoes: ["id", "user_id", "categoria_id", "descricao", "valor", "data", "tipo", "created_at", "updated_at"],
  receitas: [
    "id", "user_id", "categoria_id", "bank_account_id", "descricao", "valor", "data", "recorrente", "dia_recorrencia",
    "receita_pai_id", "frequencia_recorrencia", "data_fim_recorrencia", "forma_pagamento", "status_recebimento",
    "tipo_receita", "created_at", "updated_at",
  ],
  despesas: [
    "id", "user_id", "categoria_id", "descricao", "valor", "data", "status", "status_pagamento", "tipo_despesa",
    "forma_pagamento", "cartao_id", "numero_parcelas", "data_primeira_parcela", "data_vencimento", "data_pagamento",
    "recorrente", "frequencia_recorrencia", "dia_recorrencia", "data_fim_recorrencia", "despesa_pai_id",
    "installment_group_id", "installment_index", "installments_total", "created_at", "updated_at",
  ],
  metas: ["id", "user_id", "categoria_meta_id", "titulo", "descricao", "valor_alvo", "valor_atual", "data_inicio", "data_limite", "tipo", "status", "created_at", "updated_at"],
  itens_mercado: ["id", "user_id", "categoria_mercado_id", "descricao", "quantidade_atual", "quantidade_ideal", "unidade_medida", "preco_atual", "status", "created_at", "updated_at"],
  orcamentos_mercado: ["id", "user_id", "categoria_despesa", "valor_orcamento", "estimativa_gastos", "mes_referencia", "ativo", "created_at", "updated_at"],
  veiculos: ["id", "user_id", "marca", "modelo", "ano", "placa", "cor", "combustivel", "quilometragem", "data_aquisicao", "created_at", "updated_at"],
  tipos_manutencao: ["id", "user_id", "nome", "descricao", "sistema", "intervalo_km", "created_at", "updated_at"],
  manutencoes: ["id", "user_id", "veiculo_id", "tipo_manutencao_id", "data_proxima", "data_realizada", "quilometragem_proxima", "quilometragem_realizada", "status", "observacoes", "created_at", "updated_at"],
  ia_configuracoes: ["id", "user_id", "api_key", "modelo", "created_at", "updated_at"],
  ia_uploads: ["id", "user_id", "file_name", "file_size", "file_type", "storage_path", "created_at", "updated_at"],
  ia_analysis_results: ["id", "user_id", "upload_id", "file_name", "descricao", "valor", "data", "tipo", "categoria", "categoria_id", "confianca", "status", "created_at", "updated_at"],

  achievements: ["achievement_type", "description", "icon", "id", "points", "title", "unlocked_at", "user_id"],
  app_settings: ["allow_registration", "created_at", "id", "updated_at"],
  app_settings_logs: ["changed_by", "created_at", "id", "new_value", "old_value", "setting_key"],
  banks: [
    "account_number", "account_type", "agency", "bank_slug", "color", "created_at", "current_balance", "id",
    "initial_balance", "is_active", "logo_url", "name", "notes", "opening_date", "profile_type", "updated_at", "user_id",
  ],
  categories: ["color", "created_at", "icon", "id", "is_default", "name", "profile_type", "user_id"],
  cookie_consents: ["consent_date", "id", "preferences", "updated_at", "user_id"],
  custom_goals: ["category", "color", "completed_at", "created_at", "current_amount", "deadline", "debt_id", "description", "destination_bank_id", "goal_mode", "icon", "id", "is_completed", "name", "profile_type", "target_amount", "updated_at", "user_id"],
  debt_payments: ["amount", "bank_id", "created_at", "debt_id", "id", "notes", "payment_date", "payment_method", "profile_type", "transaction_id", "user_id"],
  debts: ["created_at", "creditor", "current_balance", "due_day", "id", "interest_rate", "minimum_payment", "name", "notes", "profile_type", "start_date", "status", "total_amount", "updated_at", "user_id"],
  emergency_goals: ["created_at", "current_amount", "goal_type", "id", "target_amount", "target_months", "updated_at", "user_id"],
  evolution_api_config: ["api_key", "api_url", "created_at", "id", "instance_name", "updated_at"],
  fixed_costs: ["amount", "category_id", "created_at", "id", "is_variable", "name", "updated_at", "user_id"],
  mercado_pago_config: ["access_token", "created_at", "id", "is_active", "public_key", "updated_at", "webhook_secret"],
  notes: ["color", "content", "created_at", "id", "is_pinned", "title", "updated_at", "user_id"],
  openai_config: ["api_key", "created_at", "id", "model", "updated_at"],
  payments: [
    "amount", "billing_period", "br_code", "created_at", "expires_at", "id", "mercadopago_payment_id",
    "mercadopago_preference_id", "paid_at", "payment_link", "payment_method", "plan_id", "qr_code", "qr_code_base64",
    "status", "subscription_id", "updated_at", "user_id",
  ],
  plans: [
    "advanced_dashboard_enabled", "annual_projection_enabled", "business_profile_enabled", "cashflow_projection_enabled",
    "created_at", "description", "export_enabled", "features", "history_months", "id", "is_active", "max_banks",
    "max_goals", "max_reminders", "monthly_planning_enabled", "name", "plan_type", "price_monthly", "price_yearly",
    "reports_enabled", "split_enabled", "updated_at", "whatsapp_enabled",
  ],
  price_records: ["created_at", "date", "id", "price", "product_id", "quantity", "store_id", "user_id"],
  products: ["category", "created_at", "icon", "id", "name", "unit", "user_id"],
  reminders: [
    "created_at", "day_of_month", "day_of_week", "days_before", "id", "is_active", "last_sent_at", "message",
    "next_send_at", "reference_id", "reminder_type", "time_of_day", "title", "updated_at", "user_id",
  ],
  shopping_list_items: ["category", "created_at", "id", "is_purchased", "name", "order_index", "quantity", "unit", "updated_at", "user_id"],
  smart_alerts_config: ["alert_type", "created_at", "frequency", "id", "is_active", "last_triggered_at", "threshold", "updated_at", "user_id"],
  smart_indicators_logs: ["generated_at", "id", "indicator_type", "status", "user_id", "value"],
  split_rules: ["business_percentage", "created_at", "id", "is_active", "name", "personal_percentage", "reserve_percentage", "user_id"],
  stores: ["color", "created_at", "id", "location", "name", "user_id"],
  subscriptions: ["billing_period", "canceled_at", "created_at", "current_period_end", "current_period_start", "id", "plan_id", "status", "updated_at", "user_id"],
  transactions: [
    "amount", "bank_id", "business_amount", "category_id", "created_at", "date", "description", "id", "income_type",
    "is_essential", "personal_amount", "profile_type", "reserve_amount", "split_applied", "tags", "transaction_time",
    "payment_method", "type", "updated_at", "user_id",
  ],
  user_balance: ["available_balance", "created_at", "id", "updated_at", "user_id"],
  user_roles: ["created_at", "id", "role", "user_id"],
  whatsapp_config: ["api_key", "api_url", "connected_at", "created_at", "id", "instance_name", "is_connected", "phone_number", "updated_at", "user_id"],
  whatsapp_messages_log: ["created_at", "error_message", "id", "message_content", "message_type", "reminder_id", "sent_at", "status", "user_id"],
  woovi_config: ["api_key", "created_at", "id", "is_active", "updated_at"],
};

export const BOOLEAN_COLUMNS = new Set([
  "ativa",
  "ativo",
  "allow_registration",
  "business_profile_enabled",
  "cashflow_projection_enabled",
  "advanced_dashboard_enabled",
  "annual_projection_enabled",
  "export_enabled",
  "is_active",
  "is_blocked",
  "is_completed",
  "is_connected",
  "is_default",
  "is_essential",
  "is_pinned",
  "is_purchased",
  "is_variable",
  "monthly_planning_enabled",
  "onboarding_completed",
  "recorrente",
  "reports_enabled",
  "split_applied",
  "split_enabled",
  "whatsapp_enabled",
  "whatsapp_notifications_enabled",
]);

export function assertTable(table) {
  if (!Object.prototype.hasOwnProperty.call(TABLE_COLUMNS, table)) {
    const error = new Error(`Tabela nao permitida: ${table}`);
    error.status = 400;
    throw error;
  }
}

export function assertColumn(table, column) {
  assertTable(table);
  if (!TABLE_COLUMNS[table].includes(column)) {
    const error = new Error(`Coluna nao permitida: ${table}.${column}`);
    error.status = 400;
    throw error;
  }
}

export function pickAllowedColumns(table, data) {
  assertTable(table);
  const allowed = new Set(TABLE_COLUMNS[table].filter((column) => column !== "created_at" && column !== "updated_at"));
  return Object.fromEntries(
    Object.entries(data || {}).filter(([key, value]) => allowed.has(key) && value !== undefined),
  );
}

export function normalizeRow(row) {
  if (!row || typeof row !== "object") return row;
  const normalized = { ...row };
  for (const key of Object.keys(normalized)) {
    if (BOOLEAN_COLUMNS.has(key) && normalized[key] !== null && normalized[key] !== undefined) {
      normalized[key] = Boolean(normalized[key]);
    }
    if (typeof normalized[key] === "string" && ["features", "preferences", "tags"].includes(key)) {
      try {
        normalized[key] = JSON.parse(normalized[key]);
      } catch {
        // Keep plain strings as-is.
      }
    }
  }
  return normalized;
}
