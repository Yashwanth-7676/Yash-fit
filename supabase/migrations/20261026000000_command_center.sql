-- Migration: AI Fitness Command Center Tables & Policies
CREATE TABLE IF NOT EXISTS public.command_center_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_date DATE NOT NULL DEFAULT CURRENT_DATE,
  action_id TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, action_date, action_id)
);

ALTER TABLE public.command_center_actions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage their own command center actions" ON public.command_center_actions;
CREATE POLICY "Users manage their own command center actions"
  ON public.command_center_actions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS command_center_actions_user_date_idx
  ON public.command_center_actions (user_id, action_date DESC);

CREATE TABLE IF NOT EXISTS public.coach_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  response_text TEXT NOT NULL,
  provider_used TEXT NOT NULL DEFAULT 'rule_based',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.coach_interactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view their own coach interactions" ON public.coach_interactions;
CREATE POLICY "Users view their own coach interactions"
  ON public.coach_interactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert their own coach interactions" ON public.coach_interactions;
CREATE POLICY "Users insert their own coach interactions"
  ON public.coach_interactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS coach_interactions_user_created_idx
  ON public.coach_interactions (user_id, created_at DESC);

