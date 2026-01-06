import sql from "..";

export interface ServerSettings {
  id: string;
  server_id: string;
  cpu_threshold: number | null;
  memory_threshold: number | null;
  disk_threshold: number | null;
  load_threshold: number | null;
  alert_cooldown_minutes: number | null;
  alerts_enabled: boolean;
  notify_email: boolean | null;
  notify_webhook: boolean | null;
  notification_emails: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface EndpointSettings {
  id: string;
  endpoint_id: string;
  alerts_enabled: boolean;
  alert_on_down: boolean;
  consecutive_failures_before_alert: number;
  alert_cooldown_minutes: number | null;
  created_at: string;
  updated_at: string;
}

export interface DatabaseSettings {
  id: string;
  database_id: string;
  alerts_enabled: boolean;
  alert_on_down: boolean;
  consecutive_failures_before_alert: number;
  alert_cooldown_minutes: number | null;
  created_at: string;
  updated_at: string;
}

export async function getServerSettings(serverId: string): Promise<ServerSettings | null> {
  const [settings] = await sql<ServerSettings[]>`
    SELECT * FROM server_settings WHERE server_id = ${serverId}::uuid
  `;
  return settings ?? null;
}

export async function updateServerSettings(
  serverId: string,
  updates: Partial<{
    cpu_threshold: number | null;
    memory_threshold: number | null;
    disk_threshold: number | null;
    load_threshold: number | null;
    alert_cooldown_minutes: number | null;
    alerts_enabled: boolean;
    notify_email: boolean | null;
    notify_webhook: boolean | null;
    notification_emails: string[] | null;
  }>
): Promise<ServerSettings | null> {
  if (Object.keys(updates).length === 0) {
    return getServerSettings(serverId);
  }

  const [settings] = await sql<ServerSettings[]>`
    UPDATE server_settings
    SET ${sql(updates)}
    WHERE server_id = ${serverId}::uuid
    RETURNING *
  `;
  return settings ?? null;
}

export async function getEndpointSettings(endpointId: string): Promise<EndpointSettings | null> {
  const [settings] = await sql<EndpointSettings[]>`
    SELECT * FROM endpoint_settings WHERE endpoint_id = ${endpointId}::uuid
  `;
  return settings ?? null;
}

export async function updateEndpointSettings(
  endpointId: string,
  updates: Partial<{
    alerts_enabled: boolean;
    alert_on_down: boolean;
    consecutive_failures_before_alert: number;
    alert_cooldown_minutes: number | null;
  }>
): Promise<EndpointSettings | null> {
  if (Object.keys(updates).length === 0) {
    return getEndpointSettings(endpointId);
  }

  const [settings] = await sql<EndpointSettings[]>`
    UPDATE endpoint_settings
    SET ${sql(updates)}
    WHERE endpoint_id = ${endpointId}::uuid
    RETURNING *
  `;
  return settings ?? null;
}

export async function getDatabaseSettings(databaseId: string): Promise<DatabaseSettings | null> {
  const [settings] = await sql<DatabaseSettings[]>`
    SELECT * FROM database_settings WHERE database_id = ${databaseId}::uuid
  `;
  return settings ?? null;
}

export async function updateDatabaseSettings(
  databaseId: string,
  updates: Partial<{
    alerts_enabled: boolean;
    alert_on_down: boolean;
    consecutive_failures_before_alert: number;
    alert_cooldown_minutes: number | null;
  }>
): Promise<DatabaseSettings | null> {
  if (Object.keys(updates).length === 0) {
    return getDatabaseSettings(databaseId);
  }

  const [settings] = await sql<DatabaseSettings[]>`
    UPDATE database_settings
    SET ${sql(updates)}
    WHERE database_id = ${databaseId}::uuid
    RETURNING *
  `;
  return settings ?? null;
}

import { getOrgSettings, OrgSettings } from "./org";

interface EffectiveThresholds {
  cpu: number;
  memory: number;
  disk: number;
  load: number;
  cooldown: number;
}

/**
 * Get effective thresholds for a server (server settings → org defaults → hardcoded)
 */
export async function getEffectiveServerThresholds(
  orgId: string,
  serverId: string
): Promise<EffectiveThresholds> {
  const [serverSettings, orgSettings] = await Promise.all([
    getServerSettings(serverId),
    getOrgSettings(orgId),
  ]);

  return {
    cpu: serverSettings?.cpu_threshold ?? orgSettings?.default_cpu_threshold ?? 90.0,
    memory: serverSettings?.memory_threshold ?? orgSettings?.default_memory_threshold ?? 90.0,
    disk: serverSettings?.disk_threshold ?? orgSettings?.default_disk_threshold ?? 85.0,
    load: serverSettings?.load_threshold ?? orgSettings?.default_load_threshold ?? 10.0,
    cooldown:
      serverSettings?.alert_cooldown_minutes ?? orgSettings?.default_alert_cooldown_minutes ?? 5,
  };
}

/**
 * Get effective cooldown for any target (target settings → org defaults → hardcoded)
 */
export async function getEffectiveCooldown(
  orgId: string,
  targetType: "server" | "endpoint" | "database",
  targetId: string
): Promise<number> {
  let targetCooldown: number | null = null;

  if (targetType === "server") {
    const settings = await getServerSettings(targetId);
    targetCooldown = settings?.alert_cooldown_minutes ?? null;
  } else if (targetType === "endpoint") {
    const settings = await getEndpointSettings(targetId);
    targetCooldown = settings?.alert_cooldown_minutes ?? null;
  } else if (targetType === "database") {
    const settings = await getDatabaseSettings(targetId);
    targetCooldown = settings?.alert_cooldown_minutes ?? null;
  }

  if (targetCooldown !== null) {
    return targetCooldown;
  }

  const orgSettings = await getOrgSettings(orgId);
  return orgSettings?.default_alert_cooldown_minutes ?? 5;
}

/**
 * Check if alerts are enabled for a target
 */
export async function isAlertsEnabled(
  targetType: "server" | "endpoint" | "database",
  targetId: string
): Promise<boolean> {
  if (targetType === "server") {
    const settings = await getServerSettings(targetId);
    return settings?.alerts_enabled ?? true;
  } else if (targetType === "endpoint") {
    const settings = await getEndpointSettings(targetId);
    return settings?.alerts_enabled ?? true;
  } else if (targetType === "database") {
    const settings = await getDatabaseSettings(targetId);
    return settings?.alerts_enabled ?? true;
  }
  return true;
}
