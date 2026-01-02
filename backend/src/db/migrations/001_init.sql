-- extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- discord and webhook notifications for the future addition
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  refresh_token_hash TEXT,
  is_active BOOLEAN  DEFAULT true NOT NULL,
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  last_login TIMESTAMPTZ
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active);

CREATE TABLE organizations(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);


CREATE TABLE organizations_users (
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  permissions TEXT[] DEFAULT ARRAY['read'] NOT NULL, -- e.g., 'read', 'write', 'manage'
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  status VARCHAR(20) DEFAULT 'active' NOT NULL, -- 'active', 'pending', 'suspended'
  PRIMARY KEY (organization_id, user_id)
);
CREATE INDEX idx_orgs_users_user_id ON organizations_users(user_id);
CREATE INDEX idx_orgs_users_permissions ON organizations_users USING GIN(permissions);

CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  key_hash TEXT UNIQUE NOT NULL,
  key_prefix VARCHAR(10), -- first 8 chars of the key for identification
  name VARCHAR(100), -- user friendly name for the key
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true NOT NULL
);
CREATE INDEX idx_api_keys_org_id ON api_keys(org_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_active ON api_keys(org_id, is_active);
COMMENT ON TABLE api_keys IS 'API authentication for monitoring agents';
COMMENT ON COLUMN api_keys.key_hash IS 'SHA-256 hash of the actual key stored securely';

CREATE TABLE servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  hostname VARCHAR(255),
  ip_address INET,
  api_key_id UUID REFERENCES api_keys(id) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' NOT NULL, -- 'pending', 'active', 'inactive', 'error'
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_seen_at TIMESTAMPTZ,

  -- metadata
  os_type VARCHAR(100),
  os_version VARCHAR(100),
  agent_version VARCHAR(50)
);
CREATE INDEX idx_servers_org_id ON servers(org_id);
CREATE INDEX idx_servers_status ON servers(status);
CREATE INDEX idx_servers_last_seen ON servers(last_seen_at DESC);
COMMENT ON TABLE servers IS 'Registered monitoring targets (physical/virtual servers)';
COMMENT ON COLUMN servers.last_seen_at IS 'Timestamp of last successful agent communication';

CREATE TABLE endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  server_id UUID REFERENCES servers(id) ON DELETE SET NULL,

  -- endpoint configuration
  name VARCHAR(255) NOT NULL,
  url VARCHAR(500) NOT NULL,
  check_interval INTEGER DEFAULT 60 NOT NULL, -- Check frequency in seconds
  timeout INTEGER DEFAULT 10 NOT NULL,
  method VARCHAR(10) DEFAULT 'GET' NOT NULL, -- HTTP method
  expected_status_code INTEGER DEFAULT 200, -- Expected HTTP status

  -- status
  enabled BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_checked_at TIMESTAMPTZ
);

CREATE INDEX idx_endpoints_org_id ON endpoints(org_id);
CREATE INDEX idx_endpoints_server_id ON endpoints(server_id);
CREATE INDEX idx_endpoints_enabled ON endpoints(enabled, check_interval);
COMMENT ON TABLE endpoints IS 'HTTP endpoints for uptime and health monitoring';

CREATE TABLE database_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  server_id UUID REFERENCES servers(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  db_type VARCHAR(50) NOT NULL,             -- postgres, mysql, mongo, redis, etc.
  connection_url TEXT NOT NULL,             -- stored encrypted
  check_interval INTEGER DEFAULT 60 NOT NULL,
  timeout INTEGER DEFAULT 10 NOT NULL,
  enabled BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_checked_at TIMESTAMPTZ
);

CREATE INDEX idx_db_targets_org_id ON database_targets(org_id);
COMMENT ON TABLE database_targets IS 'Database connections for monitoring (requires plan feature flag)';
COMMENT ON COLUMN database_targets.connection_url IS 'Store encrypted using pgcrypto or app-level encryption';

CREATE TABLE server_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  service_type VARCHAR(50) NOT NULL,  -- 'http', 'docker', 'database', 'process'
  name VARCHAR(255) NOT NULL,
  port INTEGER,
  status VARCHAR(20) NOT NULL,  -- 'running', 'stopped', 'error'
  discovered_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_seen_at TIMESTAMPTZ
);

CREATE INDEX idx_server_services_server_id ON server_services(server_id);
CREATE INDEX idx_server_services_type ON server_services(service_type, status);

-- alert configurations 
CREATE TABLE alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- rule config
  name VARCHAR(255) NOT NULL,
  description TEXT,
  rule_type VARCHAR(50) NOT NULL, -- 'endpoint_down', 'high_cpu', 'high_memory', 'disk_full'
  target_type VARCHAR(50) NOT NULL, -- 'endpoint', 'server', 'database'
  target_id UUID NOT NULL, -- references endpoints.id, servers.id, or database_targets.id

  -- condition thresholds
  threshold_value DOUBLE PRECISION, -- e.g., 80.0 for 80%
  threshold_duration INTEGER, -- in seconds
  comparison_operator VARCHAR(10), -- '>', '<', '='

  -- alert channel
  notify_email BOOLEAN DEFAULT true NOT NULL,
  notify_webhook BOOLEAN DEFAULT false NOT NULL,

  -- status
  enabled BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_alert_rules_org_id ON alert_rules(org_id);
