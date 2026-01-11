import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  useDatabase,
  useDatabaseMetrics,
  useUpdateDatabase,
  useDatabaseSettings,
  useUpdateDatabaseSettings,
} from "@/hooks/useDatabases";
import { createLazyFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Loader2,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Settings,
  Save,
  Bell,
  AlertTriangle,
} from "lucide-react";
import { useState, useEffect } from "react";

export const Route = createLazyFileRoute(
  "/_authenticated/dashboard/$orgId/database/$database"
)({
  component: RouteComponent,
});

const dbTypeLabels: Record<string, string> = {
  postgresql: "PostgreSQL",
  mysql: "MySQL",
  mongodb: "MongoDB",
  redis: "Redis",
  mssql: "SQL Server",
};

const dbTypeIcons: Record<string, string> = {
  postgresql: "🐘",
  mysql: "🐬",
  mongodb: "🍃",
  redis: "🔴",
  mssql: "🔷",
};

function RouteComponent() {
  const { orgId, database: dbId } = Route.useParams();
  const { data: dbData, isLoading: isLoadingDb } = useDatabase(orgId, dbId);
  const { data: metricsData, isLoading: isLoadingMetrics } = useDatabaseMetrics(
    orgId,
    dbId
  );

  const database = dbData?.data;
  const metrics = metricsData?.data?.metrics || [];

  const updateMutation = useUpdateDatabase(orgId);

  // Alert settings hooks
  const { data: alertSettingsData, isLoading: isLoadingAlertSettings } =
    useDatabaseSettings(orgId, dbId);
  const updateAlertSettings = useUpdateDatabaseSettings(orgId, dbId);

  // Editable settings state
  const [isEditing, setIsEditing] = useState(false);
  const [settings, setSettings] = useState({
    check_interval: 60,
    timeout: 10,
  });

  // Sync settings when database loads
  useEffect(() => {
    if (database) {
      setSettings({
        check_interval: database.check_interval,
        timeout: database.timeout,
      });
    }
  }, [database]);

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

  const formatBytes = (bytes: number | null) => {
    if (bytes === null) return "—";
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    if (bytes === 0) return "0 B";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  // Calculate stats from metrics
  const healthyCount = metrics.filter((m) => m.is_healthy).length;
  const totalChecks = metrics.length;
  const uptimePercent =
    totalChecks > 0 ? ((healthyCount / totalChecks) * 100).toFixed(1) : "—";

  // Get latest metric for detailed stats
  const latestMetric = metrics.length > 0 ? metrics[0] : null;

  if (isLoadingDb) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!database) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-bold text-foreground mb-2">
          Database not found
        </h3>
        <Link to={`/dashboard/$orgId/databases`} params={{ orgId }}>
          <Button variant="ghost">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Databases
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
          <Link to={`/dashboard/$orgId/databases`} params={{ orgId }}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div className="p-3 rounded-lg bg-primary/10 text-2xl">
            {dbTypeIcons[database.db_type] || "🗄️"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">
                {database.name}
              </h1>
              <Badge status="info">
                {dbTypeLabels[database.db_type] || database.db_type}
              </Badge>
            </div>
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
              <p className="text-sm text-muted-foreground">Total Checks</p>
              <p className="text-2xl font-bold text-foreground">
                {totalChecks}
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
              <p className="text-sm text-muted-foreground">Healthy</p>
              <p className="text-2xl font-bold text-foreground">
                {healthyCount}
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
              <p className="text-sm text-muted-foreground">Unhealthy</p>
              <p className="text-2xl font-bold text-foreground">
                {totalChecks - healthyCount}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Latest Metrics Visualization */}
      {latestMetric && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Latest Metrics
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({formatTime(latestMetric.time)})
              </span>
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Note: Available metrics vary by database type. Some metrics may not
            be supported for all database engines.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {/* Connections */}
            {latestMetric.connection_count !== null && (
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">Connections</p>
                <p className="text-2xl font-bold text-foreground">
                  {latestMetric.connection_count}
                </p>
              </div>
            )}

            {/* Active Connections */}
            {latestMetric.active_connections !== null && (
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-success">
                  {latestMetric.active_connections}
                </p>
              </div>
            )}

            {/* Idle Connections */}
            {latestMetric.idle_connections !== null && (
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">Idle</p>
                <p className="text-2xl font-bold text-warning">
                  {latestMetric.idle_connections}
                </p>
              </div>
            )}

            {/* Queries/sec */}
            {latestMetric.queries_per_second !== null && (
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">Queries/sec</p>
                <p className="text-2xl font-bold text-foreground">
                  {latestMetric.queries_per_second.toFixed(1)}
                </p>
              </div>
            )}

            {/* Cache Hit Ratio */}
            {latestMetric.cache_hit_ratio !== null && (
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">Cache Hit</p>
                <p
                  className={`text-2xl font-bold ${latestMetric.cache_hit_ratio >= 90 ? "text-success" : latestMetric.cache_hit_ratio >= 70 ? "text-warning" : "text-destructive"}`}
                >
                  {latestMetric.cache_hit_ratio.toFixed(1)}%
                </p>
              </div>
            )}

            {/* DB Size */}
            {latestMetric.db_size_bytes !== null && (
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">DB Size</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatBytes(latestMetric.db_size_bytes)}
                </p>
              </div>
            )}

            {/* Table Count */}
            {latestMetric.table_count !== null && (
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">Tables/Keys</p>
                <p className="text-2xl font-bold text-foreground">
                  {latestMetric.table_count}
                </p>
              </div>
            )}

            {/* Slow Queries */}
            {latestMetric.slow_queries !== null && (
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">Slow Queries</p>
                <p
                  className={`text-2xl font-bold ${latestMetric.slow_queries === 0 ? "text-success" : "text-warning"}`}
                >
                  {latestMetric.slow_queries}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Database Settings */}
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
                  if (database) {
                    setSettings({
                      check_interval: database.check_interval,
                      timeout: database.timeout,
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
                    dbId,
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
            <p className="text-sm text-muted-foreground">Type</p>
            <div className="flex items-center gap-2">
              <Badge status="info">
                {dbTypeLabels[database.db_type] || database.db_type}
              </Badge>
              {database.is_healthy !== null && (
                <Badge status={database.is_healthy ? "success" : "error"}>
                  {database.is_healthy ? "Healthy" : "Unreachable"}
                </Badge>
              )}
            </div>
          </div>
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
                <span className="text-muted-foreground text-sm">sec</span>
              </div>
            ) : (
              <p className="text-foreground font-medium">
                {database.check_interval}s
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
                <span className="text-muted-foreground text-sm">sec</span>
              </div>
            ) : (
              <p className="text-foreground font-medium">{database.timeout}s</p>
            )}
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">Last Checked</p>
          <p className="text-foreground font-medium">
            {formatDate(database.last_checked_at)}
          </p>
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
                  Enable or disable alerts for this database
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
                  Send alert when database is unreachable
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

      {/* Recent Metrics */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Recent Checks
        </h2>
        {isLoadingMetrics ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : metrics.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No metrics recorded yet.</p>
            <p className="text-sm text-muted-foreground">
              Metrics will appear here once monitoring starts.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {metrics.slice(0, 20).map((metric, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div className="flex items-center space-x-3">
                  {metric.is_healthy ? (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {metric.is_healthy ? "Healthy" : "Unreachable"}
                    </p>
                    {metric.error_message && (
                      <p className="text-xs text-muted-foreground">
                        {metric.error_message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  {metric.query_time !== null && (
                    <span className="text-muted-foreground">
                      {metric.query_time}ms
                    </span>
                  )}
                  <span className="text-muted-foreground">
                    {formatTime(metric.time)}
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
