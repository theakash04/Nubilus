export interface ApiKey {
  id: string;
  org_id: string;
  key_hash: string;
  key_prefix: string | null;
  name: string | null;
  created_at: Date;
  last_used_at: Date | null;
  is_active: boolean;
}

export interface CreateApiKeyInput {
  name?: string;
}

export interface ApiKeyResponse {
  id: string;
  org_id: string;
  key_prefix: string | null;
  name: string | null;
  created_at: Date;
  last_used_at: Date | null;
  is_active: boolean;
}