CREATE INDEX idx_alert_rules_enabled ON alert_rules(enabled);

COMMENT ON TABLE alert_rules IS 'Org-defined alert conditions and notification preferences';

CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  alert_rule_id UUID REFERENCES alert_rules(id) ON DELETE SET NULL,
  
  -- Alert details
  severity VARCHAR(20) NOT NULL,                          -- 'info', 'warning', 'critical'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Alert lifecycle
  status VARCHAR(20) DEFAULT 'open' NOT NULL,             -- 'open', 'acknowledged', 'resolved'
  fired_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  
  -- Context
  target_type VARCHAR(50),                                -- 'server', 'endpoint', 'database'
  target_id UUID,
  metric_value DOUBLE PRECISION                           -- Value that triggered alert
);

CREATE INDEX idx_alerts_org_id ON alerts(org_id, status);
CREATE INDEX idx_alerts_fired_at ON alerts(fired_at DESC);

COMMENT ON TABLE alerts IS 'Alert instances triggered by alert rules';


-- TimescaleDB setup for metrics storage

CREATE TABLE health_checks (
  time TIMESTAMPTZ NOT NULL,
  endpoint_id UUID NOT NULL REFERENCES endpoints(id) ON DELETE CASCADE,
  status_code INTEGER,
  response_time DOUBLE PRECISION,
  is_up BOOLEAN,
  error_message TEXT,
  checked_from TEXT
);
SELECT create_hypertable('health_checks', 'time', if_not_exists => TRUE);
CREATE INDEX idx_health_checks_endpoint_time ON health_checks (endpoint_id, time DESC);
CREATE INDEX idx_health_checks_status ON health_checks (is_up, time DESC);
COMMENT ON TABLE health_checks IS 'HTTP endpoint health check results (TimescaleDB hypertable)';

CREATE TABLE server_metrics (
  time TIMESTAMPTZ NOT NULL,
  server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,

  -- cpu metrics
  cpu_usage DOUBLE PRECISION,
  cpu_count INTEGER,
  load_average_1m DOUBLE PRECISION,
  load_average_5m DOUBLE PRECISION,
  load_average_15m DOUBLE PRECISION,

  -- Memory metrics
  memory_usage DOUBLE PRECISION,                          -- Percentage (0-100)
  memory_total BIGINT,                                    -- Bytes
  memory_used BIGINT,                                     -- Bytes
  memory_available BIGINT, 

  -- Disk metrics
  disk_usage DOUBLE PRECISION,                            -- Percentage (0-100)
  disk_total BIGINT,                                      -- Bytes
  disk_used BIGINT,                                       -- Bytes
  disk_read_bytes BIGINT,                                 -- Cumulative
  disk_write_bytes BIGINT,                                -- Cumulative

  -- Network metrics
  network_in BIGINT,                                      -- Cumulative bytes received
  network_out BIGINT                                      -- Cumulative bytes sent
);
SELECT create_hypertable('server_metrics', 'time', if_not_exists => TRUE);
CREATE INDEX idx_server_metrics_server_time ON server_metrics (server_id, time DESC);
COMMENT ON TABLE server_metrics IS 'Server system metrics (TimescaleDB hypertable)';

CREATE TABLE process_metrics (
  time TIMESTAMPTZ NOT NULL,
  server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  process_name TEXT,
  pid INTEGER,
  cpu_percent DOUBLE PRECISION,
  memory_mb DOUBLE PRECISION,
  status TEXT -- e.g., 'running', 'sleeping', 'zombie'
);
SELECT create_hypertable('process_metrics', 'time', if_not_exists => TRUE);
CREATE INDEX idx_process_metrics_server_time ON process_metrics (server_id, time DESC);
COMMENT ON TABLE process_metrics IS 'Per-process metrics (TimescaleDB hypertable)';


CREATE TABLE database_metrics (
  time TIMESTAMPTZ NOT NULL,
  target_id UUID NOT NULL REFERENCES database_targets(id) ON DELETE CASCADE,
  
  -- Connection metrics
  connection_count INTEGER,
  active_connections INTEGER,
  idle_connections INTEGER,
  
  -- Query metrics
  queries_per_second DOUBLE PRECISION,
  slow_queries INTEGER,
  avg_query_time_ms DOUBLE PRECISION,
  
  -- Cache metrics
  cache_hit_ratio DOUBLE PRECISION,                       -- Percentage (0-100)
  
  -- Storage metrics
  db_size_bytes BIGINT,
  table_count INTEGER,

  -- Health
  is_healthy BOOLEAN,
  error_message TEXT
);
SELECT create_hypertable('database_metrics', 'time', if_not_exists => TRUE);
CREATE INDEX idx_database_metrics_target_time ON database_metrics (target_id, time DESC);
COMMENT ON TABLE database_metrics IS 'Database monitoring metrics (TimescaleDB hypertable)';