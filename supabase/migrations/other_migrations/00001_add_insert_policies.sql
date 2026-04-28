-- Add INSERT policies for analytics tracking
-- This allows public visitors to track views/leads while keeping analytics private to owners

-- Allow anyone to track profile views
CREATE POLICY "Anyone can track profile views" ON profile_views
  FOR INSERT
  WITH CHECK (true);

-- Allow anyone to track lead magnet views
CREATE POLICY "Anyone can track lead magnet views" ON lead_magnet_views
  FOR INSERT
  WITH CHECK (true);

-- Allow anyone to submit leads
CREATE POLICY "Anyone can submit leads" ON lead_magnet_leads
  FOR INSERT
  WITH CHECK (true);
