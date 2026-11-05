-- ==============================================================================
-- YashFit Upgrade #39: Beta Testing & User Feedback System
-- Tables: beta_invitations, beta_testers, user_feedback, product_analytics_events, release_notes
-- ==============================================================================

-- 1. Beta Invitations Table
CREATE TABLE IF NOT EXISTS public.beta_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  email TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  role TEXT NOT NULL DEFAULT 'beta_tester' CHECK (role IN ('beta_tester', 'vip_tester', 'admin')),
  max_uses INTEGER NOT NULL DEFAULT 1 CHECK (max_uses >= 1),
  used_count INTEGER NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS beta_invitations_code_idx ON public.beta_invitations(code);
CREATE INDEX IF NOT EXISTS beta_invitations_active_idx ON public.beta_invitations(is_active);

ALTER TABLE public.beta_invitations ENABLE ROW LEVEL SECURITY;

-- Beta invitations policies:
-- Anyone authenticated or validating can read active, non-expired invitation codes
CREATE POLICY "Public validation of active beta invitations"
  ON public.beta_invitations
  FOR SELECT
  USING (
    is_active = true 
    AND (expires_at IS NULL OR expires_at > now()) 
    AND used_count < max_uses
  );

-- Admins can view and manage all invitations
CREATE POLICY "Admins full access to beta invitations"
  ON public.beta_invitations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.beta_testers
      WHERE beta_testers.user_id = auth.uid()
        AND beta_testers.role = 'admin'
        AND beta_testers.status = 'active'
    )
  );

-- 2. Beta Testers Table
CREATE TABLE IF NOT EXISTS public.beta_testers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code TEXT REFERENCES public.beta_invitations(code) ON DELETE SET NULL,
  role TEXT NOT NULL DEFAULT 'beta_tester' CHECK (role IN ('beta_tester', 'vip_tester', 'admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'left_program', 'revoked')),
  feedback_count INTEGER NOT NULL DEFAULT 0 CHECK (feedback_count >= 0),
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  left_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS beta_testers_user_id_idx ON public.beta_testers(user_id);
CREATE INDEX IF NOT EXISTS beta_testers_role_idx ON public.beta_testers(role);

ALTER TABLE public.beta_testers ENABLE ROW LEVEL SECURITY;

-- Testers can read their own tester profile
CREATE POLICY "Testers can view own profile"
  ON public.beta_testers
  FOR SELECT
  USING (auth.uid() = user_id);

-- Testers can register or update their own tester record (e.g. leave beta)
CREATE POLICY "Testers can update own status"
  ON public.beta_testers
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Testers can insert own registration"
  ON public.beta_testers
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view and manage all testers
CREATE POLICY "Admins manage all beta testers"
  ON public.beta_testers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.beta_testers bt
      WHERE bt.user_id = auth.uid()
        AND bt.role = 'admin'
        AND bt.status = 'active'
    )
  );

-- 3. User Feedback Table
CREATE TABLE IF NOT EXISTS public.user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('bug', 'feature_request', 'improvement', 'rating', 'general')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'workout_studio', 'nutrition', 'recovery', 'ai_coach', 
    'food_scanner', 'body_intelligence', 'arena', 'virtual_gym', 
    'analytics', 'ui_ux', 'performance', 'other'
  )),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  screenshot_url TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'in_progress', 'resolved', 'declined', 'duplicate')),
  admin_response TEXT,
  admin_notes TEXT,
  is_duplicate_of UUID REFERENCES public.user_feedback(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS user_feedback_user_id_idx ON public.user_feedback(user_id);
CREATE INDEX IF NOT EXISTS user_feedback_status_idx ON public.user_feedback(status);
CREATE INDEX IF NOT EXISTS user_feedback_type_idx ON public.user_feedback(type);
CREATE INDEX IF NOT EXISTS user_feedback_created_at_idx ON public.user_feedback(created_at DESC);

ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

-- Users can view their own feedback
CREATE POLICY "Users can view own feedback"
  ON public.user_feedback
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own feedback
CREATE POLICY "Users can insert own feedback"
  ON public.user_feedback
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view and update all feedback
CREATE POLICY "Admins full access to feedback"
  ON public.user_feedback
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.beta_testers
      WHERE beta_testers.user_id = auth.uid()
        AND beta_testers.role = 'admin'
        AND beta_testers.status = 'active'
    )
  );

-- 4. Privacy-Conscious Product Analytics Events Table
CREATE TABLE IF NOT EXISTS public.product_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('onboarding', 'feature_usage', 'workflow', 'error', 'performance')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS analytics_event_name_idx ON public.product_analytics_events(event_name);
CREATE INDEX IF NOT EXISTS analytics_category_idx ON public.product_analytics_events(category);
CREATE INDEX IF NOT EXISTS analytics_created_at_idx ON public.product_analytics_events(created_at DESC);

ALTER TABLE public.product_analytics_events ENABLE ROW LEVEL SECURITY;

-- Authenticated or anonymous users can insert events if permitted
CREATE POLICY "Users can insert analytics events"
  ON public.product_analytics_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Admins can read aggregate analytics events
CREATE POLICY "Admins can view analytics events"
  ON public.product_analytics_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.beta_testers
      WHERE beta_testers.user_id = auth.uid()
        AND beta_testers.role = 'admin'
        AND beta_testers.status = 'active'
    )
  );

-- 5. Release Notes / Changelog Table
CREATE TABLE IF NOT EXISTS public.release_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  release_date DATE NOT NULL,
  summary TEXT NOT NULL,
  features TEXT[] DEFAULT '{}',
  improvements TEXT[] DEFAULT '{}',
  bug_fixes TEXT[] DEFAULT '{}',
  known_issues TEXT[] DEFAULT '{}',
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS release_notes_version_idx ON public.release_notes(version);
CREATE INDEX IF NOT EXISTS release_notes_date_idx ON public.release_notes(release_date DESC);

ALTER TABLE public.release_notes ENABLE ROW LEVEL SECURITY;

-- Everyone can view published release notes
CREATE POLICY "Public read of published release notes"
  ON public.release_notes
  FOR SELECT
  USING (is_published = true);

-- Admins can manage all release notes
CREATE POLICY "Admins manage release notes"
  ON public.release_notes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.beta_testers
      WHERE beta_testers.user_id = auth.uid()
        AND beta_testers.role = 'admin'
        AND beta_testers.status = 'active'
    )
  );

