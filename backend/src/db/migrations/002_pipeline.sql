CREATE TABLE deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  server_id UUID REFERENCES servers(id) ON DELETE SET NULL,
  
  -- Deployment info
  pipeline_name VARCHAR(255) NOT NULL,        -- 'production', 'staging', etc.
  status VARCHAR(50) NOT NULL,                -- 'pending', 'running', 'success', 'failed'
  trigger_type VARCHAR(50) NOT NULL,          -- 'push', 'pull_request', 'manual'
  
  -- Source control info
  repository VARCHAR(255),                    -- 'github.com/user/repo'
  branch VARCHAR(100),                        -- 'main', 'develop'
  commit_hash VARCHAR(40),                    -- Git commit SHA
  commit_message TEXT,
  author VARCHAR(255),
  
  -- Build info
  build_number INTEGER,
  build_url TEXT,                             -- Link to Jenkins/GitHub Actions
  duration_seconds INTEGER,
  
  -- Timestamps
  started_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_deployments_org_id ON deployments(org_id);
CREATE INDEX idx_deployments_server_id ON deployments(server_id);
CREATE INDEX idx_deployments_status ON deployments(status, started_at DESC);
CREATE INDEX idx_deployments_branch ON deployments(branch, status);

COMMENT ON TABLE deployments IS 'CI/CD deployment tracking from Jenkins/GitHub Actions';

-- Deployment logs (stdout/stderr from builds)
CREATE TABLE deployment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deployment_id UUID REFERENCES deployments(id) ON DELETE CASCADE NOT NULL,
  log_level VARCHAR(20) NOT NULL,             -- 'info', 'warning', 'error'
  message TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_deployment_logs_deployment_id ON deployment_logs(deployment_id, timestamp);