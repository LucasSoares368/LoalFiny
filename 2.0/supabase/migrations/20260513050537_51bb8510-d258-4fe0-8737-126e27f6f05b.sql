CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Functions
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  INSERT INTO public.split_rules (user_id, name, personal_percentage, reserve_percentage, business_percentage)
  VALUES (NEW.id, 'Regra Padrão', 45.00, 45.00, 10.00);
  INSERT INTO public.emergency_goals (user_id, target_months, current_amount)
  VALUES (NEW.id, 6, 0);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Tables
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text,
    email text,
    avatar_url text,
    onboarding_completed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.achievements (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    achievement_type text NOT NULL,
    title text NOT NULL,
    description text,
    icon text,
    unlocked_at timestamp with time zone DEFAULT now(),
    points integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    icon text,
    color text,
    is_default boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.emergency_goals (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_months integer DEFAULT 6 NOT NULL,
    current_amount numeric(12,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.fixed_costs (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    amount numeric(10,2) NOT NULL,
    is_variable boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.split_rules (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    personal_percentage numeric(5,2) DEFAULT 45.00 NOT NULL,
    reserve_percentage numeric(5,2) DEFAULT 45.00 NOT NULL,
    business_percentage numeric(5,2) DEFAULT 10.00 NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount numeric(12,2) NOT NULL,
    type text NOT NULL CHECK (type IN ('income', 'expense')),
    category_id uuid REFERENCES public.categories(id),
    description text,
    date date DEFAULT CURRENT_DATE NOT NULL,
    tags text[],
    split_applied boolean DEFAULT false,
    personal_amount numeric(12,2),
    reserve_amount numeric(12,2),
    business_amount numeric(12,2),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Triggers
DROP TRIGGER IF EXISTS update_emergency_goals_updated_at ON public.emergency_goals;
CREATE TRIGGER update_emergency_goals_updated_at BEFORE UPDATE ON public.emergency_goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_fixed_costs_updated_at ON public.fixed_costs;
CREATE TRIGGER update_fixed_costs_updated_at BEFORE UPDATE ON public.fixed_costs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON public.transactions;
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixed_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.split_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can manage own achievements" ON public.achievements;
CREATE POLICY "Users can manage own achievements" ON public.achievements FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own categories" ON public.categories;
CREATE POLICY "Users can manage own categories" ON public.categories FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own emergency goals" ON public.emergency_goals;
CREATE POLICY "Users can manage own emergency goals" ON public.emergency_goals FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own fixed costs" ON public.fixed_costs;
CREATE POLICY "Users can manage own fixed costs" ON public.fixed_costs FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own profiles" ON public.profiles;
CREATE POLICY "Users can manage own profiles" ON public.profiles FOR ALL USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can manage own split rules" ON public.split_rules;
CREATE POLICY "Users can manage own split rules" ON public.split_rules FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own transactions" ON public.transactions;
CREATE POLICY "Users can manage own transactions" ON public.transactions FOR ALL USING (auth.uid() = user_id);

