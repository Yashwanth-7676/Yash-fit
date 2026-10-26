-- Phase 12: Smart Training Autopilot Adaptations Table with RLS
CREATE TABLE IF NOT EXISTS public.autopilot_adaptations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  routine_name TEXT NOT NULL,
  previous_plan_summary TEXT NOT NULL,
  proposed_adjustment_summary TEXT NOT NULL,
  reason TEXT NOT NULL,
  user_decision TEXT NOT NULL DEFAULT 'accepted' CHECK (user_decision IN ('pending', 'accepted', 'modified', 'dismissed', 'undone')),
  outcome_summary TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.autopilot_adaptations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own autopilot adaptations" ON public.autopilot_adaptations;
CREATE POLICY "Users can manage their own autopilot adaptations"
  ON public.autopilot_adaptations
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS autopilot_adaptations_user_created_idx
  ON public.autopilot_adaptations (user_id, created_at DESC);
