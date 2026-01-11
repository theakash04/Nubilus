export enum Permission {
  READ = "read",
  WRITE = "write",
  MANAGE = "manage",
}

export enum ServerStatus {
  PENDING = "pending",
  ACTIVE = "active",
  INACTIVE = "inactive",
  ERROR = "error",
}

export enum HttpMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  PATCH = "PATCH",
  DELETE = "DELETE",
  HEAD = "HEAD",
  OPTIONS = "OPTIONS",
}

export enum DatabaseType {
  POSTGRESQL = "postgresql",
  MYSQL = "mysql",
  MONGODB = "mongodb",
  REDIS = "redis",
  MARIADB = "mariadb",
  MSSQL = "mssql",
}

export enum ServiceType {
  HTTP = "http",
  DOCKER = "docker",
  DATABASE = "database",
  PROCESS = "process",
}

export enum ServiceStatus {
  RUNNING = "running",
  STOPPED = "stopped",
  ERROR = "error",
}

export enum AlertRuleType {
  ENDPOINT_DOWN = "endpoint_down",
  HIGH_CPU = "high_cpu",
  HIGH_MEMORY = "high_memory",
  DISK_FULL = "disk_full",
  HIGH_LOAD = "high_load",
  DATABASE_DOWN = "database_down",
}

export enum AlertTargetType {
  ENDPOINT = "endpoint",
  SERVER = "server",
  DATABASE = "database",
}

export enum ComparisonOperator {
  GREATER_THAN = ">",
  LESS_THAN = "<",
  EQUAL = "=",
  GREATER_EQUAL = ">=",
  LESS_EQUAL = "<=",
}

export enum AlertSeverity {
  INFO = "info",
  WARNING = "warning",
  CRITICAL = "critical",
}

export enum AlertStatus {
  OPEN = "open",
  ACKNOWLEDGED = "acknowledged",
  RESOLVED = "resolved",
}

export enum ProcessStatus {
  RUNNING = "running",
  SLEEPING = "sleeping",
  ZOMBIE = "zombie",
  STOPPED = "stopped",
}
