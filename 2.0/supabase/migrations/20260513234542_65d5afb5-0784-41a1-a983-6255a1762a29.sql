-- Update Free Plan
UPDATE public.plans 
SET 
  whatsapp_enabled = false,
  reports_enabled = false,
  cashflow_projection_enabled = false,
  export_enabled = false,
  split_enabled = false,
  business_profile_enabled = false,
  advanced_dashboard_enabled = false,
  annual_projection_enabled = false,
  history_months = 3,
  monthly_planning_enabled = false
WHERE plan_type = 'free';

-- Update Pro Plan
UPDATE public.plans 
SET 
  whatsapp_enabled = true,
  reports_enabled = true,
  cashflow_projection_enabled = true,
  export_enabled = true,
  split_enabled = true,
  business_profile_enabled = false,
  advanced_dashboard_enabled = true,
  annual_projection_enabled = false,
  history_months = 12,
  monthly_planning_enabled = true
WHERE plan_type = 'pro';

-- Update Business Plan
UPDATE public.plans 
SET 
  whatsapp_enabled = true,
  reports_enabled = true,
  cashflow_projection_enabled = true,
  export_enabled = true,
  split_enabled = true,
  business_profile_enabled = true,
  advanced_dashboard_enabled = true,
  annual_projection_enabled = true,
  history_months = 9999,
  monthly_planning_enabled = true
WHERE plan_type = 'business';
