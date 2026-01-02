import { useEndpoints } from "@/hooks/useEndpoints";
import { Card } from "@/components/ui/Card";
import { CloudLightning, Loader2 } from "lucide-react";

interface EndpointsStatusCardProps {
  orgId: string;
  limit?: number;
}

export function EndpointsStatusCard({
  orgId,
  limit = 5,
}: EndpointsStatusCardProps) {
  const { data: endpointsData, isLoading } = useEndpoints(orgId);
  const endpoints = (endpointsData?.data?.endpoints || []).slice(0, limit);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-emerald-500";
      case "unhealthy":
        return "bg-rose-500";
      default:
        return "bg-muted-foreground";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-emerald-500 bg-emerald-500/10";
      case "unhealthy":
        return "text-rose-500 bg-rose-500/10";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <CloudLightning className="h-4 w-4 text-emerald-500" />
          </div>
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
            Endpoint Status
          </h3>
        </div>
        <span className="text-xs text-muted-foreground">Top {limit}</span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : endpoints.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No endpoints configured
        </div>
      ) : (
        <div className="space-y-3">
          {endpoints.map((endpoint) => (
            <div
              key={endpoint.id}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${getStatusColor(endpoint.status)}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {endpoint.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {endpoint.url}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3 shrink-0 ml-3">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${getStatusBadge(endpoint.status)}`}
                >
                  {endpoint.status}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  {endpoint.method}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
