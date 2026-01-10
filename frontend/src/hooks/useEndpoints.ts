import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listEndpoints,
  getEndpoint,
  getEndpointChecks,
  createEndpoint,
  deleteEndpoint,
  updateEndpoint,
  getEndpointSettings,
  updateEndpointSettings,
} from "@/lib/api/endpoints.api";
import type { UpdateEndpointSettingsInput } from "@/lib/types/monitoring.types";

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

export function useUpdateEndpoint(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      endpointId,
      data,
    }: {
      endpointId: string;
      data: Parameters<typeof updateEndpoint>[2];
    }) => updateEndpoint(orgId, endpointId, data),
    onSuccess: (_, { endpointId }) => {
      queryClient.invalidateQueries({ queryKey: ["org", orgId, "endpoints"] });
      queryClient.invalidateQueries({
        queryKey: ["org", orgId, "endpoints", endpointId],
      });
    },
  });
}

export function useEndpointSettings(orgId: string, endpointId: string) {
  return useQuery({
    queryKey: ["org", orgId, "endpoints", endpointId, "settings"],
    queryFn: () => getEndpointSettings(orgId, endpointId),
    enabled: !!orgId && !!endpointId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUpdateEndpointSettings(orgId: string, endpointId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateEndpointSettingsInput) =>
      updateEndpointSettings(orgId, endpointId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["org", orgId, "endpoints", endpointId, "settings"],
      });
    },
  });
}
