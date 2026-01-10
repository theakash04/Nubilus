// Server types
export interface Server {
  id: string;
  org_id: string;
  name: string;
  hostname: string;
  ip_address: string | null;
  api_key_id: string | null;
  status: "pending" | "active" | "inactive" | "error";
  tags: string[];
  last_seen_at: string | null;
  created_at: string;
  os_type: string;
  os_version: string;
  agent_version: string;
}

export interface ServerMetric {
  time: string;
  server_id: string;
  cpu_usage: number;
  cpu_count: number;
  load_average_1m: number;
  load_average_5m: number;
  load_average_15m: number;
  memory_usage: number;
  memory_total: string; // BigInt comes as string from DB
  memory_used: string;
  memory_available: string;
  disk_usage: number;
  disk_total: string;
  disk_used: string;
  disk_read_bytes: string;
  disk_write_bytes: string;
  network_in: string;
  network_out: string;
}

// Endpoint types
export interface Endpoint {
  id: string;
  org_id: string;
  server_id: string | null;
  name: string;
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "HEAD";
  expected_status_code: number;
  check_interval: number;
  timeout: number;
  status: "healthy" | "unhealthy" | "pending";
  last_checked_at: string | null;
  tags: string[];
  created_at: string;
}

export interface EndpointCheck {
  time: string; // Backend uses 'time' field from TimescaleDB
  endpoint_id: string;
  status_code: number | null;
  response_time: number | null;
  is_up: boolean | null;
  error_message: string | null;
  checked_from: string | null;
}

// Database types
export interface DatabaseTarget {
  id: string;
  org_id: string;
  server_id: string | null;
  name: string;
  db_type: "postgresql" | "mysql" | "mongodb" | "redis";
  is_healthy: boolean | null;
  check_interval: number;
  timeout: number;
  enabled: boolean;
  last_checked_at: string | null;
  created_at: string;
}

export interface DatabaseMetric {
  id: string;
  database_id: string;
  connection_count: number;
  query_time: number;
  cache_hit_ratio: number | null;
  replication_lag: number | null;
  time: string;
  target_id: string;
  active_connections: number | null;
  idle_connections: number | null;
  queries_per_second: number | null;
  slow_queries: number | null;
  avg_query_time_ms: number | null;
  db_size_bytes: number | null;
  table_count: number | null;
  is_healthy: boolean | null;
  error_message: string | null;
}

// Alert types
export interface Alert {
  id: string;
  org_id: string;
  severity: "info" | "warning" | "critical";
  status: "open" | "acknowledged" | "resolved";
  title: string;
  message: string;
  fired_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
  target_type: "server" | "endpoint" | "database" | null;
  target_id: string | null;
  metric_value: number | null;
}

export interface AlertRule {
  id: string;
  org_id: string;
  name: string;
  type: "server" | "endpoint" | "database";
  target_id: string | null;
  condition: string;
  threshold: number;
  severity: "info" | "warning" | "critical";
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

// API Key types
export interface ApiKey {
  id: string;
  org_id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
  is_active: boolean;
}

// Settings types
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

export interface EndpointSettings {
  id: string;
  endpoint_id: string;
  alerts_enabled: boolean;
  alert_on_down: boolean;
  consecutive_failures_before_alert: number;
  alert_cooldown_minutes: number | null;
}

export interface UpdateEndpointSettingsInput {
  alerts_enabled?: boolean;
  alert_on_down?: boolean;
  consecutive_failures_before_alert?: number;
  alert_cooldown_minutes?: number | null;
}

export interface DatabaseSettings {
  id: string;
  database_id: string;
  alerts_enabled: boolean;
  alert_on_down: boolean;
  consecutive_failures_before_alert: number;
  alert_cooldown_minutes: number | null;
}

export interface UpdateDatabaseSettingsInput {
  alerts_enabled?: boolean;
  alert_on_down?: boolean;
  consecutive_failures_before_alert?: number;
  alert_cooldown_minutes?: number | null;
}
