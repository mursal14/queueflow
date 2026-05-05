-- ============================================================
-- QUEUEFLOW — COMPLETE DATABASE SCHEMA v2
-- Run this entire file in Supabase SQL Editor → New Query → Run
-- ============================================================

-- ── PROFILES (extends auth.users) ────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id                     UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email                  TEXT UNIQUE NOT NULL,
  full_name              TEXT DEFAULT '',
  avatar_url             TEXT,
  plan                   TEXT DEFAULT 'free' CHECK (plan IN ('free','starter','professional','enterprise')),
  stripe_customer_id     TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  subscription_status    TEXT DEFAULT 'active',
  trial_ends_at          TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  onboarding_step        INT DEFAULT 0,
  onboarding_done        BOOLEAN DEFAULT FALSE,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

-- ── ORGANIZATIONS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organizations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  logo_url      TEXT,
  primary_color TEXT DEFAULT '#3b82f6',
  address       TEXT,
  timezone      TEXT DEFAULT 'America/New_York',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── TEAM MEMBERS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id         UUID REFERENCES profiles(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  role            TEXT DEFAULT 'staff' CHECK (role IN ('admin','staff','viewer')),
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','active','disabled')),
  invite_token    TEXT UNIQUE DEFAULT gen_random_uuid()::TEXT,
  invited_at      TIMESTAMPTZ DEFAULT NOW(),
  joined_at       TIMESTAMPTZ,
  UNIQUE(organization_id, email)
);

