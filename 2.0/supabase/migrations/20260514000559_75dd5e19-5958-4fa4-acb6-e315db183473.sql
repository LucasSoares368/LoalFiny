UPDATE public.plans SET max_reminders = 3 WHERE plan_type = 'pro';
UPDATE public.plans SET max_reminders = 999 WHERE plan_type = 'business';
UPDATE public.plans SET max_reminders = 3 WHERE plan_type = 'free';