-- YashFit Phase 2 Database Schema
-- User Profiles Table with Row Level Security (RLS)

-- 1. Create Profile Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 13 AND age <= 120),
  height_cm NUMERIC(5, 2) NOT NULL CHECK (height_cm >= 80 AND height_cm <= 260),
  weight_kg NUMERIC(5, 2) NOT NULL CHECK (weight_kg >= 25 AND weight_kg <= 350),
  primary_goal TEXT NOT NULL CHECK (primary_goal IN (
    'Build Muscle',
    'Lose Fat',
    'Improve Fitness',
    'Increase Strength',
    'Maintain Fitness',
    'General Health/Fitness'
  )),
  experience_level TEXT NOT NULL CHECK (experience_level IN (
    'Beginner',
    'Intermediate',
    'Advanced'
  )),
  training_days_per_week INTEGER NOT NULL CHECK (training_days_per_week >= 2 AND training_days_per_week <= 7),
  training_environment TEXT NOT NULL CHECK (training_environment IN (
    'Commercial Gym',
    'Home Gym',
    'Home / Minimal Equipment',
    'Bodyweight Only'
  )),
  available_equipment TEXT[] DEFAULT '{}',
  dietary_preference TEXT NOT NULL CHECK (dietary_preference IN (
    'No Preference',
    'Vegetarian',
    'Vegan',
    'Eggetarian',
    'Non-Vegetarian'
  )),
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON public.profiles (user_id);

-- 3. Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view only their own profile
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_profiles_updated_at ON public.profiles;
CREATE TRIGGER on_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

