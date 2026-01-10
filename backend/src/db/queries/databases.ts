import sql from "..";
import { DatabaseMetric, DatabaseTarget } from "../../types/database";
import { DatabaseType } from "../../types/enums";
import { encrypt, decrypt, isEncrypted } from "../../utils/crypto";

function decryptTarget(target: DatabaseTarget): DatabaseTarget {
  if (target.connection_url && isEncrypted(target.connection_url)) {
    return { ...target, connection_url: decrypt(target.connection_url) };
  }
  return target;
}

// Type for API responses (excludes connection_url for security)
export type DatabaseTargetResponse = DatabaseTarget & {
  is_healthy: boolean | null;
};

export async function getDatabaseTargetsByOrgId(orgId: string): Promise<DatabaseTargetResponse[]> {
  const targets = await sql<(DatabaseTarget & { is_healthy: boolean | null })[]>`
    SELECT 
      d.id, d.org_id, d.server_id, d.name, d.db_type,
      d.check_interval, d.timeout, d.enabled, d.last_checked_at, d.created_at,
      dm.is_healthy
    FROM database_targets d
    LEFT JOIN LATERAL (
      SELECT is_healthy FROM database_metrics 
      WHERE target_id = d.id 
      ORDER BY time DESC 
      LIMIT 1
    ) dm ON true
    WHERE d.org_id = ${orgId}::uuid 
    ORDER BY d.created_at DESC
  `;
  return targets as DatabaseTargetResponse[];
}

export async function getDatabaseTargetById(
  id: string,
  orgId: string
): Promise<DatabaseTargetResponse | null> {
  const [target] = await sql<(DatabaseTarget & { is_healthy: boolean | null })[]>`
    SELECT 
      d.id, d.org_id, d.server_id, d.name, d.db_type,
      d.check_interval, d.timeout, d.enabled, d.last_checked_at, d.created_at,
      dm.is_healthy
    FROM database_targets d
    LEFT JOIN LATERAL (
      SELECT is_healthy FROM database_metrics 
      WHERE target_id = d.id 
      ORDER BY time DESC 
      LIMIT 1
    ) dm ON true
    WHERE d.id = ${id}::uuid AND d.org_id = ${orgId}::uuid
  `;
  return (target as DatabaseTargetResponse) ?? null;
}

export async function createDatabaseTarget(
  orgId: string,
  data: {
    name: string;
    db_type: DatabaseType;
    connection_url: string;
    server_id?: string;
    check_interval?: number;
    timeout?: number;
  }
): Promise<DatabaseTarget> {
  // Encrypt the connection URL before storing
  const encryptedUrl = encrypt(data.connection_url);

  const [target] = await sql<DatabaseTarget[]>`
    INSERT INTO database_targets (org_id, name, db_type, connection_url, server_id, check_interval, timeout)
    VALUES (
      ${orgId}::uuid,
      ${data.name},
      ${data.db_type},
      ${encryptedUrl},
      ${data.server_id ?? null}::uuid,
      ${data.check_interval ?? 60},
      ${data.timeout ?? 10}
    )
    RETURNING *
  `;
  // Return with decrypted URL for immediate use
  return decryptTarget(target);
}

export async function updateDatabaseTarget(
  id: string,
  orgId: string,
  updates: Partial<{
    name: string;
    connection_url: string;
    check_interval: number;
    timeout: number;
    enabled: boolean;
  }>
): Promise<DatabaseTargetResponse | null> {
  if (Object.keys(updates).length === 0) {
    return getDatabaseTargetById(id, orgId);
  }

  // Encrypt connection_url if being updated
  const processedUpdates = { ...updates };
  if (processedUpdates.connection_url) {
    processedUpdates.connection_url = encrypt(processedUpdates.connection_url);
  }

  await sql`
    UPDATE database_targets
    SET ${sql(processedUpdates)}
    WHERE id = ${id}::uuid AND org_id = ${orgId}::uuid
  `;

  // Return updated target without connection_url
  return getDatabaseTargetById(id, orgId);
}

export async function deleteDatabaseTarget(id: string, orgId: string): Promise<boolean> {
  const result = await sql`
    DELETE FROM database_targets WHERE id = ${id}::uuid AND org_id = ${orgId}::uuid
  `;
  return result.count > 0;
}

export async function getDatabaseMetrics(
  targetId: string,
  from?: Date,
  to?: Date,
  limit: number = 100
): Promise<DatabaseMetric[]> {
  const fromDate = from ?? new Date(Date.now() - 24 * 60 * 60 * 1000);
  const toDate = to ?? new Date();

  const metrics = await sql<DatabaseMetric[]>`
    SELECT * FROM database_metrics
    WHERE target_id = ${targetId}::uuid
      AND time >= ${fromDate}
      AND time <= ${toDate}
    ORDER BY time DESC
    LIMIT ${limit}
  `;
  return metrics;
}

export async function getAllEnabledDatabaseTargets(): Promise<DatabaseTarget[]> {
  const targets = await sql<DatabaseTarget[]>`
    SELECT * FROM database_targets WHERE enabled = true
  `;
  return targets;
}

export async function insertDatabaseMetric(data: {
  target_id: string;
  is_healthy: boolean;
  error_message?: string | null;
  connection_count?: number | null;
  active_connections?: number | null;
  idle_connections?: number | null;
  queries_per_second?: number | null;
  slow_queries?: number | null;
  avg_query_time_ms?: number | null;
  cache_hit_ratio?: number | null;
  db_size_bytes?: number | null;
  table_count?: number | null;
}): Promise<void> {
  await sql`
    INSERT INTO database_metrics (
      time, target_id, is_healthy, error_message,
      connection_count, active_connections, idle_connections,
      queries_per_second, slow_queries, avg_query_time_ms,
      cache_hit_ratio, db_size_bytes, table_count
    )
    VALUES (
      NOW(), ${data.target_id}::uuid, ${data.is_healthy}, ${data.error_message ?? null},
      ${data.connection_count ?? null}, ${data.active_connections ?? null}, ${
    data.idle_connections ?? null
  },
      ${data.queries_per_second ?? null}, ${data.slow_queries ?? null}, ${
    data.avg_query_time_ms ?? null
  },
      ${data.cache_hit_ratio ?? null}, ${data.db_size_bytes ?? null}, ${data.table_count ?? null}
    )
  `;

  await sql`
    UPDATE database_targets SET last_checked_at = NOW() WHERE id = ${data.target_id}::uuid
  `;
}

export async function databaseTrends(orgId: string): Promise<{ hour: Date; count: string }[]> {
  const trends = await sql<{ hour: Date; count: string }[]>`
    SELECT 
      date_trunc('hour', time) as hour,
      COUNT(DISTINCT dm.target_id) as count
    FROM database_metrics dm
    INNER JOIN database_targets dt ON dt.id = dm.target_id
    WHERE dt.org_id = ${orgId}::uuid
      AND dm.time > NOW() - INTERVAL '7 hours'
      AND dm.is_healthy = true
    GROUP BY hour
    ORDER BY hour
  `;
  return trends;
}
