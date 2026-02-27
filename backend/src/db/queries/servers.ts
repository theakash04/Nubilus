import sql from "..";
import { Server, ServerMetric } from "../../types/database";
import { ServerStatus } from "../../types/enums";

export async function getServersByOrgId(orgId: string): Promise<Server[]> {
  const servers = await sql<Server[]>`
    SELECT * FROM servers WHERE org_id = ${orgId}::uuid ORDER BY created_at DESC
  `;
  return servers;
}

export async function getServerById(id: string, orgId: string): Promise<Server | null> {
  const [server] = await sql<Server[]>`
    SELECT * FROM servers WHERE id = ${id}::uuid AND org_id = ${orgId}::uuid
  `;
  return server ?? null;
}

export async function createServer(
  orgId: string,
  apiKeyId: string,
  data: {
    name: string;
    hostname?: string;
    ip_address?: string;
    os_type?: string;
    os_version?: string;
    agent_version?: string;
    tags?: string[];
  }
): Promise<Server> {
  const [server] = await sql<Server[]>`
    INSERT INTO servers (
      org_id, api_key_id, name, hostname, ip_address, 
      os_type, os_version, agent_version, tags, status
    )
    VALUES (
      ${orgId}::uuid, 
      ${apiKeyId}::uuid, 
      ${data.name}, 
      ${data.hostname ?? null}, 
      ${data.ip_address ?? null}::inet,
      ${data.os_type ?? null}, 
      ${data.os_version ?? null}, 
      ${data.agent_version ?? null},
      ${data.tags ?? []},
      'pending'
    )
    RETURNING *
  `;
  return server;
}

export async function updateServer(
  id: string,
  orgId: string,
  updates: { name?: string; tags?: string[]; status?: ServerStatus }
): Promise<Server | null> {
  if (Object.keys(updates).length === 0) {
    return getServerById(id, orgId);
  }

  const [server] = await sql<Server[]>`
    UPDATE servers
    SET ${sql(updates)}
    WHERE id = ${id}::uuid AND org_id = ${orgId}::uuid
    RETURNING *
  `;
  return server ?? null;
}

export async function deleteServer(id: string, orgId: string): Promise<boolean> {
  const result = await sql`
    DELETE FROM servers WHERE id = ${id}::uuid AND org_id = ${orgId}::uuid
  `;
  return result.count > 0;
}

export async function updateServerLastSeen(id: string): Promise<void> {
  await sql`
    UPDATE servers SET last_seen_at = NOW(), status = 'active' WHERE id = ${id}::uuid
  `;
}

export async function updateServerOnReconnect(
  id: string,
  data: {
    agent_version?: string;
    os_type?: string;
    os_version?: string;
    hostname?: string;
    ip_address?: string;
  }
): Promise<void> {
  await sql`
    UPDATE servers 
    SET 
      last_seen_at = NOW(), 
      status = 'active',
      agent_version = COALESCE(${data.agent_version ?? null}, agent_version),
      os_type = COALESCE(${data.os_type ?? null}, os_type),
      os_version = COALESCE(${data.os_version ?? null}, os_version),
      hostname = COALESCE(${data.hostname ?? null}, hostname),
      ip_address = COALESCE(${data.ip_address ?? null}::inet, ip_address)
    WHERE id = ${id}::uuid
  `;
}

export async function getServerMetrics(
  serverId: string,
  from?: Date,
  to?: Date,
  limit: number = 100
): Promise<ServerMetric[]> {
  const fromDate = from ?? new Date(Date.now() - 24 * 60 * 60 * 1000);
  const toDate = to ?? new Date();

  const metrics = await sql<ServerMetric[]>`
    SELECT * FROM server_metrics
    WHERE server_id = ${serverId}::uuid
      AND time >= ${fromDate}
      AND time <= ${toDate}
    ORDER BY time DESC
    LIMIT ${limit}
  `;
  return metrics;
}

export async function getServerByApiKeyId(apiKeyId: string): Promise<Server | null> {
  const [server] = await sql<Server[]>`
    SELECT * FROM servers WHERE api_key_id = ${apiKeyId}::uuid
  `;
  return server ?? null;
}

export async function serverTrends(orgId: string): Promise<{ hour: Date; count: string }[]> {
  const serverTrends = await sql<{ hour: Date; count: string }[]>`
    SELECT 
      date_trunc('hour', time) as hour,
      COUNT(DISTINCT server_id) as count
    FROM server_metrics
    WHERE server_id IN (SELECT id FROM servers WHERE org_id = ${orgId}::uuid)
      AND time > NOW() - INTERVAL '7 hours'
    GROUP BY hour
    ORDER BY hour
  `;

  return serverTrends;
}

/**
 * Find servers that have exceeded their org's offline threshold
 * but are NOT already marked as 'offline'.
 */
export async function getNewlyOfflineServers(): Promise<
  { id: string; name: string; org_id: string; last_seen_at: Date }[]
> {
  const servers = await sql<{ id: string; name: string; org_id: string; last_seen_at: Date }[]>`
    SELECT s.id, s.name, s.org_id, s.last_seen_at
    FROM servers s
    JOIN org_settings os ON os.org_id = s.org_id
    WHERE s.status != 'offline'
      AND s.last_seen_at IS NOT NULL
      AND s.last_seen_at < NOW() - (os.server_offline_threshold_seconds || ' seconds')::interval
  `;
  return servers;
}

/**
 * Mark a server as offline
 */
export async function markServerOffline(serverId: string): Promise<void> {
  await sql`
    UPDATE servers SET status = 'offline' WHERE id = ${serverId}::uuid
  `;
}
