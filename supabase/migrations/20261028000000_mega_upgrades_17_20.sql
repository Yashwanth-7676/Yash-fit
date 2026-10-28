-- ============================================================================
-- MEGA UPGRADE PACK #17-#20 MIGRATIONS
-- Ultimate Fitness Ecosystem
-- ============================================================================

-- 1. Fitness Groups (Upgrade #18)
CREATE TABLE IF NOT EXISTS public.fitness_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE NOT NULL,
  is_private BOOLEAN NOT NULL DEFAULT true,
  member_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.fitness_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view groups they created or are members of, or public groups" ON public.fitness_groups;
CREATE POLICY "Users can view groups they created or are members of, or public groups"
  ON public.fitness_groups
  FOR SELECT
  TO authenticated
  USING (
    NOT is_private
    OR creator_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = fitness_groups.id AND gm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create groups" ON public.fitness_groups;
CREATE POLICY "Users can create groups"
  ON public.fitness_groups
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Creators can update groups" ON public.fitness_groups;
CREATE POLICY "Creators can update groups"
  ON public.fitness_groups
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

-- Group Members
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.fitness_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT group_member_unique UNIQUE (group_id, user_id)
);

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view other members in their groups" ON public.group_members;
CREATE POLICY "Members can view other members in their groups"
  ON public.group_members
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can join or leave groups" ON public.group_members;
CREATE POLICY "Users can join or leave groups"
  ON public.group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove their own membership" ON public.group_members;
CREATE POLICY "Users can remove their own membership"
  ON public.group_members
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 2. Social Moderation & Privacy: Reports & Blocks (Upgrade #18)
CREATE TABLE IF NOT EXISTS public.social_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('user', 'activity', 'comment', 'group')),
  target_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.social_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can submit reports" ON public.social_reports;
CREATE POLICY "Users can submit reports"
  ON public.social_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Users can view reports they created" ON public.social_reports;
CREATE POLICY "Users can view reports they created"
  ON public.social_reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

CREATE TABLE IF NOT EXISTS public.blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT blocked_user_unique UNIQUE (user_id, blocked_user_id)
);

ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their blocked list" ON public.blocked_users;
CREATE POLICY "Users can manage their blocked list"
  ON public.blocked_users
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Wearable Connections & Raw Metrics (Upgrade #19)
CREATE TABLE IF NOT EXISTS public.wearable_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('apple_health', 'google_health_connect', 'fitbit', 'garmin', 'whoop', 'oura', 'strava')),
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error', 'pending_auth')),
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_sync_at TIMESTAMPTZ,
  rate_limit_reset_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT wearable_connection_user_provider UNIQUE (user_id, provider)
);

ALTER TABLE public.wearable_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own wearable connections" ON public.wearable_connections;
CREATE POLICY "Users can manage their own wearable connections"
  ON public.wearable_connections
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.imported_wearable_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_provider TEXT NOT NULL,
  metric_date DATE NOT NULL,
  step_count INTEGER,
  resting_heart_rate INTEGER,
  sleep_hours NUMERIC(4, 2),
  active_calories INTEGER,
  raw_data JSONB,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT imported_wearable_user_metric UNIQUE (user_id, source_provider, metric_date)
);

ALTER TABLE public.imported_wearable_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their imported wearable metrics" ON public.imported_wearable_metrics;
CREATE POLICY "Users can manage their imported wearable metrics"
  ON public.imported_wearable_metrics
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Fitness Life Autopilot: Daily Plans & Reminder Preferences (Upgrade #20)
CREATE TABLE IF NOT EXISTS public.daily_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'missed')),
  tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  completed_task_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  time_slots JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT daily_plans_user_date UNIQUE (user_id, plan_date)
);

ALTER TABLE public.daily_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own daily plans" ON public.daily_plans;
CREATE POLICY "Users can manage their own daily plans"
  ON public.daily_plans
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiet_hours_start TEXT NOT NULL DEFAULT '22:00',
  quiet_hours_end TEXT NOT NULL DEFAULT '07:00',
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  workout_reminders BOOLEAN NOT NULL DEFAULT true,
  meal_reminders BOOLEAN NOT NULL DEFAULT true,
  hydration_reminders BOOLEAN NOT NULL DEFAULT true,
  recovery_reminders BOOLEAN NOT NULL DEFAULT true,
  push_channel_enabled BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT notification_preferences_user UNIQUE (user_id)
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can manage their notification preferences"
  ON public.notification_preferences
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
