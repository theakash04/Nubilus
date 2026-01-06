import { ServerStatus } from "../../types/enums";

export interface CreateServerInput {
  name: string;
  hostname?: string;
  ip_address?: string;
  os_type?: string;
  os_version?: string;
  agent_version?: string;
  tags?: string[];
}

export interface UpdateServerInput {
  name?: string;
  tags?: string[];
  status?: ServerStatus;
}

export interface ServerMetricsQuery {
  from?: string;
  to?: string;
  limit?: number;
}

export interface UpdateServerSettingsInput {
  cpu_threshold?: number | null;
  memory_threshold?: number | null;
  disk_threshold?: number | null;
  load_threshold?: number | null;
  alert_cooldown_minutes?: number | null;
  alerts_enabled?: boolean;
  notify_email?: boolean | null;
  notify_webhook?: boolean | null;
  notification_emails?: string[] | null;
}
