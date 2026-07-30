CREATE TABLE IF NOT EXISTS public.feedback_notes (
  id TEXT PRIMARY KEY,
  author_id UUID NOT NULL REFERENCES public.profiles(id),
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL,
  note_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_notes_created_at
ON public.feedback_notes(created_at DESC);

ALTER TABLE public.feedback_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS feedback_notes_select_staff ON public.feedback_notes;
DROP POLICY IF EXISTS feedback_notes_insert_authenticated ON public.feedback_notes;
DROP POLICY IF EXISTS feedback_notes_delete_admin ON public.feedback_notes;

CREATE POLICY feedback_notes_select_staff
ON public.feedback_notes FOR SELECT
USING (public.current_app_role() IN ('admin', 'auditor', 'manager'));

CREATE POLICY feedback_notes_insert_authenticated
ON public.feedback_notes FOR INSERT
WITH CHECK (auth.uid() = author_id);

CREATE POLICY feedback_notes_delete_admin
ON public.feedback_notes FOR DELETE
USING (public.current_app_role() = 'admin' OR auth.uid() = author_id);
