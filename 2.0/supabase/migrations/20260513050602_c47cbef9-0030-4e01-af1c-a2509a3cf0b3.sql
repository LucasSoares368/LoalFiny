-- Criar tabela para armazenar o saldo disponível do usuário
CREATE TABLE IF NOT EXISTS public.user_balance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  available_balance NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.user_balance ENABLE ROW LEVEL SECURITY;

-- Política para usuários visualizarem e gerenciarem seu próprio saldo
DROP POLICY IF EXISTS "Users can manage own balance" ON public.user_balance;
CREATE POLICY "Users can manage own balance"
ON public.user_balance
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_user_balance_updated_at ON public.user_balance;
CREATE TRIGGER update_user_balance_updated_at
BEFORE UPDATE ON public.user_balance
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir saldo inicial para usuários existentes
INSERT INTO public.user_balance (user_id, available_balance)
SELECT id, 0
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_balance)
ON CONFLICT (user_id) DO NOTHING;

-- Atualizar a função handle_new_user para criar saldo inicial
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  
  -- Create default split rule
  INSERT INTO public.split_rules (user_id, name, personal_percentage, reserve_percentage, business_percentage)
  VALUES (NEW.id, 'Regra Padrão', 45.00, 45.00, 10.00);
  
  -- Create emergency goal
  INSERT INTO public.emergency_goals (user_id, target_months, current_amount)
  VALUES (NEW.id, 6, 0);
  
  -- Create initial balance
  INSERT INTO public.user_balance (user_id, available_balance)
  VALUES (NEW.id, 0);
  
  RETURN NEW;
END;
$$;

-- Criar tabela de metas personalizadas
CREATE TABLE IF NOT EXISTS public.custom_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  target_amount NUMERIC NOT NULL,
  current_amount NUMERIC NOT NULL DEFAULT 0,
  deadline DATE,
  category TEXT,
  color TEXT DEFAULT '#3b82f6',
  icon TEXT DEFAULT '🎯',
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT positive_target CHECK (target_amount > 0),
  CONSTRAINT positive_current CHECK (current_amount >= 0)
);

-- Habilitar RLS
ALTER TABLE public.custom_goals ENABLE ROW LEVEL SECURITY;

-- Política para usuários gerenciarem suas próprias metas
DROP POLICY IF EXISTS "Users can manage own goals" ON public.custom_goals;
CREATE POLICY "Users can manage own goals"
ON public.custom_goals
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_custom_goals_updated_at ON public.custom_goals;
CREATE TRIGGER update_custom_goals_updated_at
BEFORE UPDATE ON public.custom_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_custom_goals_user_id ON public.custom_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_goals_deadline ON public.custom_goals(deadline);

-- Função para marcar meta como completa automaticamente
CREATE OR REPLACE FUNCTION public.check_goal_completion()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.current_amount >= NEW.target_amount AND (OLD.is_completed = false OR OLD.is_completed IS NULL) THEN
    NEW.is_completed = true;
    NEW.completed_at = now();
  ELSIF NEW.current_amount < NEW.target_amount AND OLD.is_completed = true THEN
    NEW.is_completed = false;
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_complete_goal ON public.custom_goals;
CREATE TRIGGER auto_complete_goal
BEFORE UPDATE OF current_amount ON public.custom_goals
FOR EACH ROW
EXECUTE FUNCTION public.check_goal_completion();

-- Adicionar campo de valor-alvo em reais na tabela emergency_goals
ALTER TABLE public.emergency_goals 
ADD COLUMN IF NOT EXISTS target_amount NUMERIC,
ADD COLUMN IF NOT EXISTS goal_type TEXT DEFAULT 'months' CHECK (goal_type IN ('months', 'amount', 'both'));

-- Create stores table
CREATE TABLE IF NOT EXISTS public.stores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  unit TEXT DEFAULT 'un',
  icon TEXT DEFAULT '📦',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create price_records table
CREATE TABLE IF NOT EXISTS public.price_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  price NUMERIC NOT NULL,
  quantity NUMERIC DEFAULT 1,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can manage own stores" ON public.stores;
CREATE POLICY "Users can manage own stores" ON public.stores FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage own products" ON public.products;
CREATE POLICY "Users can manage own products" ON public.products FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage own price records" ON public.price_records;
CREATE POLICY "Users can manage own price records" ON public.price_records FOR ALL USING (auth.uid() = user_id);

-- Create trigger for handling new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Create banks table
CREATE TABLE IF NOT EXISTS public.banks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo_url TEXT,
  initial_balance NUMERIC NOT NULL DEFAULT 0,
  current_balance NUMERIC NOT NULL DEFAULT 0,
  account_type TEXT DEFAULT 'checking',
  agency TEXT,
  account_number TEXT,
  color TEXT DEFAULT '#3b82f6',
  notes TEXT,
  opening_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.banks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own banks" ON public.banks;
CREATE POLICY "Users can manage own banks" ON public.banks FOR ALL USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_banks_updated_at ON public.banks;
CREATE TRIGGER update_banks_updated_at
  BEFORE UPDATE ON public.banks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add bank_id column to transactions table
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS bank_id UUID REFERENCES public.banks(id) ON DELETE SET NULL;

-- Create storage bucket for bank logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('bank-logos', 'bank-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for bank logos
DROP POLICY IF EXISTS "Bank logos are publicly accessible" ON storage.objects;
CREATE POLICY "Bank logos are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'bank-logos');
DROP POLICY IF EXISTS "Users can upload their own bank logos" ON storage.objects;
CREATE POLICY "Users can upload their own bank logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'bank-logos' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "Users can update their own bank logos" ON storage.objects;
CREATE POLICY "Users can update their own bank logos" ON storage.objects FOR UPDATE USING (bucket_id = 'bank-logos' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "Users can delete their own bank logos" ON storage.objects;
CREATE POLICY "Users can delete their own bank logos" ON storage.objects FOR DELETE USING (bucket_id = 'bank-logos' AND auth.uid()::text = (storage.foldername(name))[1]);
