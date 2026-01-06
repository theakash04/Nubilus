import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listServers,
  getServer,
  getServerMetrics,
  getServerSettings,
  updateServerSettings,
  type MetricsQueryParams,
} from "@/lib/api/servers.api";
import type { UpdateServerSettingsInput } from "@/lib/types/monitoring.types";

export function useServers(orgId: string) {
  return useQuery({
    queryKey: ["org", orgId, "servers"],
    queryFn: () => listServers(orgId),
    enabled: !!orgId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useServer(orgId: string, serverId: string) {
  return useQuery({
    queryKey: ["org", orgId, "servers", serverId],
    queryFn: () => getServer(orgId, serverId),
    enabled: !!orgId && !!serverId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useServerMetrics(
  orgId: string,
  serverId: string,
  params?: MetricsQueryParams
) {
  return useQuery({
    queryKey: ["org", orgId, "servers", serverId, "metrics", params],
    queryFn: () => getServerMetrics(orgId, serverId, params),
    enabled: !!orgId && !!serverId,
    staleTime: 1000 * 30, // 30 seconds for metrics
    refetchInterval: 1000 * 30, // Auto-refresh every 30s
  });
}

export function useServerSettings(orgId: string, serverId: string) {
  return useQuery({
    queryKey: ["org", orgId, "servers", serverId, "settings"],
    queryFn: () => getServerSettings(orgId, serverId),
    enabled: !!orgId && !!serverId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUpdateServerSettings(orgId: string, serverId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateServerSettingsInput) =>
      updateServerSettings(orgId, serverId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["org", orgId, "servers", serverId, "settings"],
      });
    },
  });
}
