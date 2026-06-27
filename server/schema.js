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
]);

export const TABLE_COLUMNS = {
  profiles: ["id", "user_id", "name", "organization_name", "telefone", "endereco", "avatar_url", "created_at", "updated_at"],
  categorias: ["id", "user_id", "nome", "tipo", "cor", "icone", "created_at", "updated_at"],
  categorias_mercado: ["id", "user_id", "nome", "descricao", "cor", "ativa", "created_at", "updated_at"],
  categorias_metas: ["id", "user_id", "nome", "descricao", "cor", "ativa", "created_at", "updated_at"],
  bank_accounts: ["id", "user_id", "name", "bank_name", "account_type", "balance", "balance_reference_date", "account_holder_name", "provider", "external_id", "last_sync_at", "created_at", "updated_at"],
  cards: ["id", "user_id", "name", "issuer_bank", "bank_code", "bank_name", "bank_slug", "brand_color", "card_holder_name", "credit_limit", "closing_day", "due_day", "provider", "external_id", "last_sync_at", "created_at", "updated_at"],
  transacoes: ["id", "user_id", "categoria_id", "descricao", "valor", "data", "tipo", "created_at", "updated_at"],
  receitas: ["id", "user_id", "categoria_id", "bank_account_id", "descricao", "valor", "data", "recorrente", "dia_recorrencia", "receita_pai_id", "frequencia_recorrencia", "data_fim_recorrencia", "forma_pagamento", "status_recebimento", "tipo_receita", "created_at", "updated_at"],
  despesas: ["id", "user_id", "categoria_id", "descricao", "valor", "data", "status", "status_pagamento", "tipo_despesa", "forma_pagamento", "cartao_id", "numero_parcelas", "data_primeira_parcela", "data_vencimento", "data_pagamento", "recorrente", "frequencia_recorrencia", "dia_recorrencia", "data_fim_recorrencia", "despesa_pai_id", "installment_group_id", "installment_index", "installments_total", "created_at", "updated_at"],
  metas: ["id", "user_id", "categoria_meta_id", "titulo", "descricao", "valor_alvo", "valor_atual", "data_inicio", "data_limite", "tipo", "status", "created_at", "updated_at"],
  itens_mercado: ["id", "user_id", "categoria_mercado_id", "descricao", "quantidade_atual", "quantidade_ideal", "unidade_medida", "preco_atual", "status", "created_at", "updated_at"],
  orcamentos_mercado: ["id", "user_id", "categoria_despesa", "valor_orcamento", "estimativa_gastos", "mes_referencia", "ativo", "created_at", "updated_at"],
  veiculos: ["id", "user_id", "marca", "modelo", "ano", "placa", "cor", "combustivel", "quilometragem", "data_aquisicao", "created_at", "updated_at"],
  tipos_manutencao: ["id", "user_id", "nome", "descricao", "sistema", "intervalo_km", "created_at", "updated_at"],
  manutencoes: ["id", "user_id", "veiculo_id", "tipo_manutencao_id", "data_proxima", "data_realizada", "quilometragem_proxima", "quilometragem_realizada", "status", "observacoes", "created_at", "updated_at"],
  ia_configuracoes: ["id", "user_id", "api_key", "modelo", "created_at", "updated_at"],
  ia_uploads: ["id", "user_id", "file_name", "file_size", "file_type", "storage_path", "created_at", "updated_at"],
  ia_analysis_results: ["id", "user_id", "upload_id", "file_name", "descricao", "valor", "data", "tipo", "categoria", "categoria_id", "confianca", "status", "created_at", "updated_at"],
};

export const BOOLEAN_COLUMNS = new Set([
  "ativa",
  "ativo",
  "recorrente",
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
  }
  return normalized;
}
