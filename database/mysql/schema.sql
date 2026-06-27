create table if not exists users (
  id char(36) primary key,
  email varchar(255) not null unique,
  password_hash varchar(255) not null,
  role enum('user','superadmin') not null default 'user',
  name varchar(255) null,
  organization_name varchar(255) null,
  telefone varchar(50) null,
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists profiles (
  id char(36) primary key,
  user_id char(36) not null unique,
  name varchar(255) not null,
  organization_name varchar(255) null,
  telefone varchar(50) null,
  endereco text null,
  avatar_url text null,
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp,
  constraint fk_profiles_user foreign key (user_id) references users(id) on delete cascade
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists categorias (
  id char(36) primary key,
  user_id char(36) not null,
  nome varchar(255) not null,
  tipo enum('receita','despesa') not null,
  cor varchar(40) null,
  icone varchar(80) null,
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp,
  index idx_categorias_user_nome (user_id, nome),
  constraint fk_categorias_user foreign key (user_id) references users(id) on delete cascade
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists categorias_mercado (
  id char(36) primary key,
  user_id char(36) not null,
  nome varchar(255) not null,
  descricao text null,
  cor varchar(40) not null default '#f97316',
  ativa boolean not null default true,
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp,
  index idx_categorias_mercado_user_nome (user_id, nome),
  constraint fk_categorias_mercado_user foreign key (user_id) references users(id) on delete cascade
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists categorias_metas (
  id char(36) primary key,
  user_id char(36) not null,
  nome varchar(255) not null,
  descricao text null,
  cor varchar(40) not null default '#f97316',
  ativa boolean not null default true,
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp,
  index idx_categorias_metas_user_nome (user_id, nome),
  constraint fk_categorias_metas_user foreign key (user_id) references users(id) on delete cascade
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists bank_accounts (
  id char(36) primary key,
  user_id char(36) not null,
  name varchar(255) not null,
  bank_name varchar(255) not null,
  account_type enum('corrente','poupanca','investimento','digital') not null,
  balance decimal(14,2) not null default 0,
  balance_reference_date date null,
  account_holder_name varchar(255) null,
  provider varchar(120) null,
  external_id varchar(255) null,
  last_sync_at datetime null,
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp,
  index idx_bank_accounts_user_name (user_id, name),
  constraint fk_bank_accounts_user foreign key (user_id) references users(id) on delete cascade
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists cards (
  id char(36) primary key,
  user_id char(36) not null,
  name varchar(255) not null,
  issuer_bank varchar(255) null,
  bank_code varchar(50) null,
  bank_name varchar(255) null,
  bank_slug varchar(120) null,
  brand_color varchar(40) null,
  card_holder_name varchar(255) null,
  credit_limit decimal(14,2) not null default 0,
  closing_day int not null,
  due_day int not null,
  provider varchar(120) null,
  external_id varchar(255) null,
  last_sync_at datetime null,
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp,
  check (closing_day between 1 and 28),
  check (due_day between 1 and 28),
  check (credit_limit >= 0),
  index idx_cards_user_name (user_id, name),
  index idx_cards_user_bank_slug (user_id, bank_slug),
  constraint fk_cards_user foreign key (user_id) references users(id) on delete cascade
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists transacoes (
  id char(36) primary key,
  user_id char(36) not null,
  categoria_id char(36) null,
  descricao varchar(500) not null,
  valor decimal(14,2) not null,
  data date not null,
  tipo enum('receita','despesa') not null,
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp,
  index idx_transacoes_user_data (user_id, data),
  constraint fk_transacoes_user foreign key (user_id) references users(id) on delete cascade,
  constraint fk_transacoes_categoria foreign key (categoria_id) references categorias(id) on delete set null
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists receitas (
  id char(36) primary key,
  user_id char(36) not null,
  categoria_id char(36) null,
  bank_account_id char(36) null,
  descricao varchar(500) not null,
  valor decimal(14,2) not null,
  data date not null,
  recorrente boolean not null default false,
  dia_recorrencia int null,
  receita_pai_id char(36) null,
  frequencia_recorrencia enum('mensal','quinzenal','semanal') not null default 'mensal',
  data_fim_recorrencia date null,
  forma_pagamento varchar(120) null,
  status_recebimento enum('recebido','pendente') not null default 'recebido',
  tipo_receita enum('fixa','variavel') not null default 'variavel',
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp,
  check (dia_recorrencia is null or dia_recorrencia between 1 and 31),
  unique key receitas_lancamento_recorrente_unico_idx (receita_pai_id, data),
  index idx_receitas_user_data (user_id, data),
  index idx_receitas_user_bank_account (user_id, bank_account_id),
  constraint fk_receitas_user foreign key (user_id) references users(id) on delete cascade,
  constraint fk_receitas_categoria foreign key (categoria_id) references categorias(id) on delete set null,
  constraint fk_receitas_bank_account foreign key (bank_account_id) references bank_accounts(id) on delete set null,
  constraint fk_receitas_pai foreign key (receita_pai_id) references receitas(id) on delete cascade
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists despesas (
  id char(36) primary key,
  user_id char(36) not null,
  categoria_id char(36) null,
  descricao varchar(500) not null,
  valor decimal(14,2) not null,
  data date not null,
  status varchar(80) null,
  status_pagamento enum('pago','pendente') not null default 'pendente',
  tipo_despesa enum('fixa','variavel') not null default 'variavel',
  forma_pagamento enum('Dinheiro','Pix','Debito','Credito','Transferencia','Outro') null,
  cartao_id char(36) null,
  numero_parcelas int null,
  data_primeira_parcela date null,
  data_vencimento date null,
  data_pagamento date null,
  recorrente boolean not null default false,
  frequencia_recorrencia enum('mensal','quinzenal','semanal') not null default 'mensal',
  dia_recorrencia int null,
  data_fim_recorrencia date null,
  despesa_pai_id char(36) null,
  installment_group_id char(36) null,
  installment_index int null,
  installments_total int null,
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp,
  check (numero_parcelas is null or numero_parcelas >= 1),
  check (dia_recorrencia is null or dia_recorrencia between 1 and 31),
  check (installment_index is null or installment_index >= 1),
  check (installments_total is null or installments_total >= 1),
  check (installment_index is null or installments_total is null or installment_index <= installments_total),
  unique key idx_despesas_pai_data_unique (despesa_pai_id, data),
  index idx_despesas_user_data (user_id, data),
  index idx_despesas_status_pagamento (status_pagamento),
  index idx_despesas_cartao_id (cartao_id),
  index idx_despesas_installment_position (installment_group_id, installment_index),
  constraint fk_despesas_user foreign key (user_id) references users(id) on delete cascade,
  constraint fk_despesas_categoria foreign key (categoria_id) references categorias(id) on delete set null,
  constraint fk_despesas_card foreign key (cartao_id) references cards(id) on delete set null,
  constraint fk_despesas_pai foreign key (despesa_pai_id) references despesas(id) on delete cascade
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists metas (
  id char(36) primary key,
  user_id char(36) not null,
  categoria_meta_id char(36) null,
  titulo varchar(255) not null,
  descricao text null,
  valor_alvo decimal(14,2) not null,
  valor_atual decimal(14,2) not null default 0,
  data_inicio date not null,
  data_limite date not null,
  tipo varchar(80) not null,
  status varchar(80) not null,
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp,
  index idx_metas_user_limite (user_id, data_limite),
  constraint fk_metas_user foreign key (user_id) references users(id) on delete cascade,
  constraint fk_metas_categoria foreign key (categoria_meta_id) references categorias_metas(id) on delete set null
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists itens_mercado (
  id char(36) primary key,
  user_id char(36) not null,
  categoria_mercado_id char(36) null,
  descricao varchar(500) not null,
  quantidade_atual decimal(14,3) not null default 0,
  quantidade_ideal decimal(14,3) not null default 1,
  unidade_medida varchar(80) not null,
  preco_atual decimal(14,2) null,
  status varchar(80) not null,
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp,
  index idx_itens_mercado_user_descricao (user_id, descricao),
  constraint fk_itens_mercado_user foreign key (user_id) references users(id) on delete cascade,
  constraint fk_itens_mercado_categoria foreign key (categoria_mercado_id) references categorias_mercado(id) on delete set null
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists orcamentos_mercado (
  id char(36) primary key,
  user_id char(36) not null,
  categoria_despesa varchar(255) not null,
  valor_orcamento decimal(14,2) not null,
  estimativa_gastos decimal(14,2) not null default 0,
  mes_referencia varchar(20) not null,
  ativo boolean not null default true,
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp,
  index idx_orcamentos_mercado_user_mes (user_id, mes_referencia),
  constraint fk_orcamentos_mercado_user foreign key (user_id) references users(id) on delete cascade
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists veiculos (
  id char(36) primary key,
  user_id char(36) not null,
  marca varchar(255) not null,
  modelo varchar(255) not null,
  ano varchar(20) not null,
  placa varchar(30) null,
  cor varchar(80) null,
  combustivel varchar(80) null,
  quilometragem int not null default 0,
  data_aquisicao date null,
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp,
  index idx_veiculos_user_created (user_id, created_at),
  constraint fk_veiculos_user foreign key (user_id) references users(id) on delete cascade
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists tipos_manutencao (
  id char(36) primary key,
  user_id char(36) not null,
  nome varchar(255) not null,
  descricao text null,
  sistema varchar(120) not null,
  intervalo_km int not null default 0,
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp,
  index idx_tipos_manutencao_user_created (user_id, created_at),
  constraint fk_tipos_manutencao_user foreign key (user_id) references users(id) on delete cascade
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists manutencoes (
  id char(36) primary key,
  user_id char(36) not null,
  veiculo_id char(36) not null,
  tipo_manutencao_id char(36) not null,
  data_proxima date null,
  data_realizada date null,
  quilometragem_proxima int null,
  quilometragem_realizada int null,
  status varchar(80) not null,
  observacoes text null,
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp,
  index idx_manutencoes_user_status (user_id, status),
  constraint fk_manutencoes_user foreign key (user_id) references users(id) on delete cascade,
  constraint fk_manutencoes_veiculo foreign key (veiculo_id) references veiculos(id) on delete cascade,
  constraint fk_manutencoes_tipo foreign key (tipo_manutencao_id) references tipos_manutencao(id) on delete cascade
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists ia_configuracoes (
  id char(36) primary key,
  user_id char(36) not null unique,
  api_key text not null,
  modelo varchar(120) not null,
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp,
  constraint fk_ia_configuracoes_user foreign key (user_id) references users(id) on delete cascade
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists ia_uploads (
  id char(36) primary key,
  user_id char(36) not null,
  file_name varchar(255) not null,
  file_size bigint not null,
  file_type varchar(120) not null,
  storage_path text not null,
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp,
  constraint fk_ia_uploads_user foreign key (user_id) references users(id) on delete cascade
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists ia_analysis_results (
  id char(36) primary key,
  user_id char(36) not null,
  upload_id char(36) null,
  file_name varchar(255) not null,
  descricao varchar(500) not null,
  valor decimal(14,2) not null,
  data date not null,
  tipo varchar(80) not null,
  categoria varchar(255) not null,
  categoria_id char(36) null,
  confianca decimal(6,4) not null,
  status varchar(80) not null,
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp,
  index idx_ia_results_user_created (user_id, created_at),
  constraint fk_ia_results_user foreign key (user_id) references users(id) on delete cascade,
  constraint fk_ia_results_upload foreign key (upload_id) references ia_uploads(id) on delete set null,
  constraint fk_ia_results_categoria foreign key (categoria_id) references categorias(id) on delete set null
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

delimiter //
drop trigger if exists trg_receitas_balance_insert//
create trigger trg_receitas_balance_insert
after insert on receitas
for each row
begin
  if new.bank_account_id is not null and new.status_recebimento = 'recebido' then
    update bank_accounts
    set balance = balance + new.valor,
        balance_reference_date = coalesce(new.data, balance_reference_date)
    where id = new.bank_account_id;
  end if;
end//

drop trigger if exists trg_receitas_balance_update//
create trigger trg_receitas_balance_update
after update on receitas
for each row
begin
  if old.bank_account_id is not null and old.status_recebimento = 'recebido' then
    update bank_accounts set balance = balance - old.valor where id = old.bank_account_id;
  end if;
  if new.bank_account_id is not null and new.status_recebimento = 'recebido' then
    update bank_accounts
    set balance = balance + new.valor,
        balance_reference_date = coalesce(new.data, balance_reference_date)
    where id = new.bank_account_id;
  end if;
end//

drop trigger if exists trg_receitas_balance_delete//
create trigger trg_receitas_balance_delete
after delete on receitas
for each row
begin
  if old.bank_account_id is not null and old.status_recebimento = 'recebido' then
    update bank_accounts set balance = balance - old.valor where id = old.bank_account_id;
  end if;
end//
delimiter ;
