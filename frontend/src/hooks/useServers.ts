import { useQuery } from "@tanstack/react-query";
import {
  listServers,
  getServer,
  getServerMetrics,
} from "@/lib/api/servers.api";

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

export function useServerMetrics(orgId: string, serverId: string) {
  return useQuery({
    queryKey: ["org", orgId, "servers", serverId, "metrics"],
    queryFn: () => getServerMetrics(orgId, serverId),
    enabled: !!orgId && !!serverId,
    staleTime: 1000 * 30, // 30 seconds for metrics
    refetchInterval: 1000 * 30, // Auto-refresh every 30s
  });
}
