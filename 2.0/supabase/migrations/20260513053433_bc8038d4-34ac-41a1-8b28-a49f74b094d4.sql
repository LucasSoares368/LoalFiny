-- Create openai_config table
CREATE TABLE public.openai_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key TEXT NOT NULL,
    model TEXT NOT NULL DEFAULT 'gpt-4o-mini',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.openai_config ENABLE ROW LEVEL SECURITY;

-- Create policies for admins
CREATE POLICY "Admins can do everything on openai_config"
ON public.openai_config
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
);

-- Create trigger for updated_at
CREATE TRIGGER update_openai_config_updated_at
BEFORE UPDATE ON public.openai_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();