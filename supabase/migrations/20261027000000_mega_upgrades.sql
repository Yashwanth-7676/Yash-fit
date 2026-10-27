-- ============================================================================
-- MEGA UPGRADE PACK #13-#16 MIGRATIONS
-- ============================================================================

-- 1. Idempotency Table for XP & RPG Rewards (Upgrade #13)
CREATE TABLE IF NOT EXISTS public.rpg_idempotent_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_key TEXT NOT NULL,
  source TEXT NOT NULL,
  xp_awarded INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT rpg_idempotent_event_user_key UNIQUE (user_id, event_key)
);

ALTER TABLE public.rpg_idempotent_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own idempotent events" ON public.rpg_idempotent_events;
CREATE POLICY "Users can manage their own idempotent events"
  ON public.rpg_idempotent_events
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS rpg_idempotent_user_key_idx
  ON public.rpg_idempotent_events (user_id, event_key);

-- 2. Enhanced Nutrition Plans & Meal Intelligence 2.0 (Upgrade #14)
CREATE TABLE IF NOT EXISTS public.nutrition_plans_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  regional_preference TEXT NOT NULL DEFAULT 'North Indian' CHECK (
    regional_preference IN ('North Indian', 'South Indian', 'East Indian', 'West Indian', 'High-Protein Modern')
  ),
  dietary_preference TEXT NOT NULL DEFAULT 'Vegetarian',
  budget_tier TEXT NOT NULL DEFAULT 'Moderate' CHECK (
    budget_tier IN ('Budget-Friendly', 'Moderate', 'Premium')
  ),
  daily_calories INTEGER NOT NULL,
  daily_protein INTEGER NOT NULL,
  daily_carbs INTEGER NOT NULL,
  daily_fats INTEGER NOT NULL,
  daily_water_liters NUMERIC(3, 1) NOT NULL DEFAULT 3.0,
  meals JSONB NOT NULL DEFAULT '[]'::jsonb,
  grocery_list JSONB NOT NULL DEFAULT '[]'::jsonb,
  meal_prep_notes JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.nutrition_plans_v2 ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their own nutrition plans v2" ON public.nutrition_plans_v2;
CREATE POLICY "Users manage their own nutrition plans v2"
  ON public.nutrition_plans_v2
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS nutrition_plans_v2_user_idx
  ON public.nutrition_plans_v2 (user_id, updated_at DESC);

-- 3. Body Transformation Photos & Measurements Extension (Upgrade #15)
ALTER TABLE public.body_measurements
  ADD COLUMN IF NOT EXISTS thigh_cm NUMERIC(5, 2) CHECK (thigh_cm >= 10 AND thigh_cm <= 150),
  ADD COLUMN IF NOT EXISTS neck_cm NUMERIC(5, 2) CHECK (neck_cm >= 10 AND neck_cm <= 100);

CREATE TABLE IF NOT EXISTS public.transformation_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recorded_date DATE NOT NULL,
  pose_type TEXT NOT NULL CHECK (pose_type IN ('front', 'side', 'back')),
  photo_data TEXT NOT NULL, -- Private Base64 URI or signed storage path
  weight_at_time NUMERIC(5, 2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.transformation_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their own transformation photos" ON public.transformation_photos;
CREATE POLICY "Users manage their own transformation photos"
  ON public.transformation_photos
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS transformation_photos_user_date_idx
  ON public.transformation_photos (user_id, recorded_date DESC);

-- 4. Multi-turn AI Coach Conversations (Upgrade #16)
CREATE TABLE IF NOT EXISTS public.coach_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  response_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.coach_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their own coach conversations" ON public.coach_conversations;
CREATE POLICY "Users manage their own coach conversations"
  ON public.coach_conversations
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS coach_conversations_user_created_idx
  ON public.coach_conversations (user_id, created_at ASC);

