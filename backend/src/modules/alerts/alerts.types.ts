import { AlertRuleType, AlertSeverity, AlertStatus, AlertTargetType, ComparisonOperator } from "../../types/enums";

export interface CreateAlertRuleInput {
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

export interface UpdateAlertRuleInput {
  name?: string;
  description?: string;
  threshold_value?: number;
  threshold_duration?: number;
  comparison_operator?: ComparisonOperator;
  notify_email?: boolean;
  notify_webhook?: boolean;
  enabled?: boolean;
}

export interface AlertsQuery {
  status?: AlertStatus;
  severity?: AlertSeverity;
  limit?: number;
}
