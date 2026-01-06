import { useAlerts } from "@/hooks/useAlerts";
import { Card } from "@/components/ui/Card";
import {
  AlertCircle,
  Loader2,
  Bell,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

interface RecentAlertsCardProps {
  orgId: string;
  limit?: number;
}

export function RecentAlertsCard({ orgId, limit = 5 }: RecentAlertsCardProps) {
  const { data: alertsData, isLoading } = useAlerts(orgId);
  const allAlerts = alertsData?.data?.alerts || [];
  const alerts = allAlerts.slice(0, limit);
  const hasMore = allAlerts.length > limit;

  // Get the first server with alerts to link to
  const firstServerWithAlerts = alerts.find(
    (a) => a.target_type === "server"
  )?.target_id;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-rose-500";
      case "warning":
        return "bg-amber-500";
      default:
        return "bg-blue-500";
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-destructive bg-destructive/10";
      case "warning":
        return "text-warning bg-warning/10";
      default:
        return "text-info bg-info/10";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "resolved":
        return <CheckCircle className="h-3.5 w-3.5 text-green-500" />;
      case "acknowledged":
        return <Bell className="h-3.5 w-3.5 text-amber-500" />;
      case "open":
      default:
        return <AlertCircle className="h-3.5 w-3.5 text-rose-500" />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <Card className="p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </div>
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
            Recent Alerts
          </h3>
        </div>
        {firstServerWithAlerts && hasMore && (
          <Link
            to="/dashboard/$orgId/server/$serverId"
            params={{ orgId, serverId: firstServerWithAlerts }}
            search={{ tab: "alerts" }}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            View All
            <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          <CheckCircle className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
          No active alerts
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <Link
              key={alert.id}
              to={
                alert.target_type === "server" && alert.target_id
                  ? "/dashboard/$orgId/server/$serverId"
                  : "/dashboard/$orgId"
              }
              params={
                alert.target_type === "server" && alert.target_id
                  ? { orgId, serverId: alert.target_id }
                  : { orgId }
              }
              search={alert.target_type === "server" ? { tab: "alerts" } : {}}
              className="flex items-start justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="flex items-start space-x-3 min-w-0 flex-1">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${getSeverityColor(alert.severity)}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {alert.title}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {alert.message}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end space-y-1 shrink-0 ml-3">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${getSeverityBadge(alert.severity)}`}
                >
                  {alert.severity}
                </span>
                <span className="text-xs text-muted-foreground flex items-center space-x-1">
                  {getStatusIcon(alert.status)}
                  <span>{formatTime(alert.fired_at)}</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}
