import sql from "..";
import { Endpoint, HealthCheck } from "../../types/database";
import { HttpMethod } from "../../types/enums";

export async function getEndpointsByOrgId(
  orgId: string
): Promise<(Endpoint & { status: string })[]> {
  // Include computed status from latest health check
  const endpoints = await sql<(Endpoint & { status: string })[]>`
    SELECT 
      e.*,
      COALESCE(
        CASE 
          WHEN hc.is_up = true THEN 'healthy'
          WHEN hc.is_up = false THEN 'unhealthy'
          ELSE 'pending'
        END,
        'pending'
      ) as status
    FROM endpoints e
    LEFT JOIN LATERAL (
      SELECT is_up FROM health_checks 
      WHERE endpoint_id = e.id 
      ORDER BY time DESC 
      LIMIT 1
    ) hc ON true
    WHERE e.org_id = ${orgId}::uuid 
    ORDER BY e.created_at DESC
  `;
  return endpoints;
}

export async function getEndpointById(
  id: string,
  orgId: string
): Promise<(Endpoint & { status: string }) | null> {
  const [endpoint] = await sql<(Endpoint & { status: string })[]>`
    SELECT 
      e.*,
      COALESCE(
        CASE 
          WHEN hc.is_up = true THEN 'healthy'
          WHEN hc.is_up = false THEN 'unhealthy'
          ELSE 'pending'
        END,
        'pending'
      ) as status
    FROM endpoints e
    LEFT JOIN LATERAL (
      SELECT is_up FROM health_checks 
      WHERE endpoint_id = e.id 
      ORDER BY time DESC 
      LIMIT 1
    ) hc ON true
    WHERE e.id = ${id}::uuid AND e.org_id = ${orgId}::uuid
  `;
  return endpoint ?? null;
}

export async function createEndpoint(
  orgId: string,
  data: {
    name: string;
    url: string;
    server_id?: string;
    check_interval?: number;
    timeout?: number;
    method?: HttpMethod;
    expected_status_code?: number;
    tags?: string[];
  }
): Promise<Endpoint> {
  const [endpoint] = await sql<Endpoint[]>`
    INSERT INTO endpoints (
      org_id, name, url, server_id, check_interval, timeout,
      method, expected_status_code, tags
    )
    VALUES (
      ${orgId}::uuid,
      ${data.name},
      ${data.url},
      ${data.server_id ?? null}::uuid,
      ${data.check_interval ?? 60},
      ${data.timeout ?? 10},
      ${data.method ?? "GET"},
      ${data.expected_status_code ?? 200},
      ${data.tags ?? []}
    )
    RETURNING *
  `;
  return endpoint;
}

export async function updateEndpoint(
  id: string,
  orgId: string,
  updates: Partial<{
    name: string;
    url: string;
    check_interval: number;
    timeout: number;
    method: HttpMethod;
    expected_status_code: number;
    enabled: boolean;
    tags: string[];
  }>
): Promise<Endpoint | null> {
  if (Object.keys(updates).length === 0) {
    return getEndpointById(id, orgId);
  }

  const [endpoint] = await sql<Endpoint[]>`
    UPDATE endpoints
    SET ${sql(updates)}
    WHERE id = ${id}::uuid AND org_id = ${orgId}::uuid
    RETURNING *
  `;
  return endpoint ?? null;
}

export async function deleteEndpoint(id: string, orgId: string): Promise<boolean> {
  const result = await sql`
    DELETE FROM endpoints WHERE id = ${id}::uuid AND org_id = ${orgId}::uuid
  `;
  return result.count > 0;
}

export async function getHealthChecks(
  endpointId: string,
  from?: Date,
  to?: Date,
  limit: number = 100
): Promise<HealthCheck[]> {
  const fromDate = from ?? new Date(Date.now() - 24 * 60 * 60 * 1000);
  const toDate = to ?? new Date();

  const checks = await sql<HealthCheck[]>`
    SELECT * FROM health_checks
    WHERE endpoint_id = ${endpointId}::uuid
      AND time >= ${fromDate}
      AND time <= ${toDate}
    ORDER BY time DESC
    LIMIT ${limit}
  `;
  return checks;
}

export async function insertHealthCheck(data: {
  endpoint_id: string;
  status_code: number | null;
  response_time: number | null;
  is_up: boolean;
  error_message?: string | null;
  checked_from?: string | null;
}): Promise<void> {
  await sql`
    INSERT INTO health_checks (time, endpoint_id, status_code, response_time, is_up, error_message, checked_from)
    VALUES (NOW(), ${data.endpoint_id}::uuid, ${data.status_code}, ${data.response_time}, ${
    data.is_up
  }, ${data.error_message ?? null}, ${data.checked_from ?? null})
  `;

  await sql`
    UPDATE endpoints SET last_checked_at = NOW() WHERE id = ${data.endpoint_id}::uuid
  `;
}

export async function getAllEnabledEndpoints(): Promise<Endpoint[]> {
  const endpoints = await sql<Endpoint[]>`
    SELECT * FROM endpoints WHERE enabled = true
  `;
  return endpoints;
}

export async function endpointTrends(orgId: string): Promise<{ hour: Date; count: string }[]> {
  const trends = await sql<{ hour: Date; count: string }[]>`
    SELECT 
      date_trunc('hour', time) as hour,
      COUNT(DISTINCT hc.endpoint_id) as count
    FROM health_checks hc
    INNER JOIN endpoints e ON e.id = hc.endpoint_id
    WHERE e.org_id = ${orgId}::uuid
      AND hc.time > NOW() - INTERVAL '7 hours'
      AND hc.is_up = true
    GROUP BY hour
    ORDER BY hour
  `;
  return trends;
}
