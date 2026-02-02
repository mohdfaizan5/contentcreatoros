-- Migration: Enhanced Link Profiles
-- Adds branding and theme customization fields to link_profiles

-- Add new columns to link_profiles
ALTER TABLE link_profiles 
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS banner_url TEXT,
  ADD COLUMN IF NOT EXISTS tagline TEXT,
  ADD COLUMN IF NOT EXISTS template_id TEXT DEFAULT 'minimal-light',
  ADD COLUMN IF NOT EXISTS accent_color TEXT;

-- Add index for template lookups
CREATE INDEX IF NOT EXISTS idx_link_profiles_template ON link_profiles(template_id);
