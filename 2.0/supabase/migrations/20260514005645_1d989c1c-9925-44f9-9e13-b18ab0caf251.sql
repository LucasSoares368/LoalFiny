
CREATE TABLE public.app_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  allow_registration BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view app settings"
  ON public.app_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can update app settings"
  ON public.app_settings FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert app settings"
  ON public.app_settings FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.app_settings_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view settings logs"
  ON public.app_settings_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.app_settings (allow_registration) VALUES (true);

CREATE OR REPLACE FUNCTION public.update_app_setting(p_allow_registration BOOLEAN)
RETURNS public.app_settings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old BOOLEAN;
  v_row public.app_settings;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem alterar configurações';
  END IF;

  SELECT allow_registration INTO v_old FROM public.app_settings ORDER BY created_at ASC LIMIT 1;

  UPDATE public.app_settings
    SET allow_registration = p_allow_registration,
        updated_at = now()
    WHERE id = (SELECT id FROM public.app_settings ORDER BY created_at ASC LIMIT 1)
    RETURNING * INTO v_row;

  IF v_old IS DISTINCT FROM p_allow_registration THEN
    INSERT INTO public.app_settings_logs (setting_key, old_value, new_value, changed_by)
    VALUES ('allow_registration', v_old::text, p_allow_registration::text, auth.uid());
  END IF;

  RETURN v_row;
END;
$$;
