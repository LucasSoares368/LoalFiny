-- Allow admins to view all subscriptions
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can view all subscriptions"
ON public.subscriptions
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to manage all subscriptions
DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can manage all subscriptions"
ON public.subscriptions
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role)
);
