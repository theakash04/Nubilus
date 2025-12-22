import {
  AlertRuleType,
  AlertSeverity,
  AlertStatus,
  AlertTargetType,
  ComparisonOperator,
  DatabaseType,
  HttpMethod,
  Permission,
  ProcessStatus,
  ServerStatus,
  ServiceStatus,
  ServiceType,
} from "./enums";

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
  invited_by: string | null;
  last_login: Date | null;
}

export interface ApiKey {
  id: string;
  org_id: string;
  key_hash: string;
  key_prefix: string | null;
  name: string | null;
  created_at: Date;
  last_used_at: Date | null;
  is_active: boolean;
}

export interface Server {
  id: string;
  org_id: string;
  name: string;
  hostname: string | null;
  ip_address: string | null;
  api_key_id: string;
  status: ServerStatus;
  created_at: Date;
  last_seen_at: Date | null;
  os_type: string | null;
  os_version: string | null;
  agent_version: string | null;
  tags: string[];
}

export interface Endpoint {
  id: string;
  org_id: string;
  server_id: string | null;
  name: string;
  url: string;
  check_interval: number;
  timeout: number;
  method: HttpMethod;
  expected_status_code: number;
  enabled: boolean;
  created_at: Date;
  last_checked_at: Date | null;
  tags: string[];
}

export interface DatabaseTarget {
  id: string;
  org_id: string;
  server_id: string | null;
  name: string;
  db_type: DatabaseType;
  connection_url: string;
  check_interval: number;
  timeout: number;
  enabled: boolean;
  created_at: Date;
  last_checked_at: Date | null;
}

export interface ServerService {
  id: string;
  server_id: string;
  service_type: ServiceType;
  name: string;
  port: number | null;
  status: ServiceStatus;
  discovered_at: Date;
  last_seen_at: Date | null;
}

export interface AlertRule {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  rule_type: AlertRuleType;
  target_type: AlertTargetType;
  target_id: string;
  threshold_value: number | null;
  threshold_duration: number | null;
  comparison_operator: ComparisonOperator | null;
  notify_email: boolean;
  notify_webhook: boolean;
  enabled: boolean;
  created_at: Date;
}

export interface Alert {
  id: string;
  org_id: string;
  alert_rule_id: string | null;
  severity: AlertSeverity;
  title: string;
  message: string;
  status: AlertStatus;
  fired_at: Date;
  acknowledged_at: Date | null;
  resolved_at: Date | null;
  target_type: AlertTargetType | null;
  target_id: string | null;
  metric_value: number | null;
}

// timescale db metric types
export interface HealthCheck {
  time: Date;
  endpoint_id: string;
  status_code: number | null;
  response_time: number | null;
  is_up: boolean | null;
  error_message: string | null;
  checked_from: string | null;
}

export interface ServerMetric {
  time: Date;
  server_id: string;
  // CPU
  cpu_usage: number | null;
  cpu_count: number | null;
  load_average_1m: number | null;
  load_average_5m: number | null;
  load_average_15m: number | null;
  // Memory
  memory_usage: number | null;
  memory_total: bigint | null;
  memory_used: bigint | null;
  memory_available: bigint | null;
  // Disk
  disk_usage: number | null;
  disk_total: bigint | null;
  disk_used: bigint | null;
  disk_read_bytes: bigint | null;
  disk_write_bytes: bigint | null;
  // Network
  network_in: bigint | null;
  network_out: bigint | null;
}

export interface ProcessMetric {
  time: Date;
  server_id: string;
  process_name: string | null;
  pid: number | null;
  cpu_percent: number | null;
  memory_mb: number | null;
  status: ProcessStatus | null;
}

export interface DatabaseMetric {
  time: Date;
  target_id: string;
  // Connections
  connection_count: number | null;
  active_connections: number | null;
  idle_connections: number | null;
  // Queries
  queries_per_second: number | null;
  slow_queries: number | null;
  avg_query_time_ms: number | null;
  // Cache
  cache_hit_ratio: number | null;
  // Storage
  db_size_bytes: bigint | null;
  table_count: number | null;
  // Health
  is_healthy: boolean | null;
  error_message: string | null;
}

// create user
export type SignUpUser = {
  name: User["name"];
  email: User["email"];
  password: User["password_hash"];
};
