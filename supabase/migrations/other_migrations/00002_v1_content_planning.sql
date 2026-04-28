-- V1 Content Planning Migration
-- This migration adds support for:
-- 1. Editor.js content in ideas
-- 2. Content planning kanban board
-- 3. User workflow preferences

-- ============================================
-- UPDATE IDEAS TABLE
-- Add content field for Editor.js JSON data
-- ============================================
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS content JSONB;

-- Index for searching within content
CREATE INDEX IF NOT EXISTS idx_ideas_content ON ideas USING GIN (content);

-- ============================================
-- CONTENT TABLE (Planning Board Cards)
-- ============================================
CREATE TABLE IF NOT EXISTS content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  idea_id UUID REFERENCES ideas(id) ON DELETE SET NULL,
  platforms TEXT[] NOT NULL DEFAULT '{}',
  content_type TEXT,
  series_id UUID REFERENCES series(id) ON DELETE SET NULL,
  column_id TEXT NOT NULL, -- Current kanban column name
  checked BOOLEAN NOT NULL DEFAULT false,
  "order" INTEGER NOT NULL DEFAULT 0, -- Order within column
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- USER WORKFLOWS TABLE (Onboarding Preferences)
-- ============================================
CREATE TABLE IF NOT EXISTS user_workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  columns JSONB NOT NULL, -- Array of column names: ["Starting Point", "Edited", "Done"]
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_content_user_id ON content(user_id);
CREATE INDEX IF NOT EXISTS idx_content_column_id ON content(column_id);
CREATE INDEX IF NOT EXISTS idx_content_series_id ON content(series_id);
CREATE INDEX IF NOT EXISTS idx_content_idea_id ON content(idea_id);
CREATE INDEX IF NOT EXISTS idx_user_workflows_user_id ON user_workflows(user_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on new tables
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_workflows ENABLE ROW LEVEL SECURITY;

-- CONTENT policies
CREATE POLICY "Users can view own content" ON content FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own content" ON content FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own content" ON content FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own content" ON content FOR DELETE USING (auth.uid() = user_id);

-- USER_WORKFLOWS policies
CREATE POLICY "Users can view own workflow" ON user_workflows FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own workflow" ON user_workflows FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own workflow" ON user_workflows FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own workflow" ON user_workflows FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- UPDATE TIMESTAMP TRIGGERS
-- ============================================
CREATE TRIGGER update_content_updated_at BEFORE UPDATE ON content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_workflows_updated_at BEFORE UPDATE ON user_workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
