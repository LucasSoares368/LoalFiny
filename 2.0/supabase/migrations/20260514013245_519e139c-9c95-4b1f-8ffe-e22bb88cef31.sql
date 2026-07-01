ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS plan_id UUID,
  ADD COLUMN IF NOT EXISTS billing_period TEXT;

CREATE INDEX IF NOT EXISTS idx_payments_mp_payment_id ON public.payments(mercadopago_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_mp_preference_id ON public.payments(mercadopago_preference_id);