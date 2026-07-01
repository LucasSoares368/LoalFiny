-- Profile updates
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp_notifications_enabled BOOLEAN DEFAULT false;

-- Whatsapp messages log
CREATE TABLE IF NOT EXISTS public.whatsapp_messages_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_id UUID REFERENCES public.reminders(id) ON DELETE SET NULL,
  message_type TEXT NOT NULL,
  message_content TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_messages_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own message logs" ON public.whatsapp_messages_log;
CREATE POLICY "Users can manage own message logs" ON public.whatsapp_messages_log FOR ALL USING (auth.uid() = user_id);

-- Ensure smart_alerts_config has RLS and correct policies
ALTER TABLE public.smart_alerts_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own smart alerts config" ON public.smart_alerts_config;
CREATE POLICY "Users can manage own smart alerts config" ON public.smart_alerts_config FOR ALL USING (auth.uid() = user_id);
