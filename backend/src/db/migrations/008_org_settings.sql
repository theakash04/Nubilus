-- Organization settings table for customizable org-level configurations
CREATE TABLE org_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Invite settings
  invite_expiry_hours INTEGER DEFAULT 72,  -- Default 3 days
  
  -- Member settings
  default_member_permissions TEXT[] DEFAULT ARRAY['read'],
  require_2fa BOOLEAN DEFAULT false,
  
  -- Notification settings
  notify_on_new_member BOOLEAN DEFAULT true,
  notify_on_server_offline BOOLEAN DEFAULT true,
  notify_on_alert_triggered BOOLEAN DEFAULT true,
  
  -- Webhook settings (moved from organizations table)
  webhook_url TEXT,
  webhook_secret TEXT,
  webhook_enabled BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for fast lookups by org_id
CREATE INDEX idx_org_settings_org_id ON org_settings(org_id);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_org_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on changes
CREATE TRIGGER trigger_org_settings_updated_at
  BEFORE UPDATE ON org_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_org_settings_updated_at();

-- Auto-create settings when org is created
CREATE OR REPLACE FUNCTION create_org_settings_on_org_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO org_settings (org_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_org_settings
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION create_org_settings_on_org_insert();

-- Create default settings for existing organizations
INSERT INTO org_settings (org_id)
SELECT id FROM organizations
WHERE id NOT IN (SELECT org_id FROM org_settings);
