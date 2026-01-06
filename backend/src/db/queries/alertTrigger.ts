import sql from "..";
import { createAlert } from "./alerts";
import { getEffectiveServerThresholds, isAlertsEnabled } from "./settings";
import { addAlertNotification } from "../../queues";
import { Alert } from "../../types/database";
import { AlertSeverity, AlertTargetType } from "../../types/enums";

interface MetricsData {
  cpu_usage?: number;
  memory_usage?: number;
  disk_usage?: number;
  load_average_1m?: number;
}

interface AlertCheckResult {
  alertsTriggered: string[];
}

/**
 * Get the last alert time for a specific metric type and target
 */
async function getLastAlertTime(
  targetType: string,
  targetId: string,
  metricType: string
): Promise<Date | null> {
  const [result] = await sql<{ fired_at: Date }[]>`
    SELECT fired_at FROM alerts
    WHERE target_type = ${targetType}
      AND target_id = ${targetId}::uuid
      AND title LIKE ${`%${metricType}%`}
      AND status != 'resolved'
    ORDER BY fired_at DESC
    LIMIT 1
  `;
  return result?.fired_at ?? null;
}

/**
 * Check if we're within cooldown period
 */
function isWithinCooldown(lastAlertTime: Date | null, cooldownMinutes: number): boolean {
  if (!lastAlertTime) return false;
  const cooldownMs = cooldownMinutes * 60 * 1000;
  const timeSinceLastAlert = Date.now() - lastAlertTime.getTime();
  return timeSinceLastAlert < cooldownMs;
}

/**
 * Get server info for alert messages
 */
async function getServerInfo(serverId: string): Promise<{ name: string; orgId: string } | null> {
  const [server] = await sql<{ name: string; org_id: string }[]>`
    SELECT name, org_id FROM servers WHERE id = ${serverId}::uuid
  `;
  return server ? { name: server.name, orgId: server.org_id } : null;
}

/**
 * Check metrics against thresholds and trigger alerts if needed
 */
export async function checkAndTriggerAlerts(
  serverId: string,
  metrics: MetricsData
): Promise<AlertCheckResult> {
  const alertsTriggered: string[] = [];

  // Get server info
  const serverInfo = await getServerInfo(serverId);
  if (!serverInfo) {
    return { alertsTriggered };
  }

  // Check if alerts are enabled for this server
  const alertsEnabled = await isAlertsEnabled("server", serverId);
  if (!alertsEnabled) {
    return { alertsTriggered };
  }

  // Get effective thresholds
  const thresholds = await getEffectiveServerThresholds(serverInfo.orgId, serverId);

  // Define metric checks
  const checks: {
    name: string;
    value: number | undefined;
    threshold: number;
    unit: string;
    severity: AlertSeverity;
  }[] = [
    {
      name: "CPU Usage",
      value: metrics.cpu_usage,
      threshold: thresholds.cpu,
      unit: "%",
      severity:
        metrics.cpu_usage && metrics.cpu_usage > 95
          ? AlertSeverity.CRITICAL
          : AlertSeverity.WARNING,
    },
    {
      name: "Memory Usage",
      value: metrics.memory_usage,
      threshold: thresholds.memory,
      unit: "%",
      severity:
        metrics.memory_usage && metrics.memory_usage > 95
          ? AlertSeverity.CRITICAL
          : AlertSeverity.WARNING,
    },
    {
      name: "Disk Usage",
      value: metrics.disk_usage,
      threshold: thresholds.disk,
      unit: "%",
      severity:
        metrics.disk_usage && metrics.disk_usage > 95
          ? AlertSeverity.CRITICAL
          : AlertSeverity.WARNING,
    },
    {
      name: "System Load",
      value: metrics.load_average_1m,
      threshold: thresholds.load,
      unit: "",
      severity:
        metrics.load_average_1m && metrics.load_average_1m > thresholds.load * 1.5
          ? AlertSeverity.CRITICAL
          : AlertSeverity.WARNING,
    },
  ];

  // Check each metric
  for (const check of checks) {
    if (check.value === undefined || check.value === null) continue;

    // Only trigger if threshold is exceeded
    if (check.value <= check.threshold) continue;

    // Check cooldown
    const lastAlertTime = await getLastAlertTime("server", serverId, check.name);
    if (isWithinCooldown(lastAlertTime, thresholds.cooldown)) {
      continue;
    }

    // Create the alert
    const title = `High ${check.name} on ${serverInfo.name}`;
    const message = `${check.name} is at ${check.value.toFixed(1)}${
      check.unit
    }, exceeding threshold of ${check.threshold}${check.unit}`;

    const alert = await createAlert({
      org_id: serverInfo.orgId,
      severity: check.severity,
      title,
      message,
      target_type: AlertTargetType.SERVER,
      target_id: serverId,
      metric_value: check.value,
    });

    alertsTriggered.push(alert.id);

    // Queue notification
    await addAlertNotification({
      orgId: serverInfo.orgId,
      alertId: alert.id,
      serverId,
      type: "alert_triggered",
      title,
      message,
    });
  }

  return { alertsTriggered };
}

/**
 * Auto-resolve alerts when metrics return to normal
 */
export async function autoResolveAlerts(serverId: string, metrics: MetricsData): Promise<void> {
  const serverInfo = await getServerInfo(serverId);
  if (!serverInfo) return;

  const thresholds = await getEffectiveServerThresholds(serverInfo.orgId, serverId);

  // Get only 'open' alerts for this server (preserve acknowledged alerts)
  const activeAlerts = await sql<Alert[]>`
    SELECT * FROM alerts
    WHERE target_type = 'server'
      AND target_id = ${serverId}::uuid
      AND status = 'open'
    ORDER BY fired_at DESC
  `;

  for (const alert of activeAlerts) {
    let shouldResolve = false;

    // Check if the metric that triggered this alert is now below threshold
    if (alert.title.includes("CPU") && metrics.cpu_usage !== undefined) {
      shouldResolve = metrics.cpu_usage <= thresholds.cpu;
    } else if (alert.title.includes("Memory") && metrics.memory_usage !== undefined) {
      shouldResolve = metrics.memory_usage <= thresholds.memory;
    } else if (alert.title.includes("Disk") && metrics.disk_usage !== undefined) {
      shouldResolve = metrics.disk_usage <= thresholds.disk;
    } else if (alert.title.includes("Load") && metrics.load_average_1m !== undefined) {
      shouldResolve = metrics.load_average_1m <= thresholds.load;
    }

    if (shouldResolve) {
      await sql`
        UPDATE alerts
        SET status = 'resolved', resolved_at = NOW()
        WHERE id = ${alert.id}::uuid
      `;
    }
  }
}
