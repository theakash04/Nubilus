import { useServers } from "./useServers";
import { useEndpoints } from "./useEndpoints";
import { useDatabases } from "./useDatabases";
import { useAlerts } from "./useAlerts";
import { useQuery } from "@tanstack/react-query";
import { getStatsHistory } from "@/lib/api/stats.api";
import type {
  Server,
  Endpoint,
  DatabaseTarget,
} from "@/lib/types/monitoring.types";

// Default threshold: 5 minutes (300 seconds)
const DEFAULT_OFFLINE_THRESHOLD_SECONDS = 300;

export function isServerOnline(
  server: Server,
  thresholdSeconds: number = DEFAULT_OFFLINE_THRESHOLD_SECONDS
): boolean {
  if (!server.last_seen_at) return false;
  const lastSeen = new Date(server.last_seen_at);
  const thresholdMs = thresholdSeconds * 1000;
  return lastSeen.getTime() > Date.now() - thresholdMs;
}

export type SystemStatus = "operational" | "degraded" | "outage";

export function getSystemStatus(
  servers: Server[],
  endpoints: Endpoint[],
  databases: DatabaseTarget[],
  activeAlertsCount: number,
  offlineThresholdSeconds: number = DEFAULT_OFFLINE_THRESHOLD_SECONDS
): SystemStatus {
  const onlineServers = servers.filter((s) =>
    isServerOnline(s, offlineThresholdSeconds)
  ).length;
  const healthyEndpoints = endpoints.filter(
    (e) => e.status === "healthy"
  ).length;
  const connectedDatabases = databases.filter(
    (d) => d.status === "connected"
  ).length;

  if (activeAlertsCount > 5 || (servers.length > 0 && onlineServers === 0)) {
    return "outage";
  }

  if (
    activeAlertsCount > 0 ||
    (servers.length > 0 && onlineServers < servers.length) ||
    (endpoints.length > 0 && healthyEndpoints < endpoints.length) ||
    (databases.length > 0 && connectedDatabases < databases.length)
  ) {
    return "degraded";
  }

  return "operational";
}

export function useDashboardStats(
  orgId: string,
  offlineThresholdSeconds: number = DEFAULT_OFFLINE_THRESHOLD_SECONDS
) {
  const serversQuery = useServers(orgId);
  const endpointsQuery = useEndpoints(orgId);
  const databasesQuery = useDatabases(orgId);
  const alertsQuery = useAlerts(orgId);

  // Fetch historical sparkline data from API
  const historyQuery = useQuery({
    queryKey: ["org", orgId, "stats", "history"],
    queryFn: () => getStatsHistory(orgId),
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5,
  });

  const servers = serversQuery.data?.data?.servers || [];
  const endpoints = endpointsQuery.data?.data?.endpoints || [];
  const databases = databasesQuery.data?.data?.databases || [];
  const alerts = alertsQuery.data?.data?.alerts || [];

  const isLoading =
    serversQuery.isLoading ||
    endpointsQuery.isLoading ||
    databasesQuery.isLoading ||
    alertsQuery.isLoading;

  const activeAlerts = alerts.filter((a) => a.status === "active");

  const stats = {
    totalServers: servers.length,
    onlineServers: servers.filter((s) =>
      isServerOnline(s, offlineThresholdSeconds)
    ).length,
    healthyEndpoints: endpoints.filter((e) => e.status === "healthy").length,
    totalEndpoints: endpoints.length,
    databaseTargets: databases.length,
    connectedDatabases: databases.filter((d) => d.status === "connected")
      .length,
    activeAlerts: activeAlerts.length,
    totalAlerts: alerts.length,
  };

  // Use real sparkline data from API, or fallback to current count repeated
  const historyData = historyQuery.data?.data;
  const fallback = (count: number) => Array(7).fill(count);

  const sparklines = {
    servers: historyData?.servers?.length
      ? historyData.servers
      : fallback(stats.onlineServers),
    endpoints: historyData?.endpoints?.length
      ? historyData.endpoints
      : fallback(stats.healthyEndpoints),
    databases: historyData?.databases?.length
      ? historyData.databases
      : fallback(stats.connectedDatabases),
    alerts: historyData?.alerts?.length
      ? historyData.alerts
      : fallback(stats.activeAlerts),
  };

  const systemStatus = getSystemStatus(
    servers,
    endpoints,
    databases,
    activeAlerts.length,
    offlineThresholdSeconds
  );

  return {
    stats,
    sparklines,
    systemStatus,
    isLoading,
    servers,
    endpoints,
    databases,
    alerts,
    refetch: () => {
      serversQuery.refetch();
      endpointsQuery.refetch();
      databasesQuery.refetch();
      alertsQuery.refetch();
      historyQuery.refetch();
    },
  };
}
