import type { ApiResponse } from "../types/auth.types";
import type {
  DatabaseTarget,
  DatabaseMetric,
  DatabaseSettings,
  UpdateDatabaseSettingsInput,
} from "../types/monitoring.types";
import api from "./AxiosInstance";

export async function listDatabases(orgId: string) {
  const res = await api.get<ApiResponse<{ databases: DatabaseTarget[] }>>(
    `/org/${orgId}/databases`
  );
  return res.data;
}

export async function getDatabase(orgId: string, dbId: string) {
  const res = await api.get<ApiResponse<DatabaseTarget>>(
    `/org/${orgId}/databases/${dbId}`
  );
  return res.data;
}

export async function getDatabaseMetrics(orgId: string, dbId: string) {
  const res = await api.get<ApiResponse<{ metrics: DatabaseMetric[] }>>(
    `/org/${orgId}/databases/${dbId}/metrics`
  );
  return res.data;
}

interface CreateDatabaseData {
  name: string;
  type: "postgresql" | "mysql" | "mongodb" | "redis" | "mssql";
  connectionUrl: string;
  checkInterval?: number;
  timeout?: number;
}

export async function createDatabase(orgId: string, data: CreateDatabaseData) {
  const res = await api.post<ApiResponse<DatabaseTarget>>(
    `/org/${orgId}/databases`,
    {
      name: data.name,
      db_type: data.type,
      connection_url: data.connectionUrl,
      check_interval: data.checkInterval,
      timeout: data.timeout,
    }
  );
  return res.data;
}

export async function deleteDatabase(orgId: string, dbId: string) {
  const res = await api.delete<ApiResponse>(`/org/${orgId}/databases/${dbId}`);
  return res.data;
}

interface UpdateDatabaseData {
  name?: string;
  connection_url?: string;
  check_interval?: number;
  timeout?: number;
  enabled?: boolean;
}

export async function updateDatabase(
  orgId: string,
  dbId: string,
  data: UpdateDatabaseData
) {
  const res = await api.put<ApiResponse<DatabaseTarget>>(
    `/org/${orgId}/databases/${dbId}`,
    data
  );
  return res.data;
}

export async function getDatabaseSettings(orgId: string, dbId: string) {
  const res = await api.get<ApiResponse<DatabaseSettings>>(
    `/org/${orgId}/databases/${dbId}/settings`
  );
  return res.data;
}

export async function updateDatabaseSettings(
  orgId: string,
  dbId: string,
  data: UpdateDatabaseSettingsInput
) {
  const res = await api.put<ApiResponse<DatabaseSettings>>(
    `/org/${orgId}/databases/${dbId}/settings`,
    data
  );
  return res.data;
}
