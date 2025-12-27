import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listEndpoints,
  getEndpoint,
  getEndpointChecks,
  createEndpoint,
  deleteEndpoint,
} from "@/lib/api/endpoints.api";

export function useEndpoints(orgId: string) {
  return useQuery({
    queryKey: ["org", orgId, "endpoints"],
    queryFn: () => listEndpoints(orgId),
    enabled: !!orgId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useEndpoint(orgId: string, endpointId: string) {
  return useQuery({
    queryKey: ["org", orgId, "endpoints", endpointId],
    queryFn: () => getEndpoint(orgId, endpointId),
    enabled: !!orgId && !!endpointId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useEndpointChecks(orgId: string, endpointId: string) {
  return useQuery({
    queryKey: ["org", orgId, "endpoints", endpointId, "checks"],
    queryFn: () => getEndpointChecks(orgId, endpointId),
    enabled: !!orgId && !!endpointId,
    staleTime: 1000 * 60, // 1 minute for checks
    refetchInterval: 1000 * 60, // Auto-refresh every minute
  });
}

export function useCreateEndpoint(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof createEndpoint>[1]) =>
      createEndpoint(orgId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org", orgId, "endpoints"] });
    },
  });
}

export function useDeleteEndpoint(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (endpointId: string) => deleteEndpoint(orgId, endpointId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org", orgId, "endpoints"] });
    },
  });
}
