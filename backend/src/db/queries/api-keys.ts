import sql from "..";
import { ApiKey, ApiKeyResponse } from "../../modules/api-keys/api-keys.types";
import { sha256Hex } from "../../utils/crypto";
import crypto from "crypto";

export function generateApiKey(): { key: string; hash: string; prefix: string } {
  const key = `nub_${crypto.randomBytes(32).toString("hex")}`;
  const hash = sha256Hex(key);
  const prefix = key.substring(0, 8);
  return { key, hash, prefix };
}

export async function createApiKey(
  orgId: string,
  keyHash: string,
  keyPrefix: string,
  name?: string
): Promise<ApiKey> {
  const [apiKey] = await sql<ApiKey[]>`
    INSERT INTO api_keys (org_id, key_hash, key_prefix, name)
    VALUES (${orgId}::uuid, ${keyHash}, ${keyPrefix}, ${name ?? null})
    RETURNING *
  `;
  return apiKey;
}

export async function getApiKeysByOrgId(orgId: string): Promise<ApiKeyResponse[]> {
  const keys = await sql<ApiKeyResponse[]>`
    SELECT id, org_id, key_prefix, name, created_at, last_used_at, is_active
    FROM api_keys
    WHERE org_id = ${orgId}::uuid
    ORDER BY created_at DESC
  `;
  return keys;
}

export async function getApiKeyByHash(keyHash: string): Promise<ApiKey | null> {
  const [key] = await sql<ApiKey[]>`
    SELECT * FROM api_keys WHERE key_hash = ${keyHash} AND is_active = true
  `;
  return key ?? null;
}

export async function revokeApiKey(id: string, orgId: string): Promise<boolean> {
  const result = await sql`
    UPDATE api_keys
    SET is_active = false
    WHERE id = ${id}::uuid AND org_id = ${orgId}::uuid
  `;
  return result.count > 0;
}

export async function updateApiKeyLastUsed(id: string): Promise<void> {
  await sql`
    UPDATE api_keys SET last_used_at = NOW() WHERE id = ${id}::uuid
  `;
}
