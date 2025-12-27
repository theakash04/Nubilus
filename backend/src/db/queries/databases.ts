import sql from "..";
import { DatabaseMetric, DatabaseTarget } from "../../types/database";
import { DatabaseType } from "../../types/enums";

export async function getDatabaseTargetsByOrgId(orgId: string): Promise<DatabaseTarget[]> {
  const targets = await sql<DatabaseTarget[]>`
    SELECT * FROM database_targets WHERE org_id = ${orgId}::uuid ORDER BY created_at DESC
  `;
  return targets;
}

export async function getDatabaseTargetById(
  id: string,
  orgId: string
): Promise<DatabaseTarget | null> {
  const [target] = await sql<DatabaseTarget[]>`
    SELECT * FROM database_targets WHERE id = ${id}::uuid AND org_id = ${orgId}::uuid
  `;
  return target ?? null;
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
  const [target] = await sql<DatabaseTarget[]>`
    INSERT INTO database_targets (org_id, name, db_type, connection_url, server_id, check_interval, timeout)
    VALUES (
      ${orgId}::uuid,
      ${data.name},
      ${data.db_type},
      ${data.connection_url},
      ${data.server_id ?? null}::uuid,
      ${data.check_interval ?? 60},
      ${data.timeout ?? 10}
    )
    RETURNING *
  `;
  return target;
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
): Promise<DatabaseTarget | null> {
  if (Object.keys(updates).length === 0) {
    return getDatabaseTargetById(id, orgId);
  }

  const [target] = await sql<DatabaseTarget[]>`
    UPDATE database_targets
    SET ${sql(updates)}
    WHERE id = ${id}::uuid AND org_id = ${orgId}::uuid
    RETURNING *
  `;
  return target ?? null;
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
