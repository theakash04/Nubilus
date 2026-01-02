import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { isServerOnline } from "@/hooks/useDashboardStats";
import { useOrganization } from "@/hooks/useOrganization";
import { useServers } from "@/hooks/useServers";
import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { Loader2, Server } from "lucide-react";

export const Route = createLazyFileRoute(
  "/_authenticated/dashboard/$orgId/servers"
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { orgId } = Route.useParams();
  const { data: serversData, isLoading } = useServers(orgId);
  const { data: orgData } = useOrganization(orgId);
  const offlineThreshold =
    orgData?.data?.server_offline_threshold_seconds ?? 300;

  const servers = serversData?.data?.servers || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Servers</h1>
      </div>

      {servers.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="p-4 rounded-full bg-muted w-fit mx-auto mb-4">
            <Server className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">
            No servers monitored
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Install the agent on your first server to see metrics here.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {servers.map((server) => {
            const online = isServerOnline(server, offlineThreshold);
            return (
              <Link
                key={server.id}
                to={`/dashboard/$orgId/server/$serverId`}
                params={{ orgId, serverId: server.id }}
              >
                <Card className="p-4 hover:border-primary/50 transition-colors cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div
                        className={`p-3 rounded-lg ${online ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"}`}
                      >
                        <Server className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                          {server.name}
                        </h3>
                        <p className="text-sm text-muted-foreground font-mono">
                          {server.hostname || server.ip_address || "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge status={online ? "success" : "neutral"}>
                        {online ? "Online" : "Offline"}
                      </Badge>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
