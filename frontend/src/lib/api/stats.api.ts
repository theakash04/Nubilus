import type { ApiResponse } from "../types/auth.types";
import api from "./AxiosInstance";

export interface StatsHistory {
  servers: number[];
  endpoints?: number[];
  databases?: number[];
  alerts?: number[];
}

export async function getStatsHistory(orgId: string) {
  const res = await api.get<ApiResponse<StatsHistory>>(
    `/org/${orgId}/stats/history`
  );
  return res.data;
}