-- ── LOCATIONS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS locations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name            TEXT NOT NULL,
  address         TEXT,
  timezone        TEXT DEFAULT 'America/New_York',
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── QUEUES ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS queues (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id      UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  location_id          UUID REFERENCES locations(id) ON DELETE SET NULL,
  name                 TEXT NOT NULL,
  description          TEXT,
  prefix               TEXT DEFAULT 'A',
  current_number       INT DEFAULT 0,
  status               TEXT DEFAULT 'active' CHECK (status IN ('active','paused','closed')),
  avg_service_minutes  INT DEFAULT 10,
  public_id            TEXT UNIQUE NOT NULL DEFAULT LEFT(gen_random_uuid()::TEXT, 8),
  require_phone        BOOLEAN DEFAULT FALSE,
  require_email        BOOLEAN DEFAULT FALSE,
  max_capacity         INT DEFAULT 200,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ── QUEUE ENTRIES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS queue_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id        UUID REFERENCES queues(id) ON DELETE CASCADE NOT NULL,
  ticket_number   TEXT NOT NULL,
  customer_name   TEXT NOT NULL,
  customer_phone  TEXT,
  customer_email  TEXT,
  position        INT NOT NULL,
  status          TEXT DEFAULT 'waiting' CHECK (status IN ('waiting','called','serving','completed','noshow','cancelled')),
  notes           TEXT,
  counter         TEXT,
  joined_at       TIMESTAMPTZ DEFAULT NOW(),
  called_at       TIMESTAMPTZ,
  served_at       TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  served_by       UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- ── DISPLAY SCREENS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS display_screens (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  location_id     UUID REFERENCES locations(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  access_token    TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::TEXT,
  theme           TEXT DEFAULT 'dark' CHECK (theme IN ('dark','light','brand')),
  voice_enabled   BOOLEAN DEFAULT TRUE,
  voice_gender    TEXT DEFAULT 'female' CHECK (voice_gender IN ('male','female')),
  voice_rate      FLOAT DEFAULT 0.9,
  voice_pitch     FLOAT DEFAULT 1.1,
  last_seen_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── NOTIFICATIONS LOG ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_entry_id UUID REFERENCES queue_entries(id) ON DELETE CASCADE NOT NULL,
  type           TEXT CHECK (type IN ('sms','email','push')),
  status         TEXT DEFAULT 'pending' CHECK (status IN ('pending','sent','failed')),
  message        TEXT,
  sent_at        TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── ANALYTICS DAILY ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analytics_daily (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id       UUID REFERENCES queues(id) ON DELETE CASCADE NOT NULL,
  date           DATE NOT NULL,
  total_served   INT DEFAULT 0,
  avg_wait_mins  FLOAT DEFAULT 0,
  avg_serve_mins FLOAT DEFAULT 0,
  peak_hour      INT,
  UNIQUE(queue_id, date)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_queue_entries_queue_status   ON queue_entries(queue_id, status);
CREATE INDEX IF NOT EXISTS idx_queue_entries_queue_position ON queue_entries(queue_id, position);
CREATE INDEX IF NOT EXISTS idx_queue_entries_joined_at      ON queue_entries(joined_at DESC);
CREATE INDEX IF NOT EXISTS idx_queues_public_id             ON queues(public_id);
CREATE INDEX IF NOT EXISTS idx_queues_org                   ON queues(organization_id);
CREATE INDEX IF NOT EXISTS idx_team_org                     ON team_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_locations_org                ON locations(organization_id);
CREATE INDEX IF NOT EXISTS idx_display_token                ON display_screens(access_token);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer     ON profiles(stripe_customer_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE queues           ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_entries    ENABLE ROW LEVEL SECURITY;
ALTER TABLE display_screens  ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications    ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily  ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only access their own
DROP POLICY IF EXISTS "own_profile_all"    ON profiles;
CREATE POLICY "own_profile_all" ON profiles FOR ALL USING (auth.uid() = id);

-- Organizations: owner full access; team members can read
DROP POLICY IF EXISTS "org_owner_all"      ON organizations;
DROP POLICY IF EXISTS "org_team_read"      ON organizations;
CREATE POLICY "org_owner_all"  ON organizations FOR ALL  USING (owner_id = auth.uid());
CREATE POLICY "org_team_read"  ON organizations FOR SELECT USING (
  id IN (SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND status = 'active')
);

-- Team members: org owner manages all; member sees own row
DROP POLICY IF EXISTS "team_owner_all"     ON team_members;
DROP POLICY IF EXISTS "team_member_read"   ON team_members;
CREATE POLICY "team_owner_all"   ON team_members FOR ALL    USING (organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()));
CREATE POLICY "team_member_read" ON team_members FOR SELECT USING (user_id = auth.uid());

-- Locations: org owner full; team active read
DROP POLICY IF EXISTS "loc_owner_all"      ON locations;
DROP POLICY IF EXISTS "loc_team_read"      ON locations;
CREATE POLICY "loc_owner_all"  ON locations FOR ALL    USING (organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()));
CREATE POLICY "loc_team_read"  ON locations FOR SELECT USING (organization_id IN (SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'));

-- Queues: public SELECT for join page; owner+staff can manage
DROP POLICY IF EXISTS "queues_public_read" ON queues;
DROP POLICY IF EXISTS "queues_owner_all"   ON queues;
DROP POLICY IF EXISTS "queues_staff_all"   ON queues;
CREATE POLICY "queues_public_read" ON queues FOR SELECT USING (true);
CREATE POLICY "queues_owner_all"   ON queues FOR ALL    USING (organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()));
CREATE POLICY "queues_staff_all"   ON queues FOR ALL    USING (organization_id IN (SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND status = 'active' AND role IN ('admin','staff')));

-- Queue entries: public read+insert for join page; staff can update
DROP POLICY IF EXISTS "entries_public_read"   ON queue_entries;
DROP POLICY IF EXISTS "entries_public_insert" ON queue_entries;
DROP POLICY IF EXISTS "entries_owner_all"     ON queue_entries;
DROP POLICY IF EXISTS "entries_staff_update"  ON queue_entries;
CREATE POLICY "entries_public_read"   ON queue_entries FOR SELECT USING (true);
CREATE POLICY "entries_public_insert" ON queue_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "entries_owner_all"     ON queue_entries FOR ALL    USING (queue_id IN (SELECT id FROM queues WHERE organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())));
CREATE POLICY "entries_staff_update"  ON queue_entries FOR UPDATE USING (queue_id IN (SELECT q.id FROM queues q JOIN team_members tm ON q.organization_id = tm.organization_id WHERE tm.user_id = auth.uid() AND tm.status = 'active'));

-- Display screens: public SELECT (URL-token protected at app level); owner manages
DROP POLICY IF EXISTS "display_public_read" ON display_screens;
DROP POLICY IF EXISTS "display_owner_all"   ON display_screens;
CREATE POLICY "display_public_read" ON display_screens FOR SELECT USING (true);
CREATE POLICY "display_owner_all"   ON display_screens FOR ALL    USING (organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()));

-- Analytics: owner read
DROP POLICY IF EXISTS "analytics_owner_read" ON analytics_daily;
CREATE POLICY "analytics_owner_read" ON analytics_daily FOR SELECT USING (
  queue_id IN (SELECT id FROM queues WHERE organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()))
);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Atomic ticket number generation
CREATE OR REPLACE FUNCTION next_ticket(queue_uuid UUID)
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  q_prefix TEXT;
  q_num    INT;
BEGIN
  UPDATE queues
  SET current_number = current_number + 1
  WHERE id = queue_uuid
  RETURNING prefix, current_number INTO q_prefix, q_num;

  RETURN q_prefix || LPAD(q_num::TEXT, 3, '0');
END;
$$;

-- Reorder positions after cancellation
CREATE OR REPLACE FUNCTION reorder_queue_positions(queue_uuid UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE queue_entries
  SET position = sub.new_pos
  FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY joined_at) AS new_pos
    FROM queue_entries
    WHERE queue_id = queue_uuid AND status = 'waiting'
  ) sub
  WHERE queue_entries.id = sub.id;
END;
$$;

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS organizations_updated_at ON organizations;
CREATE TRIGGER organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS queues_updated_at ON queues;
CREATE TRIGGER queues_updated_at BEFORE UPDATE ON queues FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE queue_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE queues;
ALTER PUBLICATION supabase_realtime ADD TABLE display_screens;

-- ============================================================
-- DONE ✅
-- ============================================================
