import type { ApiResponse } from "../types/auth.types";
import type { Server, ServerMetric } from "../types/monitoring.types";
import api from "./AxiosInstance";

export async function listServers(orgId: string) {
  const res = await api.get<ApiResponse<{ servers: Server[] }>>(
    `/org/${orgId}/servers`
  );
  return res.data;
}

export async function getServer(orgId: string, serverId: string) {
  const res = await api.get<ApiResponse<Server>>(
    `/org/${orgId}/servers/${serverId}`
  );
  return res.data;
}

export async function getServerMetrics(orgId: string, serverId: string) {
  const res = await api.get<ApiResponse<{ metrics: ServerMetric[] }>>(
    `/org/${orgId}/servers/${serverId}/metrics`
  );
  return res.data;
}
