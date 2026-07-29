-- AI Mystery Auditor Master Schema & RLS Setup Migration
-- Date: 2026-07-29

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  login TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'shopper', 'auditor', 'manager')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked')),
  position TEXT,
  network_scope TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Brands Table
CREATE TABLE IF NOT EXISTS public.brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Locations Table (Cities & Regions of Moldova)
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('city', 'region')),
  name_ro TEXT NOT NULL,
  name_ru TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Audits Main Table
CREATE TABLE IF NOT EXISTS public.audits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  audit_number TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL CHECK (status IN (
    'DRAFT',
    'SHOPPER_SUBMITTED',
    'AI_PROCESSING',
    'AUDITOR_REVIEW',
    'INVALID',
    'PENDING_APPROVAL',
    'APPROVED',
    'APPROVED_WITH_COMMENT',
    'REVISION_REQUESTED',
    'SHOPPER_CLARIFICATION_REQUESTED',
    'SHOPPER_RESUBMITTED',
    'FINALIZED_NO_SCORE_CHANGE',
    'FINALIZED_WITH_SCORE_CHANGE'
  )),
  check_type TEXT NOT NULL,
  shopper_id UUID NOT NULL REFERENCES public.profiles(id),
  auditor_id UUID REFERENCES public.profiles(id),
  primary_approver_id UUID REFERENCES public.profiles(id),
  visit_date DATE NOT NULL,
  audit_month TEXT NOT NULL, -- e.g. "2026-07"
  start_time TEXT NOT NULL, -- HH:mm
  end_time TEXT NOT NULL,   -- HH:mm
  brand_id UUID REFERENCES public.brands(id),
  city_id UUID REFERENCES public.locations(id),
  region_id UUID REFERENCES public.locations(id),
  branch_number TEXT NOT NULL,
  branch_address TEXT,
  consultant_name TEXT NOT NULL,
  category TEXT,
  visit_goal TEXT,
  visit_result TEXT,
  invalid_reason TEXT,
  current_version INT NOT NULL DEFAULT 1,
  lock_version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  finalized_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Audit Observers
CREATE TABLE IF NOT EXISTS public.audit_observers (
  audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  manager_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  acknowledged_at TIMESTAMPTZ,
  PRIMARY KEY (audit_id, manager_id)
);

-- 6. Shopper Submissions
CREATE TABLE IF NOT EXISTS public.shopper_submissions (
  audit_id UUID PRIMARY KEY REFERENCES public.audits(id) ON DELETE CASCADE,
  uniform_status TEXT,
  neatness_status TEXT,
  badge_status TEXT,
  appearance_comment TEXT,
  cleanliness_rating INT,
  merchandising_rating INT,
  assortment_rating INT,
  store_comment TEXT,
  staff_availability TEXT,
  no_grouping_status TEXT,
  hall_cleanliness_status TEXT,
  hall_comment TEXT,
  what_liked TEXT,
  what_disliked TEXT,
  overall_comment TEXT,
  cash_data JSONB,
  clarification_comment TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Audit Files
CREATE TABLE IF NOT EXISTS public.audit_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  file_type TEXT NOT NULL CHECK (file_type IN ('original_audio', 'additional_evidence', 'final_pdf', 'report_version')),
  storage_path TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  uploaded_by UUID REFERENCES public.profiles(id),
  immutable BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Transcripts
CREATE TABLE IF NOT EXISTS public.transcripts (
  audit_id UUID PRIMARY KEY REFERENCES public.audits(id) ON DELETE CASCADE,
  machine_transcript TEXT,
  auditor_transcript TEXT,
  language TEXT DEFAULT 'ru',
  quality_status TEXT DEFAULT 'ok',
  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Criteria Results
CREATE TABLE IF NOT EXISTS public.criteria_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  criterion_id TEXT NOT NULL,
  criterion_name_snapshot TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL,
  max_points NUMERIC NOT NULL,
  earned_points NUMERIC NOT NULL,
  source TEXT DEFAULT 'ai_analyzed',
  evidence TEXT,
  quote TEXT,
  timecode TEXT,
  confidence NUMERIC,
  shopper_value TEXT,
  auditor_comment TEXT,
  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Sales Driver Results
CREATE TABLE IF NOT EXISTS public.sales_driver_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  driver_id TEXT NOT NULL,
  name_snapshot TEXT NOT NULL,
  status TEXT NOT NULL,
  points NUMERIC NOT NULL,
  max_points NUMERIC NOT NULL DEFAULT 2,
  evidence TEXT,
  updated_by UUID REFERENCES public.profiles(id)
);

-- 11. Approvals Table
CREATE TABLE IF NOT EXISTS public.approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES public.profiles(id),
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  comment TEXT,
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Audit Versions
CREATE TABLE IF NOT EXISTS public.audit_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  snapshot JSONB NOT NULL,
  report_storage_path TEXT,
  created_by UUID REFERENCES public.profiles(id),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Audit Events Log
CREATE TABLE IF NOT EXISTS public.audit_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor_id UUID REFERENCES public.profiles(id),
  actor_role TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  audit_id UUID REFERENCES public.audits(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. AI Jobs
CREATE TABLE IF NOT EXISTS public.ai_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('queued', 'processing', 'retry_wait', 'completed', 'failed')),
  attempt_count INT NOT NULL DEFAULT 0,
  error_code TEXT,
  error_message_safe TEXT,
  result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create Indexes for Query Performance
CREATE INDEX IF NOT EXISTS idx_audits_shopper_id ON public.audits(shopper_id);
CREATE INDEX IF NOT EXISTS idx_audits_auditor_id ON public.audits(auditor_id);
CREATE INDEX IF NOT EXISTS idx_audits_approver_id ON public.audits(primary_approver_id);
CREATE INDEX IF NOT EXISTS idx_audits_status ON public.audits(status);
CREATE INDEX IF NOT EXISTS idx_audits_audit_month ON public.audits(audit_month);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id, read_at);

-- Row Level Security (RLS) Setup
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopper_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profile Policies
CREATE POLICY "Users can view their own profile or managers view assigned profiles"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'auditor', 'manager')
  ));

CREATE POLICY "Admins manage profiles"
  ON public.profiles FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Audit Policies
CREATE POLICY "Shoppers view their own audits"
  ON public.audits FOR SELECT
  USING (shopper_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'auditor')
  ) OR primary_approver_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.audit_observers WHERE audit_id = public.audits.id AND manager_id = auth.uid()
  ));

CREATE POLICY "Shoppers insert draft audits"
  ON public.audits FOR INSERT
  WITH CHECK (shopper_id = auth.uid());

CREATE POLICY "Auditors and Admins update audits"
  ON public.audits FOR UPDATE
  USING (
    (shopper_id = auth.uid() AND status IN ('DRAFT', 'SHOPPER_CLARIFICATION_REQUESTED')) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'auditor')) OR
    (primary_approver_id = auth.uid() AND status = 'PENDING_APPROVAL')
  );
