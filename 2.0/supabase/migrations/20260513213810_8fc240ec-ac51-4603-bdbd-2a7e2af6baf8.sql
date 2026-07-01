-- Remove Woovi configuration table
DROP TABLE IF EXISTS public.woovi_config;

-- Remove Woovi related columns from payments table
ALTER TABLE public.payments 
DROP COLUMN IF EXISTS woovi_charge_id,
DROP COLUMN IF EXISTS woovi_transaction_id;

-- Remove Woovi related columns from subscriptions table
ALTER TABLE public.subscriptions 
DROP COLUMN IF EXISTS woovi_subscription_id;