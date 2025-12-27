import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listApiKeys,
  createApiKey,
  deleteApiKey,
} from "@/lib/api/api-keys.api";

export function useApiKeys(orgId: string) {
  return useQuery({
    queryKey: ["org", orgId, "api-keys"],
    queryFn: () => listApiKeys(orgId),
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateApiKey(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof createApiKey>[1]) =>
      createApiKey(orgId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org", orgId, "api-keys"] });
    },
  });
}

export function useDeleteApiKey(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (keyId: string) => deleteApiKey(orgId, keyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org", orgId, "api-keys"] });
    },
  });
}
