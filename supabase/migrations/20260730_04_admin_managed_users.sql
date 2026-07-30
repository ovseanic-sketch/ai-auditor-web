-- Administrator-managed accounts without email invitations.
-- Users remain in profiles so historical audits keep their authors and owners.

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_status_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_status_check
  CHECK (status IN ('active', 'blocked', 'archived'));

CREATE INDEX IF NOT EXISTS idx_profiles_role_status
  ON public.profiles(role, status);

-- Every active administrator has the same profile-management rights.
DROP POLICY IF EXISTS profiles_admin_manage ON public.profiles;
CREATE POLICY profiles_admin_manage
ON public.profiles FOR ALL
USING (
  public.current_app_role() = 'admin'
  AND EXISTS (
    SELECT 1
    FROM public.profiles caller
    WHERE caller.id = auth.uid()
      AND caller.role = 'admin'
      AND caller.status = 'active'
  )
)
WITH CHECK (
  public.current_app_role() = 'admin'
  AND EXISTS (
    SELECT 1
    FROM public.profiles caller
    WHERE caller.id = auth.uid()
      AND caller.role = 'admin'
      AND caller.status = 'active'
  )
);
