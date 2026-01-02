CREATE TABLE org_invites (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL,
  email TEXT NOT NULL,
  permissions TEXT[],
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  accepted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);
