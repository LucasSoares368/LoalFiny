ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS qr_code_base64 TEXT;