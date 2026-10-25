CREATE TABLE IF NOT EXISTS public.body_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  weight_kg NUMERIC(5, 2) CHECK (weight_kg >= 25 AND weight_kg <= 350),
  waist_cm NUMERIC(5, 2) CHECK (waist_cm >= 20 AND waist_cm <= 250),
  chest_cm NUMERIC(5, 2) CHECK (chest_cm >= 20 AND chest_cm <= 250),
  hips_cm NUMERIC(5, 2) CHECK (hips_cm >= 20 AND hips_cm <= 250),
  arm_cm NUMERIC(5, 2) CHECK (arm_cm >= 5 AND arm_cm <= 120),
  CHECK (num_nonnulls(weight_kg, waist_cm, chest_cm, hips_cm, arm_cm) > 0)
);

ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage their own body measurements" ON public.body_measurements;
CREATE POLICY "Users manage their own body measurements"
  ON public.body_measurements
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS body_measurements_user_recorded_idx
  ON public.body_measurements (user_id, recorded_at DESC);

CREATE TABLE IF NOT EXISTS public.fitness_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  routine_id TEXT NOT NULL,
  scenario JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.fitness_scenarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage their own fitness scenarios" ON public.fitness_scenarios;
CREATE POLICY "Users manage their own fitness scenarios"
  ON public.fitness_scenarios
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS fitness_scenarios_user_updated_idx
  ON public.fitness_scenarios (user_id, updated_at DESC);

ALTER TABLE IF EXISTS public.workout_logs
  ADD COLUMN IF NOT EXISTS exercise_logs JSONB NOT NULL DEFAULT '[]'::jsonb;
