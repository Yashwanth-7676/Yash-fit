-- Phase 11: 3D Virtual Gym Preferences Migration
CREATE TABLE IF NOT EXISTS public.virtual_gym_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_view_mode TEXT NOT NULL DEFAULT '3d' CHECK (preferred_view_mode IN ('3d', '2d')),
  preferred_camera TEXT NOT NULL DEFAULT 'iso' CHECK (preferred_camera IN ('front', 'side', 'back', 'angle', 'iso')),
  playback_speed NUMERIC(3, 2) NOT NULL DEFAULT 1.00 CHECK (playback_speed >= 0.25 AND playback_speed <= 3.00),
  favorite_exercise_ids TEXT[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT virtual_gym_preferences_user_unique UNIQUE (user_id)
);

ALTER TABLE public.virtual_gym_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own virtual gym preferences" ON public.virtual_gym_preferences;
CREATE POLICY "Users can manage their own virtual gym preferences"
  ON public.virtual_gym_preferences
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS virtual_gym_preferences_user_idx
  ON public.virtual_gym_preferences (user_id);

