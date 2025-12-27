// Server types
export interface Server {
  id: string;
  orgId: string;
  name: string;
  hostname: string;
  ipAddress: string | null;
  status: "online" | "offline" | "unknown";
  tags: string[];
  lastSeenAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ServerMetric {
  id: string;
  serverId: string;
  cpuUsage: number;
  memoryUsage: number;
  memoryTotal: number;
  diskUsage: number;
  diskTotal: number;
  networkIn: number;
  networkOut: number;
  diskReadBytes: number;
  diskWriteBytes: number;
  timestamp: string;
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
  orgId: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
}
