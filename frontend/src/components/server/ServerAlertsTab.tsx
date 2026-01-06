import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import {
  useAlerts,
  useAcknowledgeAlert,
  useResolveAlert,
} from "@/hooks/useAlerts";
import {
  Bell,
  Loader2,
  AlertCircle,
  CheckCircle,
  Eye,
  CheckCheck,
} from "lucide-react";

function formatDate(dateString: string | null): string {
  if (!dateString) return "Never";
  const date = new Date(dateString);
  return date.toLocaleString();
}

function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return "Never";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return `${diffSecs}s ago`;
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

interface ServerAlertsTabProps {
  orgId: string;
  serverId: string;
}

export function ServerAlertsTab({ orgId, serverId }: ServerAlertsTabProps) {
  const toast = useToast();
  const { data: alertsData, isLoading } = useAlerts(orgId);
  const acknowledgeAlert = useAcknowledgeAlert(orgId);
  const resolveAlert = useResolveAlert(orgId);

  const allAlerts = alertsData?.data?.alerts ?? [];
  const serverAlerts = allAlerts.filter(
    (alert) =>
      alert.title?.toLowerCase().includes(serverId.toLowerCase()) ||
      alert.message?.toLowerCase().includes(serverId.toLowerCase()) ||
      alert.title?.toLowerCase().includes("server") ||
      alert.message?.toLowerCase().includes("cpu") ||
      alert.message?.toLowerCase().includes("memory") ||
      alert.message?.toLowerCase().includes("disk")
  );

  // If no server-specific alerts found, show recent alerts as context
  const displayAlerts =
    serverAlerts.length > 0 ? serverAlerts : allAlerts.slice(0, 10);

  const handleAcknowledge = async (alertId: string) => {
    try {
      await acknowledgeAlert.mutateAsync(alertId);
      toast.success("Alert acknowledged", "You've acknowledged this alert.");
    } catch {
      toast.error("Failed", "Could not acknowledge the alert.");
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      await resolveAlert.mutateAsync(alertId);
      toast.success("Alert resolved", "The alert has been marked as resolved.");
    } catch {
      toast.error("Failed", "Could not resolve the alert.");
    }
  };

  return (
    <section>
      <h2 className="text-lg font-bold text-foreground mb-4 flex items-center">
        <Bell className="h-5 w-5 mr-2 text-primary" />
        Alert History
      </h2>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : displayAlerts.length === 0 ? (
        <Card className="p-8 text-center">
          <CheckCircle className="h-10 w-10 text-success mx-auto mb-3" />
          <h3 className="text-base font-bold text-foreground mb-1">
            No Alerts
          </h3>
          <p className="text-sm text-muted-foreground">
            There are no alerts in your organization yet. Alerts will appear
            here when triggered.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {serverAlerts.length === 0 && allAlerts.length > 0 && (
            <div className="mb-4 p-3 bg-muted/50 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground">
                No alerts specific to this server. Showing recent organization
                alerts:
              </p>
            </div>
          )}
          {displayAlerts.map((alert) => (
            <Card key={alert.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg shrink-0 ${
                      alert.severity === "critical"
                        ? "bg-destructive/10"
                        : alert.severity === "warning"
                          ? "bg-warning/10"
                          : "bg-info/10"
                    }`}
                  >
                    <AlertCircle
                      className={`h-4 w-4 ${
                        alert.severity === "critical"
                          ? "text-destructive"
                          : alert.severity === "warning"
                            ? "text-warning"
                            : "text-info"
                      }`}
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-foreground">
                      {alert.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {alert.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Triggered {formatRelativeTime(alert.fired_at)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge
                    status={
                      alert.status === "resolved"
                        ? "success"
                        : alert.status === "acknowledged"
                          ? "warning"
                          : "error"
                    }
                  >
                    {alert.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground capitalize">
                    {alert.severity}
                  </span>
                </div>
              </div>

              {/* Action buttons for non-resolved alerts */}
              {alert.status !== "resolved" && (
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
                  {alert.status === "open" && (
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      disabled={acknowledgeAlert.isPending}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg bg-warning/10 text-warning hover:bg-warning/20 transition-colors disabled:opacity-50"
                    >
                      {acknowledgeAlert.isPending ? (
                        <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                      ) : (
                        <Eye className="h-3 w-3 mr-1.5" />
                      )}
                      Acknowledge
                    </button>
                  )}
                  <button
                    onClick={() => handleResolve(alert.id)}
                    disabled={resolveAlert.isPending}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {resolveAlert.isPending ? (
                      <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                    ) : (
                      <CheckCheck className="h-3 w-3 mr-1.5" />
                    )}
                    Resolve
                  </button>
                </div>
              )}

              {/* Resolved timestamp */}
              {alert.resolved_at && (
                <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                  Resolved: {formatDate(alert.resolved_at)}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
