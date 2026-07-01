-- Create cookie_consents table
CREATE TABLE IF NOT EXISTS public.cookie_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    preferences JSONB NOT NULL DEFAULT '{"essential": true, "analytical": false, "marketing": false, "functional": false}'::jsonb,
    consent_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.cookie_consents ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own cookie consent"
    ON public.cookie_consents FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cookie consent"
    ON public.cookie_consents FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cookie consent"
    ON public.cookie_consents FOR UPDATE
    USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_cookie_consents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cookie_consents_updated_at
BEFORE UPDATE ON public.cookie_consents
FOR EACH ROW
EXECUTE FUNCTION public.update_cookie_consents_updated_at();