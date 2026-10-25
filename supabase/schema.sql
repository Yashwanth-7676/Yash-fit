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

-- 4b. Auto-create profile record upon user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    first_name,
    age,
    height_cm,
    weight_kg,
    primary_goal,
    experience_level,
    training_days_per_week,
    training_environment,
    dietary_preference,
    onboarding_completed
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'Athlete'),
    25,
    175,
    70,
    'Build Muscle',
    'Beginner',
    4,
    'Commercial Gym',
    'No Preference',
    false
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ========================================================
-- Phase 3: Exercises & Workout Session Logs
-- ========================================================

-- 5. Exercises Table
CREATE TABLE IF NOT EXISTS public.exercises (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  primary_muscle TEXT NOT NULL,
  secondary_muscles TEXT[] DEFAULT '{}',
  equipment TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  instructions TEXT[] NOT NULL,
  tips TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view exercises"
  ON public.exercises
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- 6. Workout Session Logs
CREATE TABLE IF NOT EXISTS public.workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  routine_name TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  total_volume_kg NUMERIC(8, 2) NOT NULL DEFAULT 0,
  total_sets_completed INTEGER NOT NULL DEFAULT 0,
  exercise_logs JSONB NOT NULL DEFAULT '[]'::jsonb,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own workout logs"
  ON public.workout_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workout logs"
  ON public.workout_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ========================================================
-- Phase 4: Nutrition & Indian Meal Database
-- ========================================================

-- 7. Nutrition Plans Table
CREATE TABLE IF NOT EXISTS public.nutrition_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_calories INTEGER NOT NULL,
  target_protein_g INTEGER NOT NULL,
  target_carbs_g INTEGER NOT NULL,
  target_fats_g INTEGER NOT NULL,
  water_liters NUMERIC(3, 1) NOT NULL DEFAULT 3.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.nutrition_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own nutrition plans"
  ON public.nutrition_plans
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own nutrition plans"
  ON public.nutrition_plans
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own nutrition plans"
  ON public.nutrition_plans
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 8. Food Database Table
CREATE TABLE IF NOT EXISTS public.foods (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  serving_size TEXT NOT NULL,
  calories INTEGER NOT NULL,
  protein_g NUMERIC(5, 1) NOT NULL,
  carbs_g NUMERIC(5, 1) NOT NULL,
  fats_g NUMERIC(5, 1) NOT NULL,
  dietary_preference TEXT NOT NULL,
  is_budget_friendly BOOLEAN DEFAULT false,
  cost_inr INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view food database"
  ON public.foods
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- ========================================================
-- Phase 5: Grocery Shopping Lists
-- ========================================================

-- 9. Grocery Items Table
CREATE TABLE IF NOT EXISTS public.grocery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity TEXT NOT NULL DEFAULT '1 pack',
  category TEXT NOT NULL,
  estimated_cost_inr NUMERIC(6, 2) NOT NULL DEFAULT 50,
  checked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.grocery_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own grocery items"
  ON public.grocery_items
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own grocery items"
  ON public.grocery_items
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own grocery items"
  ON public.grocery_items
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own grocery items"
  ON public.grocery_items
  FOR DELETE
  USING (auth.uid() = user_id);

-- ========================================================
-- Phase 6: Recovery Intelligence Logs
-- ========================================================

-- 10. Recovery Logs Table
CREATE TABLE IF NOT EXISTS public.recovery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  sleep_hours NUMERIC(3, 1) NOT NULL,
  sleep_quality INTEGER NOT NULL CHECK (sleep_quality >= 1 AND sleep_quality <= 5),
  soreness TEXT NOT NULL,
  energy TEXT NOT NULL,
  stress TEXT NOT NULL,
  readiness_score INTEGER NOT NULL CHECK (readiness_score >= 0 AND readiness_score <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.recovery_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recovery logs"
  ON public.recovery_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recovery logs"
  ON public.recovery_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recovery logs"
  ON public.recovery_logs
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 11. Performance Indexes
CREATE INDEX IF NOT EXISTS workout_logs_user_id_idx ON public.workout_logs (user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS recovery_logs_user_date_idx ON public.recovery_logs (user_id, date DESC);
CREATE INDEX IF NOT EXISTS grocery_items_user_id_idx ON public.grocery_items (user_id);
CREATE INDEX IF NOT EXISTS nutrition_plans_user_id_idx ON public.nutrition_plans (user_id);

-- ========================================================
-- Seed Data: Exercises (Idempotent)
-- ========================================================
INSERT INTO public.exercises (id, name, primary_muscle, secondary_muscles, equipment, difficulty, instructions, tips)
VALUES
  ('ex-barbell-bench-press', 'Barbell Bench Press', 'Chest', ARRAY['Triceps', 'Shoulders'], 'Barbell', 'Intermediate', 
   ARRAY['Lie flat on bench with eyes directly under the bar.', 'Grip the bar slightly wider than shoulder width.', 'Lower with control to mid-chest while tucking elbows slightly.', 'Press upward explosively through chest until arms are extended.'], 
   ARRAY['Keep feet planted firmly on the floor.', 'Retract your shoulder blades for shoulder safety.']),
  ('ex-incline-dumbbell-press', 'Incline Dumbbell Press', 'Chest', ARRAY['Shoulders', 'Triceps'], 'Dumbbells', 'Beginner', 
   ARRAY['Set bench to a 30-degree incline.', 'Hold dumbbells at chest height with palms facing forward.', 'Press dumbbells upward until elbows are almost locked out.', 'Lower slowly under control back to collarbone level.'], 
   ARRAY['Avoid setting the incline too high to prevent front delt takeover.']),
  ('ex-pull-up', 'Pull-Up', 'Back', ARRAY['Biceps', 'Core'], 'Pull-up Bar', 'Intermediate', 
   ARRAY['Grip overhead bar with palms facing away, shoulder-width apart.', 'Engage core and pull elbows down toward hips until chin clears bar.', 'Pause momentarily at the peak.', 'Lower with control to full dead-hang extension.'], 
   ARRAY['Avoid kicking or swinging your legs.']),
  ('ex-barbell-deadlift', 'Conventional Barbell Deadlift', 'Back', ARRAY['Hamstrings', 'Glutes', 'Core'], 'Barbell', 'Advanced', 
   ARRAY['Stand with mid-foot directly under the barbell, feet hip-width apart.', 'Hinge at hips, bend knees slightly, and grip bar just outside knees.', 'Pack lats, flatten back, and push floor away with your legs.', 'Lock out hips and knees simultaneously at the top.'], 
   ARRAY['Never round your lower spine under heavy loads.', 'Keep the bar dragging close to your shins.']),
  ('ex-barbell-back-squat', 'Barbell Back Squat', 'Quads', ARRAY['Glutes', 'Hamstrings', 'Core'], 'Barbell', 'Intermediate', 
   ARRAY['Position barbell across upper traps, step back into shoulder-width stance.', 'Take a deep belly breath, brace core, and break at hips and knees together.', 'Descend until hip crease is below parallel with knees.', 'Drive straight up through mid-foot to starting position.'], 
   ARRAY['Keep chest up and knees tracking in line with toes.']),
  ('ex-overhead-barbell-press', 'Standing Overhead Press (OHP)', 'Shoulders', ARRAY['Triceps', 'Core'], 'Barbell', 'Intermediate', 
   ARRAY['Stand with barbell resting across anterior deltoids and clavicle.', 'Brace glutes and abs firmly.', 'Press the bar straight upward, tucking head slightly to let the bar pass.', 'Lock arms overhead and push head slightly forward.'], 
   ARRAY['Avoid hyperextending your lumbar spine.'])
ON CONFLICT (id) DO NOTHING;

-- ========================================================
-- Seed Data: Indian Foods (Idempotent)
-- ========================================================
INSERT INTO public.foods (id, name, serving_size, calories, protein_g, carbs_g, fats_g, dietary_preference, is_budget_friendly, cost_inr)
VALUES
  ('food-paneer-100g', 'Low-Fat Paneer Bhurji / Cubes', '100g', 220, 20.0, 4.0, 14.0, 'Vegetarian', false, 45),
  ('food-soya-chunks-50g', 'Boiled Soya Chunks Curry', '50g (Dry weight)', 170, 26.0, 15.0, 1.0, 'Vegetarian', true, 15),
  ('food-curd-greek-200g', 'Hung Curd / Greek Yogurt', '200g', 130, 14.0, 8.0, 4.0, 'Vegetarian', true, 25),
  ('food-whole-eggs-2', 'Boiled Whole Eggs (2 Eggs)', '2 Large Eggs', 155, 13.0, 1.0, 11.0, 'Eggetarian', true, 16),
  ('food-chicken-breast-150g', 'Grilled Chicken Breast', '150g raw weight', 195, 36.0, 0.0, 4.0, 'Non-Vegetarian', false, 65)
ON CONFLICT (id) DO NOTHING;




-- ========================================================
-- Phase 7: Anime Fitness RPG (XP, Level, Quests, Badges)
-- ========================================================

-- 12. User RPG Progress Table
CREATE TABLE IF NOT EXISTS public.user_rpg_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp INTEGER NOT NULL DEFAULT 0,
  current_level INTEGER NOT NULL DEFAULT 1,
  rank TEXT NOT NULL DEFAULT 'Rookie',
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_active_date DATE DEFAULT CURRENT_DATE,
  avatar_id TEXT NOT NULL DEFAULT 'avatar-kenji',
  equipped_title TEXT NOT NULL DEFAULT 'Novice Adventurer',
  unlocked_avatars TEXT[] NOT NULL DEFAULT ARRAY['avatar-kenji', 'avatar-aoi'],
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.user_rpg_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own RPG progress"
  ON public.user_rpg_progress FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own RPG progress"
  ON public.user_rpg_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own RPG progress"
  ON public.user_rpg_progress FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 13. XP Transactions Log (Audit Trail)
CREATE TABLE IF NOT EXISTS public.xp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  source TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own XP history"
  ON public.xp_transactions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own XP history"
  ON public.xp_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 14. User Quests
CREATE TABLE IF NOT EXISTS public.user_quests (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quest_id TEXT NOT NULL,
  frequency TEXT NOT NULL,
  title TEXT NOT NULL,
  target_value INTEGER NOT NULL,
  current_value INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  claimed BOOLEAN NOT NULL DEFAULT false,
  reward_xp INTEGER NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.user_quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quests"
  ON public.user_quests FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own quests"
  ON public.user_quests FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 15. User Achievements
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, achievement_id)
);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their achievements"
  ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their achievements"
  ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ========================================================
-- Phase 8: Social Community, Challenges & Friends
-- ========================================================

-- 16. User Privacy Settings
CREATE TABLE IF NOT EXISTS public.user_privacy_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_visibility TEXT NOT NULL DEFAULT 'public' CHECK (profile_visibility IN ('public', 'friends', 'private')),
  show_on_leaderboards BOOLEAN NOT NULL DEFAULT true,
  allow_friend_requests BOOLEAN NOT NULL DEFAULT true,
  share_workout_activity BOOLEAN NOT NULL DEFAULT true,
  share_achievements BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.user_privacy_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own privacy"
  ON public.user_privacy_settings FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own privacy"
  ON public.user_privacy_settings FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 17. Fitness Challenges
CREATE TABLE IF NOT EXISTS public.fitness_challenges (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  creator_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  target_count INTEGER NOT NULL,
  reward_xp INTEGER NOT NULL,
  badge_icon TEXT NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.fitness_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public challenges"
  ON public.fitness_challenges FOR SELECT USING (is_public = true);

-- 18. Challenge Participants
CREATE TABLE IF NOT EXISTS public.challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id TEXT NOT NULL REFERENCES public.fitness_challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_progress INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(challenge_id, user_id)
);

ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their challenges"
  ON public.challenge_participants FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can join challenges"
  ON public.challenge_participants FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 19. Friendships and Requests
CREATE TABLE IF NOT EXISTS public.friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(sender_id, receiver_id)
);

ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their friend requests"
  ON public.friend_requests FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- 20. Social Activity Feed
CREATE TABLE IF NOT EXISTS public.social_activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  stat_highlight TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.social_activity_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activity feed"
  ON public.social_activity_feed FOR SELECT TO authenticated, anon USING (true);



-- ========================================================
-- Phase 9: Private Fitness Digital Twin Records
-- ========================================================

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


