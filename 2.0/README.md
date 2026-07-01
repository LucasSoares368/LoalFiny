# 💙 Financeiro Pro

Plataforma completa de gestão financeira pessoal e profissional, com dashboards inteligentes, controle de bancos, dívidas, metas, reserva de emergência, lista de mercado, relatórios avançados, integração com WhatsApp e Assistente Virtual com IA.

> Construído com **React + Vite + TypeScript + Tailwind + shadcn/ui** e backend em **Supabase Cloud**.

---

## 📑 Sumário

1. [Visão Geral](#-visão-geral)
2. [Principais Funcionalidades](#-principais-funcionalidades)
3. [Stack Tecnológica](#-stack-tecnológica)
4. [Arquitetura](#-arquitetura)
5. [Estrutura de Pastas](#-estrutura-de-pastas)
6. [Rotas da Aplicação](#-rotas-da-aplicação)
7. [Banco de Dados](#-banco-de-dados)
8. [Edge Functions](#-edge-functions)
9. [Planos e Limites](#-planos-e-limites)
10. [Integrações Externas](#-integrações-externas)
11. [Segurança](#-segurança)
12. [Como Executar Localmente](#-como-executar-localmente)
13. [Deploy](#-deploy)
14. [Painel Administrativo](#-painel-administrativo)

---

## 🎯 Visão Geral

O **Financeiro Pro** é uma aplicação SaaS multi-perfil (Pessoal, Reserva, Empresarial) que ajuda o usuário a:

- Controlar receitas, despesas, contas bancárias e dívidas
- Visualizar indicadores financeiros inteligentes
- Planejar reserva de emergência e metas customizadas
- Acompanhar preços de produtos no mercado
- Receber lembretes e alertas via WhatsApp
- Conversar com um Assistente Virtual de IA sobre suas finanças
- Importar extratos via OCR (imagem) ou PDF
- Operar em três planos comerciais: **Free**, **Pro** e **Business**

---

## ✨ Principais Funcionalidades

### 💼 Gestão Financeira
- Lançamentos de receita/despesa com categorização e tags
- Múltiplos perfis: Pessoal, Reserva, Empresarial
- Bancos com saldo inicial e atual, divididos por perfil
- Regras de Split automático (45/45/10 por padrão, configurável)
- Controle de dívidas com cálculo de juros e pagamentos parciais

### 📊 Dashboards e Indicadores
- Resumo mensal consolidado por perfil
- Gráficos de fluxo de caixa e evolução de saldo
- Indicadores Inteligentes (taxa de poupança, % gastos essenciais, etc.)
- Notícias financeiras e cotações de mercado em tempo real

### 🎯 Metas e Reserva de Emergência
- Metas customizadas com progresso e prazo
- Cálculo automático de meta da reserva de emergência baseada em custos fixos
- Análise de custos variáveis

### 🛒 Mercado / Lista de Compras
- Cadastro de produtos, lojas e registros de preço
- Comparativo de preços entre lojas
- Lista de compras com reordenação drag-and-drop

### 📱 WhatsApp & Lembretes
- Integração com Evolution API
- Lembretes recorrentes (diário, semanal, mensal)
- Alertas inteligentes automáticos (gastos acima da média, contas vencendo)
- Plano **Pro** limitado a 3 lembretes; **Business** ilimitado

### 🤖 Assistente Virtual com IA
- Chat com OpenAI (GPT-4o / GPT-4o-mini)
- Importação de transações por imagem (OCR) ou PDF
- Conquistas (achievements) gamificadas

### 💳 Pagamentos
- Integração com **Mercado Pago** (Pix)
- Webhook assíncrono para confirmação automática de assinaturas
- Histórico completo de pagamentos no Admin

---

## 🧱 Stack Tecnológica

| Camada | Tecnologias |
|--------|-------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Radix UI |
| Animação | Framer Motion |
| Formulários | React Hook Form + Zod |
| Estado / Cache | TanStack React Query |
| Roteamento | React Router DOM (HashRouter) |
| Charts | Recharts |
| Backend | Supabase Cloud (Supabase: Postgres, Auth, Storage, Edge Functions) |
| IA | OpenAI (GPT-4o, GPT-4o-mini) |
| Mensageria | Evolution API (WhatsApp) |
| Pagamentos | Mercado Pago (Pix) |
| PWA | vite-plugin-pwa |

---

## 🏗 Arquitetura

```text
┌──────────────────────┐        ┌────────────────────────┐
│    React SPA (PWA)   │◄──────►│  Supabase Cloud         │
│  Vite + Tailwind     │  RPC   │  ├─ Postgres (RLS)     │
│  shadcn/ui           │  REST  │  ├─ Auth (email+Google)│
│  Hash Router         │ Realtime│ ├─ Storage             │
└────────┬─────────────┘        │  └─ Edge Functions     │
         │                       └─────────┬──────────────┘
         │                                 │
         │                ┌────────────────┼─────────────────┐
         │                │                │                 │
         ▼                ▼                ▼                 ▼
   ┌──────────┐    ┌────────────┐   ┌──────────────┐  ┌────────────┐
   │ OpenAI   │    │ Evolution  │   │ Mercado Pago │  │ APIs Cotação│
   │ GPT-4o   │    │ API (WApp) │   │  (Pix)       │  │  e Notícias │
   └──────────┘    └────────────┘   └──────────────┘  └────────────┘
```

- **Frontend** consome diretamente o cliente Supabase para CRUD com RLS.
- **Edge Functions** executam lógica sensível (validação de signup, OCR, IA, webhooks).
- **RLS (Row-Level Security)** garante isolamento de dados por usuário.

---

## 📁 Estrutura de Pastas

```text
src/
├── components/
│   ├── admin/            # Controles do painel administrativo
│   ├── auth/             # Captcha, PasswordInput
│   ├── banks/            # Cards e formulários de bancos
│   ├── calculator/       # Calculadora financeira e conversor
│   ├── dashboard/        # Cards, gráficos e widgets do dashboard
│   ├── debts/            # Gestão de dívidas
│   ├── emergency/        # Reserva de emergência e custos
│   ├── landing/          # Header, Hero, Pricing, Footer da homepage
│   ├── layout/           # AppLayout, Sidebar, LegalLayout
│   ├── market/           # Lista de compras, lojas, produtos
│   ├── plans/            # Limites, prompts de upgrade, modal de pagamento
│   ├── profile/          # Configurações do perfil
│   ├── reports/          # Filtros e visões anuais
│   ├── ui/               # shadcn/ui (button, card, dialog, etc.)
│   └── whatsapp/         # Configuração de WhatsApp e lembretes
├── contexts/             # Contextos React (CookieConsent)
├── hooks/                # Hooks reutilizáveis (useUserPlan, useAdmin, etc.)
├── integrations/
│   └── supabase/         # Cliente, tipos e middlewares Supabase
├── lib/                  # Utilitários
├── pages/                # Páginas roteáveis
└── assets/               # Imagens e ícones

supabase/
├── functions/            # Edge Functions (Deno)
└── config.toml           # Configuração de funções
```

---

## 🛣 Rotas da Aplicação

A aplicação utiliza **HashRouter** (`#/rota`).

### Públicas
- `/` — Landing page
- `/auth` — Login / Cadastro / Recuperação de senha
- `/reset-password` — Definição de nova senha
- `/terms` — Termos de uso
- `/privacy` — Política de privacidade
- `/install` — Instruções para instalar como PWA

### Autenticadas
- `/dashboard` — Visão geral financeira
- `/transactions` — Lançamentos
- `/categories` — Categorias personalizadas
- `/banks` — Contas bancárias
- `/debts` — Dívidas e pagamentos
- `/goals` — Metas customizadas
- `/emergency` — Reserva de emergência
- `/independence-map` — Mapa de independência financeira
- `/reports` — Relatórios avançados
- `/market` — Lista de compras e preços
- `/import` — Importação de extratos (OCR/PDF)
- `/whatsapp` — Configuração WhatsApp e lembretes
- `/ai-chat` — Assistente Virtual
- `/notes` — Anotações pessoais
- `/split-config` — Regras de divisão de receita
- `/upgrade` — Página de upgrade de plano

### Admin
- `/admin` — Painel administrativo (somente role `admin`)

---

## 🗄 Banco de Dados

Principais tabelas (todas protegidas por **RLS**):

| Tabela | Descrição |
|--------|-----------|
| `profiles` | Dados do usuário (nome, telefone, bloqueio) |
| `user_roles` | Papéis (`admin`, `user`) — separados por segurança |
| `app_settings` | Configurações globais (ex.: `allow_registration`) |
| `app_settings_logs` | Histórico de alterações de configurações |
| `plans` | Definição dos planos (Free, Pro, Business) e limites |
| `subscriptions` | Assinaturas ativas dos usuários |
| `payments` | Histórico de pagamentos Mercado Pago |
| `mercado_pago_config` | Credenciais Mercado Pago (admin) |
| `transactions` | Lançamentos financeiros |
| `categories` | Categorias de receita/despesa |
| `banks` | Contas bancárias do usuário |
| `debts` / `debt_payments` | Dívidas e pagamentos |
| `custom_goals` | Metas personalizadas |
| `emergency_goals` | Reserva de emergência |
| `fixed_costs` | Custos fixos mensais |
| `user_balance` | Saldo consolidado |
| `split_rules` | Regras de divisão (Pessoal/Reserva/Empresarial) |
| `products` / `stores` / `price_records` | Mercado |
| `shopping_list_items` | Lista de compras |
| `notes` | Anotações pessoais |
| `reminders` | Lembretes WhatsApp |
| `smart_alerts_config` | Configuração de alertas inteligentes |
| `smart_indicators_logs` | Logs dos indicadores inteligentes |
| `whatsapp_config` | Conexão WhatsApp do usuário |
| `whatsapp_messages_log` | Histórico de mensagens enviadas |
| `evolution_api_config` | Credenciais Evolution API (admin) |
| `openai_config` | Configuração OpenAI (admin) |
| `cookie_consents` | Consentimento de cookies (LGPD) |
| `achievements` | Conquistas gamificadas |

### Funções de Banco (RPC)
- `has_role(user_id, role)` — Verifica role com SECURITY DEFINER
- `get_user_role(user_id)` — Retorna role do usuário
- `get_user_plan(user_id)` — Retorna plano consolidado (limites + features)
- `user_has_feature(user_id, feature)` — Verifica acesso a uma feature
- `update_app_setting(allow_registration)` — Admin: atualiza config global com log
- `handle_new_user()` — Trigger de criação inicial (perfil + reserva + saldo)
- `handle_new_user_role()` — Atribui role `admin` ao primeiro usuário
- `check_goal_completion()` — Atualiza status de metas
- `update_updated_at_column()` — Trigger genérico de timestamp

---

## ⚡ Edge Functions

Localizadas em `supabase/functions/`:

| Função | Propósito | JWT |
|--------|-----------|-----|
| `validate-signup` | Valida cadastro (senha, captcha, e flag `allow_registration`) | público |
| `admin-settings` | CRUD admin de configs/planos/pagamentos | autenticado |
| `ai-chat` | Chat com OpenAI | autenticado |
| `process-transaction-image` | OCR de comprovantes (IA) | público |
| `process-reminders` | Cron — dispara lembretes do WhatsApp | público |
| `process-smart-alerts` | Cron — gera alertas inteligentes | público |
| `send-whatsapp` | Envia mensagem via Evolution API | público |
| `evolution-api` | Proxy para administração da Evolution API | autenticado |
| `openai-config` | Gestão da chave OpenAI (admin) | autenticado |
| `get-exchange-rates` | Cotações de moedas | público |
| `get-financial-news` | Notícias financeiras | público |
| `get-market-quotes` | Cotações de ativos | público |
| `check-achievements` | Avalia e libera conquistas | autenticado |
| `create-mercadopago-checkout` | Cria checkout Pix/Cartão | público |
| `mercadopago-webhook` | Recebe webhook de pagamento | público |

---

## 💎 Planos e Limites

| Recurso | Free | Pro | Business |
|---------|:----:|:---:|:--------:|
| Bancos cadastrados | 2 | 5 | Ilimitado |
| Metas customizadas | 1 | 5 | Ilimitado |
| Lembretes WhatsApp | — | 3 | Ilimitado |
| Histórico (meses) | 3 | 12 | Ilimitado |
| Relatórios avançados | — | ✓ | ✓ |
| WhatsApp / IA | — | ✓ | ✓ |
| Projeção de fluxo de caixa | — | ✓ | ✓ |
| Exportação | — | ✓ | ✓ |
| Split / Perfil Empresarial | — | — | ✓ |
| Dashboard avançado | — | — | ✓ |
| Projeção anual | — | — | ✓ |
| Planejamento mensal | — | — | ✓ |

Limites são consultados via RPC `get_user_plan` e enforçados tanto no frontend (UI) quanto no backend (triggers/edge functions).

---

## 🔌 Integrações Externas

- **OpenAI** — IA conversacional, OCR e análise de PDFs
- **Evolution API** — Envio de mensagens WhatsApp
- **Mercado Pago** — Pagamentos Pix e cartão
- **APIs públicas** — Cotações e notícias financeiras

Todas as credenciais sensíveis são armazenadas como **Secrets** no Supabase Cloud ou em tabelas administrativas com RLS restrito a admins.

---

## 🔒 Segurança

- **RLS (Row-Level Security)** habilitada em todas as tabelas de usuário
- **Roles** armazenadas em tabela separada (`user_roles`) para evitar privilege escalation
- **SECURITY DEFINER** em funções de verificação de role
- **Captcha** anti-spam no cadastro
- **Validação server-side** de senha forte (mín. 8, maiúscula, minúscula, número, caractere especial)
- **HIBP Check** (proteção contra senhas vazadas) disponível
- **Bloqueio global de cadastro** controlável pelo admin (`app_settings.allow_registration`)
- **Bloqueio de usuário** via `profiles.is_blocked`
- **LGPD** — Consentimento de cookies com granularidade por categoria
- **Webhooks** com verificação de assinatura (Mercado Pago)

---

## 🚀 Como Executar Localmente

**Requisitos:** Node.js 18+ e npm.

```bash
# 1. Clonar o repositório
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
# O arquivo .env é gerado automaticamente pelo Supabase Cloud:
#   VITE_SUPABASE_URL
#   VITE_SUPABASE_PUBLISHABLE_KEY
#   VITE_SUPABASE_PROJECT_ID

# 4. Iniciar o dev server
npm run dev
```

Scripts disponíveis:

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento (Vite) |
| `npm run build` | Build de produção |
| `npm run build:dev` | Build com modo development |
| `npm run preview` | Preview do build |
| `npm run lint` | ESLint |

---

## 🛠 Painel Administrativo

Acessível em `/admin` somente para usuários com role `admin` (o primeiro usuário registrado recebe a role automaticamente).

Funcionalidades:

- **Usuários** — Listar, bloquear/desbloquear, alterar plano, excluir
- **Pagamentos** — Histórico paginado, alteração de status manual
- **Histórico Pix** — Detalhamento dos pagamentos via Mercado Pago
- **Configurações:**
  - Cadastro de novos usuários (habilitar/desabilitar global) + log de alterações
  - Evolution API (URL, API Key, instância) com teste de conexão
  - OpenAI (API Key e modelo) com teste de conexão
  - Mercado Pago (access token, public key)
  - Edição completa dos planos e limites

---

> Desenvolvido com 💙 para facilitar sua vida financeira.
