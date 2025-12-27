import { useAlerts } from "@/hooks/useAlerts";
import { Card } from "@/components/ui/Card";
import { AlertCircle, Loader2, Bell, CheckCircle } from "lucide-react";

interface RecentAlertsCardProps {
  orgId: string;
  limit?: number;
}

export function RecentAlertsCard({ orgId, limit = 5 }: RecentAlertsCardProps) {
  const { data: alertsData, isLoading } = useAlerts(orgId);
  const alerts = (alertsData?.data?.alerts || []).slice(0, limit);

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
        return "text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-900/20";
      case "warning":
        return "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20";
      default:
        return "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "resolved":
        return <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />;
      case "acknowledged":
        return <Bell className="h-3.5 w-3.5 text-amber-500" />;
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
          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
            Recent Alerts
          </h3>
        </div>
        <span className="text-xs text-slate-400">Recent</span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
          <CheckCircle className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
          No active alerts
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-start justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-start space-x-3 min-w-0 flex-1">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${getSeverityColor(alert.severity)}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {alert.title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
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
                <span className="text-xs text-slate-400 flex items-center space-x-1">
                  {getStatusIcon(alert.status)}
                  <span>{formatTime(alert.triggeredAt)}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
