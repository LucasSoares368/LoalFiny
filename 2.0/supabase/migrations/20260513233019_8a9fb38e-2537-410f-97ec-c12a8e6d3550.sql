ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false;

-- Update RLS policies to prevent blocked users from accessing data
-- We should ideally have a global check, but for now we can update existing ones or add a check in the AppLayout/Auth flow.
-- Actually, a better way is to update the SELECT policies for all main tables to include AND NOT (SELECT is_blocked FROM profiles WHERE id = auth.uid())
