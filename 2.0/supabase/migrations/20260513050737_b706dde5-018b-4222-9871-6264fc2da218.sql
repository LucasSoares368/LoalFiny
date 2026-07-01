-- Drop existing functions to allow changing return types
DROP FUNCTION IF EXISTS public.get_user_plan(uuid);
DROP FUNCTION IF EXISTS public.user_has_feature(uuid, text);

-- Recreate functions with correct return types
CREATE OR REPLACE FUNCTION public.get_user_plan(p_user_id UUID)
RETURNS TABLE (
  plan_type public.plan_type,
  plan_name TEXT,
  is_active BOOLEAN,
  whatsapp_enabled BOOLEAN,
  reports_enabled BOOLEAN,
  max_reminders INTEGER,
  max_banks INTEGER,
  max_goals INTEGER,
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
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(pl.plan_type, 'free'::public.plan_type) as plan_type,
    COALESCE(pl.name, 'Gratuito') as plan_name,
    COALESCE(s.status = 'active', false) as is_active,
    COALESCE(pl.whatsapp_enabled, false) as whatsapp_enabled,
    COALESCE(pl.reports_enabled, false) as reports_enabled,
    COALESCE(pl.max_reminders, 3) as max_reminders,
    COALESCE(pl.max_banks, 2) as max_banks,
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

CREATE OR REPLACE FUNCTION public.user_has_feature(p_user_id UUID, p_feature TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result BOOLEAN := false;
BEGIN
  SELECT 
    CASE 
      WHEN p_feature = 'whatsapp' THEN COALESCE(pl.whatsapp_enabled, false)
      WHEN p_feature = 'reports' THEN COALESCE(pl.reports_enabled, false)
      ELSE false
    END INTO v_result
  FROM public.profiles p
  LEFT JOIN public.subscriptions s ON s.user_id = p.id AND s.status = 'active'
  LEFT JOIN public.plans pl ON pl.id = s.plan_id
  WHERE p.id = p_user_id;
  
  RETURN COALESCE(v_result, false);
END;
$$;

-- Ensure tables exist
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id),
  status public.subscription_status NOT NULL DEFAULT 'pending',
  billing_period public.billing_period NOT NULL DEFAULT 'monthly',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  woovi_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  woovi_charge_id TEXT NOT NULL,
  woovi_transaction_id TEXT,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_link TEXT,
  qr_code TEXT,
  br_code TEXT,
  expires_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
