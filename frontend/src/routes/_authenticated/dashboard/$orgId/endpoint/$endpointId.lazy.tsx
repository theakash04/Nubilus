import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  useEndpoint,
  useEndpointChecks,
  useUpdateEndpoint,
  useEndpointSettings,
  useUpdateEndpointSettings,
} from "@/hooks/useEndpoints";
import { createLazyFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Globe,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  Activity,
  ExternalLink,
  Settings,
  Save,
  Bell,
  AlertTriangle,
} from "lucide-react";
import { useState, useEffect } from "react";

export const Route = createLazyFileRoute(
  "/_authenticated/dashboard/$orgId/endpoint/$endpointId"
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { orgId, endpointId } = Route.useParams();
  const { data: endpointData, isLoading: isLoadingEndpoint } = useEndpoint(
    orgId,
    endpointId
  );
  const { data: checksData, isLoading: isLoadingChecks } = useEndpointChecks(
    orgId,
    endpointId
  );

  const endpoint = endpointData?.data;
  const checks = checksData?.data?.checks || [];

  const updateMutation = useUpdateEndpoint(orgId);

  // Alert settings hooks
  const { data: alertSettingsData, isLoading: isLoadingAlertSettings } =
    useEndpointSettings(orgId, endpointId);
  const updateAlertSettings = useUpdateEndpointSettings(orgId, endpointId);

  // Editable settings state
  const [isEditing, setIsEditing] = useState(false);
  const [settings, setSettings] = useState({
    check_interval: endpoint?.check_interval || 60,
    timeout: endpoint?.timeout || 10,
  });

  // Sync settings when endpoint loads
  useEffect(() => {
    if (endpoint) {
      setSettings({
        check_interval: endpoint.check_interval,
        timeout: endpoint.timeout,
      });
    }
  }, [endpoint]);

  // Alert settings state
  const [alertSettings, setAlertSettings] = useState({
    alerts_enabled: true,
    alert_on_down: true,
    consecutive_failures_before_alert: 1,
    alert_cooldown_minutes: null as number | null,
  });
  const [originalAlertSettings, setOriginalAlertSettings] =
    useState(alertSettings);

  // Sync alert settings when data loads
  useEffect(() => {
    if (alertSettingsData?.data) {
      const s = alertSettingsData.data;
      const loaded = {
        alerts_enabled: s.alerts_enabled ?? true,
        alert_on_down: s.alert_on_down ?? true,
        consecutive_failures_before_alert:
          s.consecutive_failures_before_alert ?? 1,
        alert_cooldown_minutes: s.alert_cooldown_minutes ?? null,
      };
      setAlertSettings(loaded);
      setOriginalAlertSettings(loaded);
    }
  }, [alertSettingsData]);

  const hasAlertChanges =
    alertSettings.alerts_enabled !== originalAlertSettings.alerts_enabled ||
    alertSettings.alert_on_down !== originalAlertSettings.alert_on_down ||
    alertSettings.consecutive_failures_before_alert !==
      originalAlertSettings.consecutive_failures_before_alert ||
    alertSettings.alert_cooldown_minutes !==
      originalAlertSettings.alert_cooldown_minutes;

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  // Calculate stats from checks
  const successCount = checks.filter((c) => c.status_code === 200).length;
  const failureCount = checks.length - successCount;
  const uptimePercent =
    checks.length > 0 ? ((successCount / checks.length) * 100).toFixed(1) : "—";
  const avgResponseTime =
    checks.length > 0
      ? Math.round(
          checks.reduce((acc, c) => acc + (c.response_time || 0), 0) /
            checks.length
        )
      : 0;

  if (isLoadingEndpoint) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!endpoint) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-bold text-foreground mb-2">
          Endpoint not found
        </h3>
        <Link to={`/dashboard/$orgId/endpoints`} params={{ orgId }}>
          <Button variant="ghost">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Endpoints
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to={`/dashboard/$orgId/endpoints`} params={{ orgId }}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div className="p-3 rounded-lg bg-primary/10 text-primary">
            <Globe className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">
                {endpoint.name}
              </h1>
              <Badge status="info">{endpoint.method}</Badge>
            </div>
            <a
              href={endpoint.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground font-mono hover:text-primary transition-colors flex items-center gap-1"
            >
              {endpoint.url}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-success/10 text-success">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Uptime</p>
              <p className="text-2xl font-bold text-foreground">
                {uptimePercent}%
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-info/10 text-info">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Response</p>
              <p className="text-2xl font-bold text-foreground">
                {avgResponseTime}ms
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-success/10 text-success">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Successful</p>
              <p className="text-2xl font-bold text-foreground">
                {successCount}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Failed</p>
              <p className="text-2xl font-bold text-foreground">
                {failureCount}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Endpoint Settings */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration
          </h2>
          {!isEditing ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  if (endpoint) {
                    setSettings({
                      check_interval: endpoint.check_interval,
                      timeout: endpoint.timeout,
                    });
                  }
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                isLoading={updateMutation.isPending}
                onClick={async () => {
                  await updateMutation.mutateAsync({
                    endpointId,
                    data: settings,
                  });
                  setIsEditing(false);
                }}
              >
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Check Interval</p>
            {isEditing ? (
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  className="w-20"
                  value={settings.check_interval}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      check_interval: parseInt(e.target.value) || 60,
                    })
                  }
                />
                <span className="text-muted-foreground">seconds</span>
              </div>
            ) : (
              <p className="text-foreground font-medium">
                {endpoint.check_interval}s
              </p>
            )}
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Timeout</p>
            {isEditing ? (
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  className="w-20"
                  value={settings.timeout}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      timeout: parseInt(e.target.value) || 10,
                    })
                  }
                />
                <span className="text-muted-foreground">seconds</span>
              </div>
            ) : (
              <p className="text-foreground font-medium">{endpoint.timeout}s</p>
            )}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Expected Status</p>
            <p className="text-foreground font-medium">
              {endpoint.expected_status_code}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Last Checked</p>
            <p className="text-foreground font-medium">
              {formatDate(endpoint.last_checked_at)}
            </p>
          </div>
        </div>
      </Card>

      {/* Alert Settings */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alert Settings
          </h2>
        </div>

        {isLoadingAlertSettings ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Alerts Enabled Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-foreground">
                  Alerts Enabled
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Enable or disable alerts for this endpoint
                </p>
              </div>
              <button
                onClick={() =>
                  setAlertSettings({
                    ...alertSettings,
                    alerts_enabled: !alertSettings.alerts_enabled,
                  })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  alertSettings.alerts_enabled ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    alertSettings.alerts_enabled
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Alert on Down Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  Alert on Down
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Send alert when endpoint goes down
                </p>
              </div>
              <button
                onClick={() =>
                  setAlertSettings({
                    ...alertSettings,
                    alert_on_down: !alertSettings.alert_on_down,
                  })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  alertSettings.alert_on_down ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    alertSettings.alert_on_down
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <hr className="border-border" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Consecutive Failures */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Consecutive Failures Before Alert
                </label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  className="w-24"
                  value={alertSettings.consecutive_failures_before_alert}
                  onChange={(e) =>
                    setAlertSettings({
                      ...alertSettings,
                      consecutive_failures_before_alert:
                        parseInt(e.target.value) || 1,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Number of failures before triggering an alert
                </p>
              </div>

              {/* Alert Cooldown */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <Clock className="h-4 w-4 inline mr-2 text-muted-foreground" />
                  Alert Cooldown (minutes)
                </label>
                <Input
                  type="number"
                  min="1"
                  max="1440"
                  className="w-24"
                  placeholder="None"
                  value={alertSettings.alert_cooldown_minutes ?? ""}
                  onChange={(e) =>
                    setAlertSettings({
                      ...alertSettings,
                      alert_cooldown_minutes: e.target.value
                        ? parseInt(e.target.value)
                        : null,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum time between repeated alerts (leave empty for no
                  limit)
                </p>
              </div>
            </div>

            <div className="pt-4">
              <Button
                onClick={async () => {
                  await updateAlertSettings.mutateAsync({
                    alerts_enabled: alertSettings.alerts_enabled,
                    alert_on_down: alertSettings.alert_on_down,
                    consecutive_failures_before_alert:
                      alertSettings.consecutive_failures_before_alert,
                    alert_cooldown_minutes:
                      alertSettings.alert_cooldown_minutes,
                  });
                  setOriginalAlertSettings(alertSettings);
                }}
                disabled={!hasAlertChanges || updateAlertSettings.isPending}
                isLoading={updateAlertSettings.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Alert Settings
              </Button>
              {hasAlertChanges && (
                <span className="ml-3 text-xs text-muted-foreground">
                  You have unsaved changes
                </span>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Recent Checks */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Recent Checks
        </h2>
        {isLoadingChecks ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : checks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No health checks recorded yet.
            </p>
            <p className="text-sm text-muted-foreground">
              Checks will appear here once monitoring starts.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {checks.slice(0, 20).map((check, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div className="flex items-center space-x-3">
                  {check.status_code === 200 ? (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {check.status_code}
                    </p>
                    {check.error_message && (
                      <p className="text-xs text-destructive">
                        {check.error_message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-muted-foreground">
                    {check.response_time ?? 0}ms
                  </span>
                  <span className="text-muted-foreground">
                    {formatTime(check.time)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
