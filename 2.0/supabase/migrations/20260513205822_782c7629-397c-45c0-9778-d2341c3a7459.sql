-- Tabela de configuração do Mercado Pago
CREATE TABLE public.mercado_pago_config (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    access_token TEXT NOT NULL,
    public_key TEXT NOT NULL,
    webhook_secret TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.mercado_pago_config ENABLE ROW LEVEL SECURITY;

-- Políticas para mercado_pago_config (apenas admins)
CREATE POLICY "Admins can manage mercado_pago_config" 
ON public.mercado_pago_config 
FOR ALL 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Adicionar colunas do Mercado Pago na tabela payments
ALTER TABLE public.payments 
ADD COLUMN mercadopago_preference_id TEXT,
ADD COLUMN mercadopago_payment_id TEXT;

-- Trigger para updated_at em mercado_pago_config
CREATE TRIGGER update_mercado_pago_config_updated_at
BEFORE UPDATE ON public.mercado_pago_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
