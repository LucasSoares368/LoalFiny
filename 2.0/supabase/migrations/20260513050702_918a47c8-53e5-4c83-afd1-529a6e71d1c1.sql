-- Step 1: Add new enum values
ALTER TYPE public.plan_type ADD VALUE IF NOT EXISTS 'starter';
ALTER TYPE public.plan_type ADD VALUE IF NOT EXISTS 'pro_plus';

-- Drop and recreate function with new return type
DROP FUNCTION IF EXISTS public.get_user_plan(uuid);

CREATE OR REPLACE FUNCTION public.get_user_plan(p_user_id uuid)
 RETURNS TABLE(
   plan_type plan_type, 
   plan_name text, 
   is_active boolean, 
   whatsapp_enabled boolean, 
   reports_enabled boolean, 
   max_reminders integer, 
   max_banks integer, 
   max_goals integer,
   cashflow_projection_enabled boolean,
   export_enabled boolean,
   split_enabled boolean,
   business_profile_enabled boolean,
   advanced_dashboard_enabled boolean,
   annual_projection_enabled boolean,
   history_months integer,
   monthly_planning_enabled boolean
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(pl.plan_type, 'starter'::public.plan_type) as plan_type,
    COALESCE(pl.name, 'Starter') as plan_name,
    COALESCE(s.status = 'active', false) as is_active,
    COALESCE(pl.whatsapp_enabled, false) as whatsapp_enabled,
    COALESCE(pl.reports_enabled, false) as reports_enabled,
    COALESCE(pl.max_reminders, 999) as max_reminders,
    COALESCE(pl.max_banks, 999) as max_banks,
    COALESCE(pl.max_goals, 1) as max_goals,
    COALESCE(pl.cashflow_projection_enabled, false) as cashflow_projection_enabled,
    COALESCE(pl.export_enabled, false) as export_enabled,
    COALESCE(pl.split_enabled, false) as split_enabled,
    COALESCE(pl.business_profile_enabled, false) as business_profile_enabled,
    COALESCE(pl.advanced_dashboard_enabled, false) as advanced_dashboard_enabled,
    COALESCE(pl.annual_projection_enabled, false) as annual_projection_enabled,
    COALESCE(pl.history_months, 3) as history_months,
    COALESCE(pl.monthly_planning_enabled, false) as monthly_planning_enabled
  FROM public.profiles p
  LEFT JOIN public.subscriptions s ON s.user_id = p.id AND s.status = 'active'
  LEFT JOIN public.plans pl ON pl.id = s.plan_id
  WHERE p.id = p_user_id;
END;
$$;

ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS cashflow_projection_enabled boolean DEFAULT false;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS export_enabled boolean DEFAULT false;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS split_enabled boolean DEFAULT false;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS business_profile_enabled boolean DEFAULT false;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS advanced_dashboard_enabled boolean DEFAULT false;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS annual_projection_enabled boolean DEFAULT false;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS history_months integer DEFAULT 3;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS monthly_planning_enabled boolean DEFAULT false;

-- Table for smart indicator logs
CREATE TABLE IF NOT EXISTS public.smart_indicators_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  indicator_type TEXT NOT NULL,
  value NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'neutral',
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.smart_indicators_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own indicator logs" ON public.smart_indicators_logs;
CREATE POLICY "Users can manage own indicator logs" ON public.smart_indicators_logs FOR ALL USING (auth.uid() = user_id);

-- Add income_type to transactions
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS income_type TEXT NULL;

-- Table to store smart alert configurations
CREATE TABLE IF NOT EXISTS public.smart_alerts_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  frequency TEXT NOT NULL DEFAULT 'weekly',
  threshold NUMERIC DEFAULT 20,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_smart_alerts_user_type ON public.smart_alerts_config(user_id, alert_type);

ALTER TABLE public.smart_alerts_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own smart alerts config" ON public.smart_alerts_config;
CREATE POLICY "Users can manage own smart alerts config" ON public.smart_alerts_config FOR ALL USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_smart_alerts_config_updated_at ON public.smart_alerts_config;
CREATE TRIGGER update_smart_alerts_config_updated_at
BEFORE UPDATE ON public.smart_alerts_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS transaction_time time without time zone DEFAULT NULL;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS is_essential boolean DEFAULT NULL;
