import sql from "..";
import { Alert, AlertRule } from "../../types/database";
import { AlertRuleType, AlertSeverity, AlertStatus, AlertTargetType, ComparisonOperator } from "../../types/enums";

export async function getAlertRulesByOrgId(orgId: string): Promise<AlertRule[]> {
  const rules = await sql<AlertRule[]>`
    SELECT * FROM alert_rules WHERE org_id = ${orgId}::uuid ORDER BY created_at DESC
  `;
  return rules;
}

export async function getAlertRuleById(id: string, orgId: string): Promise<AlertRule | null> {
  const [rule] = await sql<AlertRule[]>`
    SELECT * FROM alert_rules WHERE id = ${id}::uuid AND org_id = ${orgId}::uuid
  `;
  return rule ?? null;
}

export async function createAlertRule(
  orgId: string,
  data: {
    name: string;
    description?: string;
    rule_type: AlertRuleType;
    target_type: AlertTargetType;
    target_id: string;
    threshold_value?: number;
    threshold_duration?: number;
    comparison_operator?: ComparisonOperator;
    notify_email?: boolean;
    notify_webhook?: boolean;
  }
): Promise<AlertRule> {
  const [rule] = await sql<AlertRule[]>`
    INSERT INTO alert_rules (
      org_id, name, description, rule_type, target_type, target_id,
      threshold_value, threshold_duration, comparison_operator,
      notify_email, notify_webhook
    )
    VALUES (
      ${orgId}::uuid,
      ${data.name},
      ${data.description ?? null},
      ${data.rule_type},
      ${data.target_type},
      ${data.target_id}::uuid,
      ${data.threshold_value ?? null},
      ${data.threshold_duration ?? null},
      ${data.comparison_operator ?? null},
      ${data.notify_email ?? true},
      ${data.notify_webhook ?? false}
    )
    RETURNING *
  `;
  return rule;
}

export async function updateAlertRule(
  id: string,
  orgId: string,
  updates: Partial<{
    name: string;
    description: string;
    threshold_value: number;
    threshold_duration: number;
    comparison_operator: ComparisonOperator;
    notify_email: boolean;
    notify_webhook: boolean;
    enabled: boolean;
  }>
): Promise<AlertRule | null> {
  if (Object.keys(updates).length === 0) {
    return getAlertRuleById(id, orgId);
  }

  const [rule] = await sql<AlertRule[]>`
    UPDATE alert_rules
    SET ${sql(updates)}
    WHERE id = ${id}::uuid AND org_id = ${orgId}::uuid
    RETURNING *
  `;
  return rule ?? null;
}

export async function deleteAlertRule(id: string, orgId: string): Promise<boolean> {
  const result = await sql`
    DELETE FROM alert_rules WHERE id = ${id}::uuid AND org_id = ${orgId}::uuid
  `;
  return result.count > 0;
}

export async function getAlertsByOrgId(
  orgId: string,
  filters: { status?: AlertStatus; severity?: AlertSeverity; limit?: number }
): Promise<Alert[]> {
  const limit = filters.limit ?? 100;

  let query = sql<Alert[]>`
    SELECT * FROM alerts 
    WHERE org_id = ${orgId}::uuid
  `;

  if (filters.status) {
    query = sql<Alert[]>`
      SELECT * FROM alerts 
      WHERE org_id = ${orgId}::uuid AND status = ${filters.status}
      ORDER BY fired_at DESC
      LIMIT ${limit}
    `;
  } else if (filters.severity) {
    query = sql<Alert[]>`
      SELECT * FROM alerts 
      WHERE org_id = ${orgId}::uuid AND severity = ${filters.severity}
      ORDER BY fired_at DESC
      LIMIT ${limit}
    `;
  } else {
    query = sql<Alert[]>`
      SELECT * FROM alerts 
      WHERE org_id = ${orgId}::uuid
      ORDER BY fired_at DESC
      LIMIT ${limit}
    `;
  }

  return query;
}

export async function acknowledgeAlert(id: string, orgId: string): Promise<Alert | null> {
  const [alert] = await sql<Alert[]>`
    UPDATE alerts
    SET status = 'acknowledged', acknowledged_at = NOW()
    WHERE id = ${id}::uuid AND org_id = ${orgId}::uuid
    RETURNING *
  `;
  return alert ?? null;
}

export async function resolveAlert(id: string, orgId: string): Promise<Alert | null> {
  const [alert] = await sql<Alert[]>`
    UPDATE alerts
    SET status = 'resolved', resolved_at = NOW()
    WHERE id = ${id}::uuid AND org_id = ${orgId}::uuid
    RETURNING *
  `;
  return alert ?? null;
}

export async function createAlert(data: {
  org_id: string;
  alert_rule_id?: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  target_type?: AlertTargetType;
  target_id?: string;
  metric_value?: number;
}): Promise<Alert> {
  const [alert] = await sql<Alert[]>`
    INSERT INTO alerts (org_id, alert_rule_id, severity, title, message, target_type, target_id, metric_value)
    VALUES (
      ${data.org_id}::uuid,
      ${data.alert_rule_id ?? null}::uuid,
      ${data.severity},
      ${data.title},
      ${data.message},
      ${data.target_type ?? null},
      ${data.target_id ?? null}::uuid,
      ${data.metric_value ?? null}
    )
    RETURNING *
  `;
  return alert;
}
