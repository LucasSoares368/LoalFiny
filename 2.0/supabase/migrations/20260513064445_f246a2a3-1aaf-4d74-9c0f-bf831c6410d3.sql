-- Create Woovi Config table
CREATE TABLE IF NOT EXISTS public.woovi_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id TEXT NOT NULL,
    webhook_secret TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.woovi_config ENABLE ROW LEVEL SECURITY;

-- Create policies for woovi_config
CREATE POLICY "Admins can manage woovi_config" 
ON public.woovi_config 
FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = auth.uid() 
        AND user_roles.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = auth.uid() 
        AND user_roles.role = 'admin'
    )
);

-- Ensure admins can update plans
CREATE POLICY "Admins can update plans" 
ON public.plans 
FOR UPDATE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = auth.uid() 
        AND user_roles.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = auth.uid() 
        AND user_roles.role = 'admin'
    )
);

-- Trigger for updated_at on woovi_config
CREATE TRIGGER update_woovi_config_updated_at
BEFORE UPDATE ON public.woovi_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
