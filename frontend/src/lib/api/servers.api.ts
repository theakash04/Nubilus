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

export interface MetricsQueryParams {
  from?: string;
  to?: string;
  limit?: number;
}

export async function getServerMetrics(
  orgId: string,
  serverId: string,
  params?: MetricsQueryParams
) {
  const searchParams = new URLSearchParams();
  if (params?.from) searchParams.set("from", params.from);
  if (params?.to) searchParams.set("to", params.to);
  if (params?.limit) searchParams.set("limit", String(params.limit));

  const queryString = searchParams.toString();
  const url = `/org/${orgId}/servers/${serverId}/metrics${queryString ? `?${queryString}` : ""}`;

  const res = await api.get<ApiResponse<{ metrics: ServerMetric[] }>>(url);
  return res.data;
}
