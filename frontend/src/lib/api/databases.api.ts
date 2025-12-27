import type { ApiResponse } from "../types/auth.types";
import type { DatabaseTarget, DatabaseMetric } from "../types/monitoring.types";
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
  type: "postgresql" | "mysql" | "mongodb" | "redis";
  host: string;
  port: number;
  tags?: string[];
}

export async function createDatabase(orgId: string, data: CreateDatabaseData) {
  const res = await api.post<ApiResponse<DatabaseTarget>>(
    `/org/${orgId}/databases`,
    data
  );
  return res.data;
}

export async function deleteDatabase(orgId: string, dbId: string) {
  const res = await api.delete<ApiResponse>(`/org/${orgId}/databases/${dbId}`);
  return res.data;
}
