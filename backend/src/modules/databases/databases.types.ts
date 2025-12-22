import { DatabaseType } from "../../types/enums";

export interface CreateDatabaseTargetInput {
  name: string;
  db_type: DatabaseType;
  connection_url: string;
  server_id?: string;
  check_interval?: number;
  timeout?: number;
}

export interface UpdateDatabaseTargetInput {
  name?: string;
  connection_url?: string;
  check_interval?: number;
  timeout?: number;
  enabled?: boolean;
}

export interface DatabaseMetricsQuery {
  from?: string;
  to?: string;
  limit?: number;
}
