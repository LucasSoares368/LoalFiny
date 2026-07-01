-- Create evolution_api_config table
CREATE TABLE IF NOT EXISTS public.evolution_api_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_url TEXT NOT NULL,
    api_key TEXT NOT NULL,
    instance_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.evolution_api_config ENABLE ROW LEVEL SECURITY;

-- Create policy for admins
CREATE POLICY "Admins can manage evolution_api_config"
ON public.evolution_api_config
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_evolution_api_config_updated_at
BEFORE UPDATE ON public.evolution_api_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert a default empty row if none exists (to simplify frontend access)
-- Note: We only insert if table is empty
INSERT INTO public.evolution_api_config (api_url, api_key, instance_name)
SELECT '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM public.evolution_api_config);
