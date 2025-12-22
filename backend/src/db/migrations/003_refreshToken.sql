CREATE TABLE user_refresh_tokens (
  id UUID PRIMARY KEY, 
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  user_agent TEXT,
  ip_address INET,
  revoked BOOLEAN DEFAULT FALSE,
  UNIQUE(token_hash)
);
CREATE INDEX idx_user_refresh_tokens_user_id ON user_refresh_tokens(user_id);
CREATE INDEX idx_user_refresh_tokens_expires_at ON user_refresh_tokens(expires_at);
CREATE INDEX idx_user_refresh_tokens_revoked ON user_refresh_tokens(revoked);

-- Optional: Clean up expired tokens periodically
-- This can be done via a scheduled job or cron task outside of this migration

-- drop the old refresh_token_hash column from users table
ALTER TABLE users
DROP COLUMN refresh_token_hash;
