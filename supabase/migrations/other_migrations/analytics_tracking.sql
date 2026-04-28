-- Analytics Tracking Tables for Profile Views and Lead Magnets

-- Profile Views Tracking
CREATE TABLE IF NOT EXISTS profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES link_profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  ip_hash TEXT, -- hashed for privacy
  CONSTRAINT fk_profile FOREIGN KEY (profile_id) REFERENCES link_profiles(id) ON DELETE CASCADE
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_profile_views_profile_id ON profile_views(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed_at ON profile_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_profile_views_profile_date ON profile_views(profile_id, viewed_at DESC);

-- Lead Magnet Views Tracking
CREATE TABLE IF NOT EXISTS lead_magnet_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_magnet_id UUID NOT NULL REFERENCES lead_magnets(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  ip_hash TEXT,
  CONSTRAINT fk_lead_magnet FOREIGN KEY (lead_magnet_id) REFERENCES lead_magnets(id) ON DELETE CASCADE
);

-- Indexes for lead magnet views
CREATE INDEX IF NOT EXISTS idx_lead_magnet_views_magnet_id ON lead_magnet_views(lead_magnet_id);
CREATE INDEX IF NOT EXISTS idx_lead_magnet_views_viewed_at ON lead_magnet_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_lead_magnet_views_magnet_date ON lead_magnet_views(lead_magnet_id, viewed_at DESC);

-- Lead Magnet Leads Table (if not exists)
CREATE TABLE IF NOT EXISTS lead_magnet_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_magnet_id UUID NOT NULL REFERENCES lead_magnets(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB, -- for additional custom fields
  CONSTRAINT fk_lead_magnet_leads FOREIGN KEY (lead_magnet_id) REFERENCES lead_magnets(id) ON DELETE CASCADE
);

-- Indexes for leads
CREATE INDEX IF NOT EXISTS idx_lead_magnet_leads_magnet_id ON lead_magnet_leads(lead_magnet_id);
CREATE INDEX IF NOT EXISTS idx_lead_magnet_leads_created_at ON lead_magnet_leads(created_at);
CREATE INDEX IF NOT EXISTS idx_lead_magnet_leads_email ON lead_magnet_leads(email);

-- Add RLS policies for profile views
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert profile views (public tracking)
CREATE POLICY "Anyone can track profile views" ON profile_views
  FOR INSERT
  WITH CHECK (true);

-- Only owner can read their own analytics
CREATE POLICY "Users can view own profile analytics" ON profile_views
  FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM link_profiles WHERE user_id = auth.uid()
    )
  );

-- Add RLS policies for lead magnet views
ALTER TABLE lead_magnet_views ENABLE ROW LEVEL SECURITY;

-- Allow anyone to track lead magnet views
CREATE POLICY "Anyone can track lead magnet views" ON lead_magnet_views
  FOR INSERT
  WITH CHECK (true);

-- Only owner can read analytics
CREATE POLICY "Users can view own lead magnet analytics" ON lead_magnet_views
  FOR SELECT
  USING (
    lead_magnet_id IN (
      SELECT id FROM lead_magnets WHERE user_id = auth.uid()
    )
  );

-- Add RLS policies for lead magnet leads
ALTER TABLE lead_magnet_leads ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit leads
CREATE POLICY "Anyone can submit leads" ON lead_magnet_leads
  FOR INSERT
  WITH CHECK (true);

-- Only owner can read leads
CREATE POLICY "Users can view own leads" ON lead_magnet_leads
  FOR SELECT
  USING (
    lead_magnet_id IN (
      SELECT id FROM lead_magnets WHERE user_id = auth.uid()
    )
  );
