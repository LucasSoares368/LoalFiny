-- Create enum for profile types
DO $$ BEGIN
    CREATE TYPE public.profile_type AS ENUM ('personal', 'business');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add profile_type column to tables
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS profile_type public.profile_type NOT NULL DEFAULT 'personal';
ALTER TABLE public.banks ADD COLUMN IF NOT EXISTS profile_type public.profile_type NOT NULL DEFAULT 'personal';
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS profile_type public.profile_type DEFAULT 'personal';

-- Create debts table
CREATE TABLE IF NOT EXISTS public.debts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  creditor TEXT,
  total_amount NUMERIC NOT NULL,
  current_balance NUMERIC NOT NULL,
  interest_rate NUMERIC DEFAULT 0,
  minimum_payment NUMERIC,
  due_day INTEGER,
  start_date DATE DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active',
  profile_type public.profile_type NOT NULL DEFAULT 'personal',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own debts" ON public.debts;
CREATE POLICY "Users can manage own debts" ON public.debts FOR ALL USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_debts_updated_at ON public.debts;
CREATE TRIGGER update_debts_updated_at
  BEFORE UPDATE ON public.debts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create debt_payments table
CREATE TABLE IF NOT EXISTS public.debt_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  debt_id UUID NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.debt_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own debt payments" ON public.debt_payments;
CREATE POLICY "Users can manage own debt payments" ON public.debt_payments FOR ALL USING (auth.uid() = user_id);

-- Create shopping list items table
CREATE TABLE IF NOT EXISTS public.shopping_list_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity NUMERIC DEFAULT 1,
  unit TEXT DEFAULT 'un',
  category TEXT,
  is_purchased BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own shopping list items" ON public.shopping_list_items;
CREATE POLICY "Users can manage own shopping list items" ON public.shopping_list_items FOR ALL USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_shopping_list_items_updated_at ON public.shopping_list_items;
CREATE TRIGGER update_shopping_list_items_updated_at
BEFORE UPDATE ON public.shopping_list_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- WhatsApp Config
CREATE TABLE IF NOT EXISTS public.whatsapp_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  instance_name TEXT,
  api_key TEXT,
  api_url TEXT,
  is_connected BOOLEAN DEFAULT false,
  connected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.whatsapp_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own whatsapp config" ON public.whatsapp_config;
CREATE POLICY "Users can manage own whatsapp config" ON public.whatsapp_config FOR ALL USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_whatsapp_config_updated_at ON public.whatsapp_config;
CREATE TRIGGER update_whatsapp_config_updated_at
BEFORE UPDATE ON public.whatsapp_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Reminders
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  reminder_type TEXT NOT NULL DEFAULT 'custom',
  reference_id UUID,
  day_of_month INTEGER,
  day_of_week INTEGER,
  time_of_day TIME DEFAULT '09:00:00',
  days_before INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  last_sent_at TIMESTAMP WITH TIME ZONE,
  next_send_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own reminders" ON public.reminders;
CREATE POLICY "Users can manage own reminders" ON public.reminders FOR ALL USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_reminders_updated_at ON public.reminders;
CREATE TRIGGER update_reminders_updated_at
BEFORE UPDATE ON public.reminders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- SAAS Infrastructure
DO $$ BEGIN
    CREATE TYPE public.subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing', 'pending');
    CREATE TYPE public.plan_type AS ENUM ('free', 'pro', 'business');
    CREATE TYPE public.billing_period AS ENUM ('monthly', 'yearly');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  plan_type public.plan_type NOT NULL UNIQUE,
  price_monthly INTEGER NOT NULL DEFAULT 0,
  price_yearly INTEGER NOT NULL DEFAULT 0,
  features JSONB DEFAULT '[]'::jsonb,
  max_reminders INTEGER DEFAULT 3,
  max_banks INTEGER DEFAULT 2,
  max_goals INTEGER DEFAULT 1,
  whatsapp_enabled BOOLEAN DEFAULT false,
  reports_enabled BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.plans (name, description, plan_type, price_monthly, price_yearly, features, max_reminders, max_banks, max_goals, whatsapp_enabled, reports_enabled) 
VALUES 
('Gratuito', 'Controle básico das suas finanças', 'free', 0, 0, '["Dashboard básico", "2 contas bancárias", "1 meta financeira", "3 lembretes"]'::jsonb, 3, 2, 1, false, false),
('Pro', 'Para quem quer organização completa', 'pro', 2990, 29900, '["Dashboard completo", "Contas ilimitadas", "Metas ilimitadas", "Lembretes via WhatsApp", "Relatórios avançados"]'::jsonb, -1, -1, -1, true, true),
('Business', 'Para microempreendedores e freelancers', 'business', 4990, 49900, '["Tudo do Pro", "Perfil PJ separado", "Exportação de relatórios", "Suporte prioritário"]'::jsonb, -1, -1, -1, true, true)
ON CONFLICT (plan_type) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  features = EXCLUDED.features,
  max_reminders = EXCLUDED.max_reminders,
  max_banks = EXCLUDED.max_banks,
  max_goals = EXCLUDED.max_goals,
  whatsapp_enabled = EXCLUDED.whatsapp_enabled,
  reports_enabled = EXCLUDED.reports_enabled;
