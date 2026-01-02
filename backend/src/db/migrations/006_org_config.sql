-- Add configurable server offline threshold to organizations
-- Default: 300 seconds (5 minutes)
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS server_offline_threshold_seconds INTEGER DEFAULT 300 NOT NULL;

COMMENT ON COLUMN organizations.server_offline_threshold_seconds IS 'Seconds without heartbeat before a server is considered offline. Default: 300 (5 minutes)';
