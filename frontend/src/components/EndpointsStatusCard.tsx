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
        return "bg-slate-400";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20";
      case "unhealthy":
        return "text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-900/20";
      default:
        return "text-slate-600 bg-slate-50 dark:text-slate-400 dark:bg-slate-800";
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
            <CloudLightning className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
            Endpoint Status
          </h3>
        </div>
        <span className="text-xs text-slate-400">Top {limit}</span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : endpoints.length === 0 ? (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
          No endpoints configured
        </div>
      ) : (
        <div className="space-y-3">
          {endpoints.map((endpoint) => (
            <div
              key={endpoint.id}
              className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${getStatusColor(endpoint.status)}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {endpoint.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
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
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
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
