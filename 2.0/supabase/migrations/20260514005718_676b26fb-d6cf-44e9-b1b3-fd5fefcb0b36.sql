
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_allow BOOLEAN;
BEGIN
  SELECT allow_registration INTO v_allow
  FROM public.app_settings
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_allow IS NOT NULL AND v_allow = false THEN
    RAISE EXCEPTION 'Cadastro de novos usuários está desabilitado.'
      USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );

  INSERT INTO public.split_rules (user_id, name, personal_percentage, reserve_percentage, business_percentage)
  VALUES (NEW.id, 'Regra Padrão', 45.00, 45.00, 10.00);

  INSERT INTO public.emergency_goals (user_id, target_months, current_amount)
  VALUES (NEW.id, 6, 0);

  INSERT INTO public.user_balance (user_id, available_balance)
  VALUES (NEW.id, 0);

  RETURN NEW;
END;
$function$;
