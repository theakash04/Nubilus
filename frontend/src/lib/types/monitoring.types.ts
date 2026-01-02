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
  orgId: string;
  name: string;
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "HEAD";
  expectedStatus: number;
  checkInterval: number;
  timeout: number;
  status: "healthy" | "unhealthy" | "pending";
  lastCheckedAt: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface EndpointCheck {
  id: string;
  endpointId: string;
  status: "success" | "failure";
  responseTime: number;
  statusCode: number | null;
  errorMessage: string | null;
  checkedAt: string;
}

// Database types
export interface DatabaseTarget {
  id: string;
  orgId: string;
  name: string;
  type: "postgresql" | "mysql" | "mongodb" | "redis";
  host: string;
  port: number;
  status: "connected" | "disconnected" | "error";
  lastCheckedAt: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseMetric {
  id: string;
  databaseId: string;
  connectionCount: number;
  queryTime: number;
  cacheHitRatio: number | null;
  replicationLag: number | null;
  timestamp: string;
}

// Alert types
export interface Alert {
  id: string;
  orgId: string;
  ruleId: string;
  severity: "info" | "warning" | "critical";
  status: "active" | "acknowledged" | "resolved";
  title: string;
  message: string;
  triggeredAt: string;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
}

export interface AlertRule {
  id: string;
  orgId: string;
  name: string;
  type: "server" | "endpoint" | "database";
  targetId: string | null;
  condition: string;
  threshold: number;
  severity: "info" | "warning" | "critical";
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
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
