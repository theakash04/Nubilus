import type { ApiResponse } from "../types/auth.types";
import type { ApiKey } from "../types/monitoring.types";
import api from "./AxiosInstance";

export async function listApiKeys(orgId: string) {
  const res = await api.get<ApiResponse<{ keys: ApiKey[] }>>(
    `/org/${orgId}/keys`
  );
  return res.data;
}

interface CreateApiKeyData {
  name: string;
  expiresAt?: string;
}

interface CreateApiKeyResponse extends ApiKey {
  key: string;
}

export async function createApiKey(orgId: string, data: CreateApiKeyData) {
  const res = await api.post<ApiResponse<CreateApiKeyResponse>>(
    `/org/${orgId}/keys`,
    data
  );
  return res.data;
}

export async function deleteApiKey(orgId: string, keyId: string) {
  const res = await api.delete<ApiResponse>(`/org/${orgId}/keys/${keyId}`);
  return res.data;
}
