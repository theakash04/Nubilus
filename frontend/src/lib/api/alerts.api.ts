import type { ApiResponse } from "../types/auth.types";
import type { Alert, AlertRule } from "../types/monitoring.types";
import api from "./AxiosInstance";

export async function listAlerts(orgId: string) {
  const res = await api.get<ApiResponse<{ alerts: Alert[] }>>(
    `/org/${orgId}/alerts`
  );
  return res.data;
}

export async function listAlertRules(orgId: string) {
  const res = await api.get<ApiResponse<{ rules: AlertRule[] }>>(
    `/org/${orgId}/alert-rules`
  );
  return res.data;
}

export async function acknowledgeAlert(orgId: string, alertId: string) {
  const res = await api.put<ApiResponse>(
    `/org/${orgId}/alerts/${alertId}/acknowledge`
  );
  return res.data;
}

export async function resolveAlert(orgId: string, alertId: string) {
  const res = await api.put<ApiResponse>(
    `/org/${orgId}/alerts/${alertId}/resolve`
  );
  return res.data;
}

interface CreateAlertRuleData {
  name: string;
  type: "server" | "endpoint" | "database";
  targetId?: string;
  condition: string;
  threshold: number;
  severity: "info" | "warning" | "critical";
  enabled?: boolean;
}

export async function createAlertRule(
  orgId: string,
  data: CreateAlertRuleData
) {
  const res = await api.post<ApiResponse<AlertRule>>(
    `/org/${orgId}/alert-rules`,
    data
  );
  return res.data;
}

export async function deleteAlertRule(orgId: string, ruleId: string) {
  const res = await api.delete<ApiResponse>(
    `/org/${orgId}/alert-rules/${ruleId}`
  );
  return res.data;
}
