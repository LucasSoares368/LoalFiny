
-- Trigger to enforce signup blocking at DB level + create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Public RPC so the signup page (anon) can know whether registration is enabled
CREATE OR REPLACE FUNCTION public.is_registration_allowed()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT allow_registration FROM public.app_settings ORDER BY created_at ASC LIMIT 1),
    true
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_registration_allowed() TO anon, authenticated;
