alter table profiles add column if not exists email varchar(255) null;
alter table profiles add column if not exists full_name varchar(255) null;
alter table profiles add column if not exists is_blocked boolean not null default false;
alter table profiles add column if not exists onboarding_completed boolean not null default false;
alter table profiles add column if not exists phone_number varchar(50) null;
alter table profiles add column if not exists whatsapp_notifications_enabled boolean not null default false;
update profiles set id = user_id where user_id is not null and id <> user_id;
update profiles set full_name = coalesce(full_name, name), email = coalesce(email, (select users.email from users where users.id = profiles.user_id limit 1));

create table if not exists achievements (
  id char(36) primary key,
  user_id char(36) not null,
  achievement_type varchar(120) not null,
  title varchar(255) not null,
  description text null,
  icon varchar(80) null,
  points int null default 0,
  unlocked_at datetime null,
  index idx_achievements_user (user_id),
  constraint fk_achievements_user foreign key (user_id) references users(id) on delete cascade
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists app_settings (
  id char(36) primary key,
  allow_registration boolean not null default true,
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists app_settings_logs (
  id char(36) primary key,
  changed_by char(36) null,
  setting_key varchar(120) not null,
  old_value text null,
  new_value text null,
  created_at timestamp not null default current_timestamp
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

insert into app_settings (id, allow_registration)
select uuid(), true where not exists (select 1 from app_settings);

create table if not exists banks (
  id char(36) primary key,
  user_id char(36) not null,
  name varchar(255) not null,
  logo_url text null,
  bank_slug varchar(160) null,
  initial_balance decimal(14,2) not null default 0,
  current_balance decimal(14,2) not null default 0,
  account_type varchar(80) null,
  agency varchar(80) null,
  account_number varchar(120) null,
  color varchar(40) null,
  notes text null,
  opening_date date null,
  is_active boolean not null default true,
  profile_type varchar(30) not null default 'personal',
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp,
  index idx_banks_user_profile (user_id, profile_type),
  constraint fk_banks_user foreign key (user_id) references users(id) on delete cascade
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists categories (
  id char(36) primary key,
  user_id char(36) null,
  name varchar(255) not null,
  color varchar(40) null,
  icon varchar(80) null,
  is_default boolean not null default false,
  profile_type varchar(30) null default 'personal',
  created_at timestamp null default current_timestamp,
  index idx_categories_user_profile (user_id, profile_type)
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists transactions (
  id char(36) primary key,
  user_id char(36) not null,
  category_id char(36) null,
  bank_id char(36) null,
  description varchar(500) not null,
  amount decimal(14,2) not null,
  date date not null,
  transaction_time time null,
  type varchar(40) not null,
  profile_type varchar(30) not null default 'personal',
  personal_amount decimal(14,2) null,
  business_amount decimal(14,2) null,
  reserve_amount decimal(14,2) null,
  split_applied boolean not null default false,
  is_essential boolean null,
  income_type varchar(120) null,
  tags json null,
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp,
  index idx_transactions_user_date (user_id, date),
  constraint fk_transactions_user foreign key (user_id) references users(id) on delete cascade,
  constraint fk_transactions_category foreign key (category_id) references categories(id) on delete set null,
  constraint fk_transactions_bank foreign key (bank_id) references banks(id) on delete set null
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists user_balance (
  id char(36) primary key,
  user_id char(36) not null unique,
  available_balance decimal(14,2) not null default 0,
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp,
  constraint fk_user_balance_user foreign key (user_id) references users(id) on delete cascade
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists emergency_goals (
  id char(36) primary key,
  user_id char(36) not null unique,
  current_amount decimal(14,2) not null default 0,
  target_amount decimal(14,2) not null default 0,
  target_months int not null default 6,
  goal_type varchar(80) null default 'fixed_costs',
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp,
  constraint fk_emergency_goals_user foreign key (user_id) references users(id) on delete cascade
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists fixed_costs (
  id char(36) primary key,
  user_id char(36) not null,
  category_id char(36) null,
  name varchar(255) not null,
  amount decimal(14,2) not null default 0,
  is_variable boolean not null default false,
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp,
  index idx_fixed_costs_user (user_id),
  constraint fk_fixed_costs_user foreign key (user_id) references users(id) on delete cascade
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists split_rules (
  id char(36) primary key,
  user_id char(36) not null,
  name varchar(255) not null,
  personal_percentage decimal(5,2) not null default 50,
  business_percentage decimal(5,2) not null default 40,
  reserve_percentage decimal(5,2) not null default 10,
  is_active boolean not null default true,
  created_at timestamp not null default current_timestamp,
  index idx_split_rules_user (user_id),
  constraint fk_split_rules_user foreign key (user_id) references users(id) on delete cascade
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists custom_goals (
  id char(36) primary key,
  user_id char(36) not null,
  name varchar(255) not null,
  description text null,
  target_amount decimal(14,2) not null default 0,
  current_amount decimal(14,2) not null default 0,
  deadline date null,
  category varchar(120) null,
  color varchar(40) null,
  icon varchar(80) null,
  is_completed boolean not null default false,
  completed_at datetime null,
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp,
  index idx_custom_goals_user (user_id),
  constraint fk_custom_goals_user foreign key (user_id) references users(id) on delete cascade
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists debts (
  id char(36) primary key,
  user_id char(36) not null,
  name varchar(255) not null,
  creditor varchar(255) null,
  total_amount decimal(14,2) not null default 0,
  current_balance decimal(14,2) not null default 0,
  minimum_payment decimal(14,2) not null default 0,
  interest_rate decimal(8,4) null default 0,
  due_day int null,
  start_date date null,
  status varchar(40) not null default 'active',
  profile_type varchar(30) not null default 'personal',
  notes text null,
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp,
  index idx_debts_user (user_id),
  constraint fk_debts_user foreign key (user_id) references users(id) on delete cascade
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists debt_payments (
  id char(36) primary key,
  user_id char(36) not null,
  debt_id char(36) not null,
  amount decimal(14,2) not null,
  payment_date date not null,
  notes text null,
  created_at timestamp not null default current_timestamp,
  index idx_debt_payments_debt (debt_id),
  constraint fk_debt_payments_user foreign key (user_id) references users(id) on delete cascade,
  constraint fk_debt_payments_debt foreign key (debt_id) references debts(id) on delete cascade
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists notes (
  id char(36) primary key,
  user_id char(36) not null,
  title varchar(255) not null,
  content text null,
  color varchar(40) null,
  is_pinned boolean not null default false,
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp,
  index idx_notes_user (user_id),
  constraint fk_notes_user foreign key (user_id) references users(id) on delete cascade
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists stores (
  id char(36) primary key,
  user_id char(36) not null,
  name varchar(255) not null,
  location varchar(255) null,
  color varchar(40) null,
  created_at timestamp not null default current_timestamp,
  constraint fk_stores_user foreign key (user_id) references users(id) on delete cascade
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists products (
  id char(36) primary key,
  user_id char(36) not null,
  name varchar(255) not null,
  category varchar(255) null,
  unit varchar(80) null,
  icon varchar(80) null,
  created_at timestamp not null default current_timestamp,
  constraint fk_products_user foreign key (user_id) references users(id) on delete cascade
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists price_records (
  id char(36) primary key,
  user_id char(36) not null,
  product_id char(36) null,
  store_id char(36) null,
  price decimal(14,2) not null,
  quantity decimal(14,3) not null default 1,
  date date not null,
  created_at timestamp not null default current_timestamp,
  constraint fk_price_records_user foreign key (user_id) references users(id) on delete cascade
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists shopping_list_items (
  id char(36) primary key,
  user_id char(36) not null,
  name varchar(255) not null,
  quantity decimal(14,3) not null default 1,
  unit varchar(80) null,
  category varchar(255) null,
  is_purchased boolean not null default false,
  order_index int not null default 0,
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp,
  constraint fk_shopping_items_user foreign key (user_id) references users(id) on delete cascade
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists reminders (
  id char(36) primary key,
  user_id char(36) not null,
  title varchar(255) not null,
  message text null,
  reminder_type varchar(80) not null default 'custom',
  reference_id char(36) null,
  days_before int null,
  day_of_month int null,
  day_of_week int null,
  time_of_day time null,
  next_send_at datetime null,
  last_sent_at datetime null,
  is_active boolean not null default true,
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp,
  constraint fk_reminders_user foreign key (user_id) references users(id) on delete cascade
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists whatsapp_config (
  id char(36) primary key,
  user_id char(36) not null,
  api_url text null,
  api_key text null,
  instance_name varchar(255) null,
  phone_number varchar(50) null,
  is_connected boolean not null default false,
  connected_at datetime null,
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp,
  constraint fk_whatsapp_config_user foreign key (user_id) references users(id) on delete cascade
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists whatsapp_messages_log (
  id char(36) primary key,
  user_id char(36) not null,
  reminder_id char(36) null,
  message_type varchar(80) null,
  message_content text null,
  status varchar(80) not null default 'pending',
  error_message text null,
  sent_at datetime null,
  created_at timestamp not null default current_timestamp,
  constraint fk_whatsapp_log_user foreign key (user_id) references users(id) on delete cascade
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists plans (
  id char(36) primary key,
  name varchar(120) not null,
  description text null,
  plan_type varchar(60) not null default 'starter',
  price_monthly int not null default 0,
  price_yearly int not null default 0,
  max_banks int not null default 999,
  max_goals int not null default 1,
  max_reminders int not null default 3,
  features json null,
  is_active boolean not null default true,
  whatsapp_enabled boolean not null default false,
  reports_enabled boolean not null default false,
  cashflow_projection_enabled boolean not null default false,
  export_enabled boolean not null default false,
  split_enabled boolean not null default false,
  business_profile_enabled boolean not null default false,
  advanced_dashboard_enabled boolean not null default false,
  annual_projection_enabled boolean not null default false,
  history_months int not null default 3,
  monthly_planning_enabled boolean not null default false,
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

insert into plans (id, name, description, plan_type, max_banks)
select uuid(), 'Starter', 'Plano inicial', 'starter', 999 where not exists (select 1 from plans);

create table if not exists subscriptions (
  id char(36) primary key,
  user_id char(36) not null,
  plan_id char(36) null,
  status varchar(60) not null default 'active',
  billing_period varchar(40) not null default 'monthly',
  current_period_start datetime null,
  current_period_end datetime null,
  canceled_at datetime null,
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp,
  constraint fk_subscriptions_user foreign key (user_id) references users(id) on delete cascade
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists payments (
  id char(36) primary key,
  user_id char(36) null,
  subscription_id char(36) null,
  plan_id char(36) null,
  amount int not null default 0,
  status varchar(60) not null default 'pending',
  billing_period varchar(40) null,
  payment_method varchar(80) null,
  payment_link text null,
  qr_code text null,
  qr_code_base64 longtext null,
  br_code text null,
  mercadopago_payment_id varchar(255) null,
  mercadopago_preference_id varchar(255) null,
  paid_at datetime null,
  expires_at datetime null,
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists user_roles (
  id char(36) primary key,
  user_id char(36) not null,
  role varchar(40) not null default 'user',
  created_at timestamp not null default current_timestamp,
  unique key idx_user_roles_user_role (user_id, role),
  constraint fk_user_roles_user foreign key (user_id) references users(id) on delete cascade
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

insert ignore into user_roles (id, user_id, role)
select uuid(), id, 'admin' from users where role = 'superadmin';

create table if not exists openai_config (
  id char(36) primary key,
  api_key text null,
  model varchar(120) null,
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists evolution_api_config (
  id char(36) primary key,
  api_url text null,
  api_key text null,
  instance_name varchar(255) null,
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists mercado_pago_config (
  id char(36) primary key,
  access_token text null,
  public_key text null,
  webhook_secret text null,
  is_active boolean not null default false,
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists cookie_consents (
  id char(36) primary key,
  user_id char(36) null,
  preferences json null,
  consent_date datetime null,
  updated_at timestamp null default current_timestamp on update current_timestamp
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists smart_alerts_config (
  id char(36) primary key,
  user_id char(36) not null,
  alert_type varchar(120) not null,
  threshold decimal(14,2) null,
  frequency varchar(80) null,
  is_active boolean not null default true,
  last_triggered_at datetime null,
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp,
  constraint fk_smart_alerts_user foreign key (user_id) references users(id) on delete cascade
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table if not exists smart_indicators_logs (
  id char(36) primary key,
  user_id char(36) not null,
  indicator_type varchar(120) not null,
  value decimal(14,2) null,
  status varchar(80) null,
  generated_at timestamp not null default current_timestamp,
  constraint fk_smart_logs_user foreign key (user_id) references users(id) on delete cascade
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;
