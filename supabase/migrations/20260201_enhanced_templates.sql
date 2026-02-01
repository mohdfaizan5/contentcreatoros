-- Enhanced Templates Migration
-- Adds support for Mad Libs-style templates with placeholders, examples, and reference links

-- Add new columns to templates table
ALTER TABLE templates 
ADD COLUMN IF NOT EXISTS template_text TEXT,
ADD COLUMN IF NOT EXISTS examples JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS reference_links JSONB DEFAULT '[]'::jsonb;

-- Add comment explaining the JSONB structure
COMMENT ON COLUMN templates.template_text IS 'Template text with [placeholder] syntax for Mad Libs-style content creation';
COMMENT ON COLUMN templates.examples IS 'Array of example content: [{id, content, author, platform, source_url}]';
COMMENT ON COLUMN templates.reference_links IS 'Array of reference links: [{id, url, title, embed_type}]';
