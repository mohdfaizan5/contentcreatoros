-- Content OS Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TEMPLATES TABLE (created first - no dependencies on other app tables)
-- ============================================
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  platform_type TEXT NOT NULL CHECK (platform_type IN ('x', 'youtube', 'linkedin', 'generic')),
  hook_style TEXT,
  length TEXT,
  tone TEXT,
  cta_style TEXT,
  instructions TEXT,
  structure_fields JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- IDEAS TABLE (references templates, but NOT series yet - added later)
-- ============================================
CREATE TABLE IF NOT EXISTS ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  raw_text TEXT,
  idea_type TEXT NOT NULL DEFAULT 'standalone' CHECK (idea_type IN ('standalone', 'series_concept')),
  status TEXT NOT NULL DEFAULT 'dumped' CHECK (status IN ('dumped', 'refined', 'planned', 'scripted')),
  linked_series_id UUID,  -- FK added later to avoid circular dependency
  linked_template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
  target_platform TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- SERIES TABLE (references ideas, but NOT referenced by ideas yet)
-- ============================================
CREATE TABLE IF NOT EXISTS series (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  target_platform TEXT,
  total_planned_items INTEGER DEFAULT 0,
  origin_idea_id UUID REFERENCES ideas(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- ADD DEFERRED FOREIGN KEY (circular dependency resolution)
-- ============================================
-- Now that series table exists, add the FK from ideas to series
ALTER TABLE ideas 
  ADD CONSTRAINT fk_ideas_linked_series 
  FOREIGN KEY (linked_series_id) 
  REFERENCES series(id) 
  ON DELETE SET NULL;

-- ============================================
-- INSPIRATION TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS inspiration (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'content' CHECK (type IN ('creator', 'content')),
  title TEXT,
  notes TEXT,
  what_worked TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- LINK PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS link_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- LINKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES link_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- LEAD MAGNETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS lead_magnets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  collect_fields TEXT NOT NULL DEFAULT 'email_only' CHECK (collect_fields IN ('email_only', 'name_and_email')),
  delivery_type TEXT NOT NULL DEFAULT 'download' CHECK (delivery_type IN ('download', 'redirect', 'content')),
  delivery_url TEXT,
  delivery_content TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, slug)
);

-- ============================================
-- LEADS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  magnet_id UUID NOT NULL REFERENCES lead_magnets(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_ideas_user_id ON ideas(user_id);
CREATE INDEX IF NOT EXISTS idx_ideas_status ON ideas(status);
CREATE INDEX IF NOT EXISTS idx_ideas_type ON ideas(idea_type);
CREATE INDEX IF NOT EXISTS idx_ideas_series ON ideas(linked_series_id);
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id);
CREATE INDEX IF NOT EXISTS idx_series_user_id ON series(user_id);
CREATE INDEX IF NOT EXISTS idx_inspiration_user_id ON inspiration(user_id);
CREATE INDEX IF NOT EXISTS idx_link_profiles_username ON link_profiles(username);
CREATE INDEX IF NOT EXISTS idx_links_profile_id ON links(profile_id);
CREATE INDEX IF NOT EXISTS idx_lead_magnets_user_id ON lead_magnets(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_magnets_slug ON lead_magnets(slug);
CREATE INDEX IF NOT EXISTS idx_leads_magnet_id ON leads(magnet_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE series ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspiration ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE links ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_magnets ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- IDEAS policies
CREATE POLICY "Users can view own ideas" ON ideas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ideas" ON ideas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ideas" ON ideas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ideas" ON ideas FOR DELETE USING (auth.uid() = user_id);

-- TEMPLATES policies
CREATE POLICY "Users can view own templates" ON templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own templates" ON templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own templates" ON templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own templates" ON templates FOR DELETE USING (auth.uid() = user_id);

-- SERIES policies
CREATE POLICY "Users can view own series" ON series FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own series" ON series FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own series" ON series FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own series" ON series FOR DELETE USING (auth.uid() = user_id);

-- INSPIRATION policies
CREATE POLICY "Users can view own inspiration" ON inspiration FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own inspiration" ON inspiration FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own inspiration" ON inspiration FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own inspiration" ON inspiration FOR DELETE USING (auth.uid() = user_id);

-- LINK_PROFILES policies
CREATE POLICY "Users can view own profile" ON link_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view public profiles" ON link_profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON link_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON link_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own profile" ON link_profiles FOR DELETE USING (auth.uid() = user_id);

-- LINKS policies
CREATE POLICY "Users can view own links" ON links FOR SELECT USING (
  EXISTS (SELECT 1 FROM link_profiles WHERE link_profiles.id = links.profile_id AND link_profiles.user_id = auth.uid())
);
CREATE POLICY "Anyone can view active links" ON links FOR SELECT USING (
  is_active = true
);
CREATE POLICY "Users can insert own links" ON links FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM link_profiles WHERE link_profiles.id = links.profile_id AND link_profiles.user_id = auth.uid())
);
CREATE POLICY "Users can update own links" ON links FOR UPDATE USING (
  EXISTS (SELECT 1 FROM link_profiles WHERE link_profiles.id = links.profile_id AND link_profiles.user_id = auth.uid())
);
CREATE POLICY "Users can delete own links" ON links FOR DELETE USING (
  EXISTS (SELECT 1 FROM link_profiles WHERE link_profiles.id = links.profile_id AND link_profiles.user_id = auth.uid())
);

-- LEAD_MAGNETS policies
CREATE POLICY "Users can view own magnets" ON lead_magnets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view active magnets" ON lead_magnets FOR SELECT USING (is_active = true);
CREATE POLICY "Users can insert own magnets" ON lead_magnets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own magnets" ON lead_magnets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own magnets" ON lead_magnets FOR DELETE USING (auth.uid() = user_id);

-- LEADS policies
CREATE POLICY "Users can view leads for own magnets" ON leads FOR SELECT USING (
  EXISTS (SELECT 1 FROM lead_magnets WHERE lead_magnets.id = leads.magnet_id AND lead_magnets.user_id = auth.uid())
);
CREATE POLICY "Anyone can insert leads" ON leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can delete leads for own magnets" ON leads FOR DELETE USING (
  EXISTS (SELECT 1 FROM lead_magnets WHERE lead_magnets.id = leads.magnet_id AND lead_magnets.user_id = auth.uid())
);

-- ============================================
-- UPDATE TIMESTAMP TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ideas_updated_at BEFORE UPDATE ON ideas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_series_updated_at BEFORE UPDATE ON series FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inspiration_updated_at BEFORE UPDATE ON inspiration FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_link_profiles_updated_at BEFORE UPDATE ON link_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_links_updated_at BEFORE UPDATE ON links FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lead_magnets_updated_at BEFORE UPDATE ON lead_magnets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
