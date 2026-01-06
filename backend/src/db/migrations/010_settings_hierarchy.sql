-- Migration: Settings Hierarchy
-- Adds org-level alert defaults, server settings, endpoint settings, and database settings


ALTER TABLE org_settings ADD COLUMN IF NOT EXISTS
  default_cpu_threshold DECIMAL(5,2) DEFAULT 90.0;

ALTER TABLE org_settings ADD COLUMN IF NOT EXISTS
  default_memory_threshold DECIMAL(5,2) DEFAULT 90.0;

ALTER TABLE org_settings ADD COLUMN IF NOT EXISTS
  default_disk_threshold DECIMAL(5,2) DEFAULT 85.0;

ALTER TABLE org_settings ADD COLUMN IF NOT EXISTS
  default_load_threshold DECIMAL(5,2) DEFAULT 10.0;

ALTER TABLE org_settings ADD COLUMN IF NOT EXISTS
  default_alert_cooldown_minutes INTEGER DEFAULT 5;

ALTER TABLE org_settings ADD COLUMN IF NOT EXISTS
  server_offline_threshold_seconds INTEGER DEFAULT 120;


CREATE TABLE IF NOT EXISTS server_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID NOT NULL UNIQUE REFERENCES servers(id) ON DELETE CASCADE,
  
  -- Alert thresholds (NULL = use org default)
  cpu_threshold DECIMAL(5,2),
  memory_threshold DECIMAL(5,2),
  disk_threshold DECIMAL(5,2),
  load_threshold DECIMAL(5,2),
  
  -- Cooldown (NULL = use org default)
  alert_cooldown_minutes INTEGER,
  
  -- Per-server notification overrides
  alerts_enabled BOOLEAN DEFAULT true,
  notify_email BOOLEAN,
  notify_webhook BOOLEAN,
  
  -- Custom notification recipients (NULL = use org default)
  notification_emails TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_server_settings_server_id ON server_settings(server_id);


CREATE TABLE IF NOT EXISTS endpoint_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id UUID NOT NULL UNIQUE REFERENCES endpoints(id) ON DELETE CASCADE,
  
  -- Alert settings
  alerts_enabled BOOLEAN DEFAULT true,
  alert_on_down BOOLEAN DEFAULT true,
  consecutive_failures_before_alert INTEGER DEFAULT 3,
  
  -- Cooldown (NULL = use org default)
  alert_cooldown_minutes INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_endpoint_settings_endpoint_id ON endpoint_settings(endpoint_id);


CREATE TABLE IF NOT EXISTS database_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  database_id UUID NOT NULL UNIQUE REFERENCES database_targets(id) ON DELETE CASCADE,
  
  -- Alert settings
  alerts_enabled BOOLEAN DEFAULT true,
  alert_on_down BOOLEAN DEFAULT true,
  consecutive_failures_before_alert INTEGER DEFAULT 2,
  
  -- Cooldown (NULL = use org default)
  alert_cooldown_minutes INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_database_settings_database_id ON database_settings(database_id);


-- Server settings auto-create
CREATE OR REPLACE FUNCTION create_server_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO server_settings (server_id) VALUES (NEW.id)
  ON CONFLICT (server_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_server_settings ON servers;
CREATE TRIGGER trigger_create_server_settings
  AFTER INSERT ON servers
  FOR EACH ROW
  EXECUTE FUNCTION create_server_settings();

-- Endpoint settings auto-create
CREATE OR REPLACE FUNCTION create_endpoint_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO endpoint_settings (endpoint_id) VALUES (NEW.id)
  ON CONFLICT (endpoint_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_endpoint_settings ON endpoints;
CREATE TRIGGER trigger_create_endpoint_settings
  AFTER INSERT ON endpoints
  FOR EACH ROW
  EXECUTE FUNCTION create_endpoint_settings();

-- Database settings auto-create
CREATE OR REPLACE FUNCTION create_database_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO database_settings (database_id) VALUES (NEW.id)
  ON CONFLICT (database_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_database_settings ON database_targets;
CREATE TRIGGER trigger_create_database_settings
  AFTER INSERT ON database_targets
  FOR EACH ROW
  EXECUTE FUNCTION create_database_settings();

CREATE OR REPLACE FUNCTION update_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_server_settings_updated_at ON server_settings;
CREATE TRIGGER trigger_server_settings_updated_at
  BEFORE UPDATE ON server_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_settings_updated_at();

DROP TRIGGER IF EXISTS trigger_endpoint_settings_updated_at ON endpoint_settings;
CREATE TRIGGER trigger_endpoint_settings_updated_at
  BEFORE UPDATE ON endpoint_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_settings_updated_at();

DROP TRIGGER IF EXISTS trigger_database_settings_updated_at ON database_settings;
CREATE TRIGGER trigger_database_settings_updated_at
  BEFORE UPDATE ON database_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_settings_updated_at();

-- Create settings for existing servers
INSERT INTO server_settings (server_id)
SELECT id FROM servers
WHERE id NOT IN (SELECT server_id FROM server_settings)
ON CONFLICT DO NOTHING;

-- Create settings for existing endpoints
INSERT INTO endpoint_settings (endpoint_id)
SELECT id FROM endpoints
WHERE id NOT IN (SELECT endpoint_id FROM endpoint_settings)
ON CONFLICT DO NOTHING;

-- Create settings for existing databases
INSERT INTO database_settings (database_id)
SELECT id FROM database_targets
WHERE id NOT IN (SELECT database_id FROM database_settings)
ON CONFLICT DO NOTHING;
