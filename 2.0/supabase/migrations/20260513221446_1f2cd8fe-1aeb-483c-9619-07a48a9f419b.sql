CREATE POLICY "Admins can view all payments" ON public.payments
FOR SELECT
TO authenticated
USING (
  (SELECT (EXISTS ( SELECT 1
           FROM user_roles
          WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role)))
);