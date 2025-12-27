import { useServers } from "@/hooks/useServers";
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
  const servers = (serversData?.data?.servers || []).slice(0, limit);

  const getStatusColor = (isOnline: boolean) => {
    return isOnline ? "bg-emerald-500" : "bg-slate-400";
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/20">
            <Server className="h-4 w-4 text-primary-600 dark:text-primary-400" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
            Servers
          </h3>
        </div>
        <span className="text-xs text-slate-400">Top {limit}</span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : servers.length === 0 ? (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
          No servers registered
        </div>
      ) : (
        <div className="space-y-3">
          {servers.map((server) => {
            const online = isServerOnline(server);
            return (
              <div
                key={server.id}
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${getStatusColor(online)}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {server.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {server.hostname || server.ipAddress || "No hostname"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 shrink-0 ml-3">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      online
                        ? "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20"
                        : "text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-slate-800"
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
