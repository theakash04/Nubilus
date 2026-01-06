import type { ApiResponse } from "../types/auth.types";
import type {
  Endpoint,
  EndpointCheck,
  EndpointSettings,
  UpdateEndpointSettingsInput,
} from "../types/monitoring.types";
import api from "./AxiosInstance";

export async function listEndpoints(orgId: string) {
  const res = await api.get<ApiResponse<{ endpoints: Endpoint[] }>>(
    `/org/${orgId}/endpoints`
  );
  return res.data;
}

export async function getEndpoint(orgId: string, endpointId: string) {
  const res = await api.get<ApiResponse<Endpoint>>(
    `/org/${orgId}/endpoints/${endpointId}`
  );
  return res.data;
}

export async function getEndpointChecks(orgId: string, endpointId: string) {
  const res = await api.get<ApiResponse<{ checks: EndpointCheck[] }>>(
    `/org/${orgId}/endpoints/${endpointId}/checks`
  );
  return res.data;
}

interface CreateEndpointData {
  name: string;
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "HEAD";
  expectedStatus?: number;
  checkInterval?: number;
  timeout?: number;
  tags?: string[];
}

export async function createEndpoint(orgId: string, data: CreateEndpointData) {
  const res = await api.post<ApiResponse<Endpoint>>(
    `/org/${orgId}/endpoints`,
    data
  );
  return res.data;
}

export async function deleteEndpoint(orgId: string, endpointId: string) {
  const res = await api.delete<ApiResponse>(
    `/org/${orgId}/endpoints/${endpointId}`
  );
  return res.data;
}

export async function getEndpointSettings(orgId: string, endpointId: string) {
  const res = await api.get<ApiResponse<EndpointSettings>>(
    `/org/${orgId}/endpoints/${endpointId}/settings`
  );
  return res.data;
}

export async function updateEndpointSettings(
  orgId: string,
  endpointId: string,
  data: UpdateEndpointSettingsInput
) {
  const res = await api.put<ApiResponse<EndpointSettings>>(
    `/org/${orgId}/endpoints/${endpointId}/settings`,
    data
  );
  return res.data;
}
