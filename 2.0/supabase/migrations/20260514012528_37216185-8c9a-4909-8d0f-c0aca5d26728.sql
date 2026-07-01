
-- 1. Restrict app_settings SELECT to authenticated users only
DROP POLICY IF EXISTS "Anyone can view app settings" ON public.app_settings;
CREATE POLICY "Authenticated can view app settings"
ON public.app_settings
FOR SELECT
TO authenticated
USING (true);

-- 2. Lock down bank-logos bucket writes to admins only (reads remain public)
DROP POLICY IF EXISTS "Admins can upload bank logos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update bank logos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete bank logos" ON storage.objects;

CREATE POLICY "Admins can upload bank logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'bank-logos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update bank logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'bank-logos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete bank logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'bank-logos' AND public.has_role(auth.uid(), 'admin'));
