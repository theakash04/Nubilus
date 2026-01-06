import { useServers } from "@/hooks/useServers";
import { useOrganization } from "@/hooks/useOrganization";
import { Card } from "@/components/ui/Card";
import { Server, Loader2 } from "lucide-react";
import { isServerOnline } from "@/hooks/useDashboardStats";

interface ServersStatusCardProps {
  orgId: string;
  limit?: number;
}

export function ServersStatusCard({
  orgId,
  limit = 5,
}: ServersStatusCardProps) {
  const { data: serversData, isLoading } = useServers(orgId);
  const { data: orgData } = useOrganization(orgId);
  const offlineThreshold =
    orgData?.data?.server_offline_threshold_seconds ?? 300;
  const servers = (serversData?.data?.servers || []).slice(0, limit);

  const getStatusColor = (isOnline: boolean) => {
    return isOnline ? "bg-emerald-500" : "bg-muted-foreground";
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Server className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
            Servers
          </h3>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : servers.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No servers registered
        </div>
      ) : (
        <div className="space-y-3">
          {servers.map((server) => {
            const online = isServerOnline(server, offlineThreshold);
            return (
              <div
                key={server.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${getStatusColor(online)}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {server.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {server.hostname || server.ip_address || "No hostname"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 shrink-0 ml-3">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      online
                        ? "text-emerald-500 bg-emerald-500/10"
                        : "text-muted-foreground bg-muted"
                    }`}
                  >
                    {online ? "Online" : "Offline"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
