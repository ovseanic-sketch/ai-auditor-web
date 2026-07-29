-- Runtime persistence table used by the current CRM interface.
-- The JSON snapshot preserves every shopper/auditor field while the normalized
-- evidence tables in the base migration remain available for future analytics.
CREATE TABLE IF NOT EXISTS public.audit_records (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  shopper_id TEXT,
  auditor_id TEXT,
  primary_approver_id TEXT,
  visit_date DATE NOT NULL,
  audit_month TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_records_status ON public.audit_records(status);
CREATE INDEX IF NOT EXISTS idx_audit_records_month ON public.audit_records(audit_month);
CREATE INDEX IF NOT EXISTS idx_audit_records_shopper ON public.audit_records(shopper_id);
CREATE INDEX IF NOT EXISTS idx_audit_records_approver ON public.audit_records(primary_approver_id);

ALTER TABLE public.audit_records ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.current_app_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

DROP POLICY IF EXISTS "Users can view their own profile or managers view assigned profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins manage profiles" ON public.profiles;

CREATE POLICY profiles_select_authenticated
ON public.profiles FOR SELECT
USING (
  auth.uid() = id
  OR public.current_app_role() IN ('admin', 'auditor', 'manager')
);

CREATE POLICY profiles_admin_manage
ON public.profiles FOR ALL
USING (public.current_app_role() = 'admin')
WITH CHECK (public.current_app_role() = 'admin');

CREATE POLICY audit_records_select_own
ON public.audit_records FOR SELECT
USING (
  auth.uid()::TEXT = shopper_id
  OR auth.uid()::TEXT = auditor_id
  OR auth.uid()::TEXT = primary_approver_id
  OR public.current_app_role() IN ('admin', 'auditor')
);

CREATE POLICY audit_records_insert_shopper_or_auditor
ON public.audit_records FOR INSERT
WITH CHECK (
  auth.uid()::TEXT = shopper_id
  OR public.current_app_role() IN ('admin', 'auditor')
);

CREATE POLICY audit_records_update_participant
ON public.audit_records FOR UPDATE
USING (
  auth.uid()::TEXT = shopper_id
  OR auth.uid()::TEXT = auditor_id
  OR auth.uid()::TEXT = primary_approver_id
  OR public.current_app_role() IN ('admin', 'auditor')
)
WITH CHECK (
  auth.uid()::TEXT = shopper_id
  OR auth.uid()::TEXT = auditor_id
  OR auth.uid()::TEXT = primary_approver_id
  OR public.current_app_role() IN ('admin', 'auditor')
);

CREATE POLICY audit_records_delete_nonfinal
ON public.audit_records FOR DELETE
USING (
  status NOT IN (
    'APPROVED',
    'APPROVED_WITH_COMMENT',
    'FINALIZED_NO_SCORE_CHANGE',
    'FINALIZED_WITH_SCORE_CHANGE'
  )
  AND public.current_app_role() IN ('admin', 'auditor')
);

CREATE OR REPLACE FUNCTION public.enforce_audit_record_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_role TEXT := public.current_app_role();
  shopper_allowed_keys TEXT[] := ARRAY[
    'shopperData','shopperSubmissionText','audioFileName','audioMimeType',
    'audioStoragePath','audioData','audioUrl','comment','approvalStatus',
    'shopperClarificationComment','approvalHistory','versionHistory','versionNumber'
  ];
  manager_allowed_keys TEXT[] := ARRAY[
    'approvalStatus','managerComment','approvedAt','approvedBy',
    'approvalHistory','versionHistory','versionNumber'
  ];
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF actor_role = 'shopper' AND (
      NEW.shopper_id <> auth.uid()::TEXT OR NEW.status <> 'SHOPPER_SUBMITTED'
    ) THEN
      RAISE EXCEPTION 'Shopper may insert only own submitted audit';
    END IF;
    RETURN NEW;
  END IF;

  IF actor_role = 'shopper' THEN
    IF OLD.shopper_id <> auth.uid()::TEXT
      OR OLD.status <> 'SHOPPER_CLARIFICATION_REQUESTED'
      OR NEW.status <> 'SHOPPER_RESUBMITTED'
      OR NEW.shopper_id IS DISTINCT FROM OLD.shopper_id
      OR NEW.auditor_id IS DISTINCT FROM OLD.auditor_id
      OR NEW.primary_approver_id IS DISTINCT FROM OLD.primary_approver_id
      OR (NEW.payload - shopper_allowed_keys) IS DISTINCT FROM (OLD.payload - shopper_allowed_keys)
    THEN
      RAISE EXCEPTION 'Shopper update is outside clarification scope';
    END IF;
  ELSIF actor_role = 'manager' THEN
    IF OLD.primary_approver_id <> auth.uid()::TEXT
      OR OLD.status <> 'PENDING_APPROVAL'
      OR NEW.status NOT IN ('APPROVED','APPROVED_WITH_COMMENT','REVISION_REQUESTED')
      OR (NEW.payload - manager_allowed_keys) IS DISTINCT FROM (OLD.payload - manager_allowed_keys)
    THEN
      RAISE EXCEPTION 'Manager update is outside approval scope';
    END IF;
  ELSIF actor_role NOT IN ('auditor','admin') THEN
    RAISE EXCEPTION 'Role is not allowed to update audits';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_audit_record_change ON public.audit_records;
CREATE TRIGGER trg_enforce_audit_record_change
BEFORE INSERT OR UPDATE ON public.audit_records
FOR EACH ROW EXECUTE FUNCTION public.enforce_audit_record_change();

CREATE TABLE IF NOT EXISTS public.app_notifications (
  id TEXT PRIMARY KEY,
  recipient_id TEXT,
  recipient_role TEXT,
  payload JSONB NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.app_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY app_notifications_select
ON public.app_notifications FOR SELECT
USING (
  recipient_id = auth.uid()::TEXT
  OR (recipient_id IS NULL AND recipient_role = public.current_app_role())
  OR public.current_app_role() = 'admin'
);

CREATE POLICY app_notifications_insert
ON public.app_notifications FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY app_notifications_update_own
ON public.app_notifications FOR UPDATE
USING (
  recipient_id = auth.uid()::TEXT
  OR (recipient_id IS NULL AND recipient_role = public.current_app_role())
  OR public.current_app_role() = 'admin'
);

CREATE TABLE IF NOT EXISTS public.app_dictionaries (
  id TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.app_dictionaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY app_dictionaries_select
ON public.app_dictionaries FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY app_dictionaries_admin_insert
ON public.app_dictionaries FOR INSERT
WITH CHECK (public.current_app_role() = 'admin');

CREATE POLICY app_dictionaries_admin_update
ON public.app_dictionaries FOR UPDATE
USING (public.current_app_role() = 'admin')
WITH CHECK (public.current_app_role() = 'admin');

INSERT INTO storage.buckets (id, name, public)
VALUES ('audit-audio', 'audit-audio', FALSE)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY audit_audio_read_participants
ON storage.objects FOR SELECT
USING (
  bucket_id = 'audit-audio'
  AND EXISTS (
    SELECT 1
    FROM public.audit_records ar
    WHERE split_part(name, '/', 1) = ar.id
      AND (
        ar.shopper_id = auth.uid()::TEXT
        OR ar.auditor_id = auth.uid()::TEXT
        OR ar.primary_approver_id = auth.uid()::TEXT
        OR public.current_app_role() IN ('admin', 'auditor')
      )
  )
);

CREATE POLICY audit_audio_insert_shopper_or_auditor
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'audit-audio'
  AND public.current_app_role() IN ('shopper', 'auditor', 'admin')
);

CREATE POLICY audit_audio_delete_nonfinal
ON storage.objects FOR DELETE
USING (
  bucket_id = 'audit-audio'
  AND public.current_app_role() = 'admin'
  AND NOT EXISTS (
    SELECT 1
    FROM public.audit_records ar
    WHERE split_part(name, '/', 1) = ar.id
      AND ar.status IN (
        'APPROVED',
        'APPROVED_WITH_COMMENT',
        'FINALIZED_NO_SCORE_CHANGE',
        'FINALIZED_WITH_SCORE_CHANGE'
      )
  )
);
