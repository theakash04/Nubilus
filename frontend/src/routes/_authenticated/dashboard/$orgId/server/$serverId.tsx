import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import {
  ServerOverviewTab,
  ServerDetailsTab,
  ServerSettingsTab,
  ServerAlertsTab,
} from "@/components/server";
import {
  useServer,
  useServerMetrics,
  useServerSettings,
  useUpdateServerSettings,
} from "@/hooks/useServers";
import { useAlerts } from "@/hooks/useAlerts";
import { isServerOnline } from "@/hooks/useDashboardStats";
import { useOrganization } from "@/hooks/useOrganization";
import {
  Link,
  useBlocker,
  useNavigate,
  createFileRoute,
} from "@tanstack/react-router";
import {
  ArrowLeft,
  Loader2,
  Server,
  Info,
  Clock,
  Tag,
  AlertTriangle,
} from "lucide-react";

import { useState, useEffect, useMemo } from "react";
import { useSearch } from "@tanstack/react-router";
import z from "zod";

type TabType = "overview" | "details" | "alerts" | "settings";

export const Route = createFileRoute(
  "/_authenticated/dashboard/$orgId/server/$serverId"
)({
  component: RouteComponent,
  validateSearch: z.object({
    tab: z.enum(["overview", "details", "alerts", "settings"]).optional(),
  }),
});

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

function RouteComponent() {
  const { orgId, serverId } = Route.useParams();
  const { tab } = useSearch({
    from: "/_authenticated/dashboard/$orgId/server/$serverId",
  });

  const navigate = useNavigate();
  const activeTab = tab || "overview";

  const setActiveTab = (newTab: TabType) => {
    navigate({
      to: "/dashboard/$orgId/server/$serverId",
      params: { orgId, serverId },
      search: { tab: newTab },
      replace: true,
    });
  };

  const { data: serverData, isLoading: serverLoading } = useServer(
    orgId,
    serverId
  );
  const { data: metricsData, isLoading: metricsLoading } = useServerMetrics(
    orgId,
    serverId,
    { limit: 1 }
  );
  const { data: orgData } = useOrganization(orgId);
  const offlineThreshold =
    orgData?.data?.server_offline_threshold_seconds ?? 300;

  const server = serverData?.data;
  const latestMetric = metricsData?.data?.metrics?.[0];
  const online = server ? isServerOnline(server, offlineThreshold) : false;

  const toast = useToast();

  // Settings state management
  const { data: settingsData, isLoading: settingsLoading } = useServerSettings(
    orgId,
    serverId
  );
  const updateSettings = useUpdateServerSettings(orgId, serverId);

  // Check for active alerts to show indicator on tab
  const { data: alertsData } = useAlerts(orgId);
  const activeAlertsCount = (alertsData?.data?.alerts ?? []).filter(
    (alert) => alert.status !== "resolved"
  ).length;

  const [originalSettings, setOriginalSettings] = useState({
    alerts_enabled: true,
    cpu_threshold: "90",
    memory_threshold: "90",
    disk_threshold: "85",
    load_threshold: "10",
    alert_cooldown_minutes: "5",
  });
  const [settingsForm, setSettingsForm] = useState({
    alerts_enabled: true,
    cpu_threshold: "90",
    memory_threshold: "90",
    disk_threshold: "85",
    load_threshold: "10",
    alert_cooldown_minutes: "5",
  });

  useEffect(() => {
    if (settingsData?.data) {
      const s = settingsData.data;
      const loadedSettings = {
        alerts_enabled: s.alerts_enabled ?? true,
        cpu_threshold: String(s.cpu_threshold ?? 90),
        memory_threshold: String(s.memory_threshold ?? 90),
        disk_threshold: String(s.disk_threshold ?? 85),
        load_threshold: String(s.load_threshold ?? 10),
        alert_cooldown_minutes: String(s.alert_cooldown_minutes ?? 5),
      };
      setOriginalSettings(loadedSettings);
      setSettingsForm(loadedSettings);
    }
  }, [settingsData]);

  const hasActualChanges = useMemo(() => {
    return (
      settingsForm.alerts_enabled !== originalSettings.alerts_enabled ||
      settingsForm.cpu_threshold !== originalSettings.cpu_threshold ||
      settingsForm.memory_threshold !== originalSettings.memory_threshold ||
      settingsForm.disk_threshold !== originalSettings.disk_threshold ||
      settingsForm.load_threshold !== originalSettings.load_threshold ||
      settingsForm.alert_cooldown_minutes !==
        originalSettings.alert_cooldown_minutes
    );
  }, [settingsForm, originalSettings]);

  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const blocker = useBlocker({ condition: hasActualChanges });

  useEffect(() => {
    if (blocker.status === "blocked") {
      setShowUnsavedModal(true);
    }
  }, [blocker.status]);

  const handleSettingsChange = (field: string, value: string | boolean) => {
    setSettingsForm((prev) => ({ ...prev, [field]: value }));
  };

  const clamp = (val: number, min: number, max: number) =>
    Math.min(Math.max(val, min), max);

  const handleSaveSettings = async () => {
    const payload = {
      alerts_enabled: settingsForm.alerts_enabled,
      cpu_threshold: clamp(
        parseFloat(settingsForm.cpu_threshold) || 90,
        0,
        100
      ),
      memory_threshold: clamp(
        parseFloat(settingsForm.memory_threshold) || 90,
        0,
        100
      ),
      disk_threshold: clamp(
        parseFloat(settingsForm.disk_threshold) || 85,
        0,
        100
      ),
      load_threshold: clamp(
        parseFloat(settingsForm.load_threshold) || 10,
        0,
        100
      ),
      alert_cooldown_minutes: clamp(
        parseInt(settingsForm.alert_cooldown_minutes) || 5,
        1,
        1440
      ),
    };
    try {
      await updateSettings.mutateAsync(payload);
      const newSettings = {
        alerts_enabled: payload.alerts_enabled,
        cpu_threshold: String(payload.cpu_threshold),
        memory_threshold: String(payload.memory_threshold),
        disk_threshold: String(payload.disk_threshold),
        load_threshold: String(payload.load_threshold),
        alert_cooldown_minutes: String(payload.alert_cooldown_minutes),
      };
      setSettingsForm(newSettings);
      setOriginalSettings(newSettings);
      toast.success(
        "Settings saved",
        "Alert settings have been updated successfully."
      );
    } catch {
      toast.error("Failed to save", "There was an error saving your settings.");
    }
  };

  const handleDiscardChanges = () => {
    setSettingsForm(originalSettings);
    setShowUnsavedModal(false);
    if (blocker.status === "blocked") {
      blocker.proceed?.();
    }
  };

  const handleStayOnPage = () => {
    setShowUnsavedModal(false);
    if (blocker.status === "blocked") {
      blocker.reset?.();
    }
  };

  if (serverLoading) {
    return (
      <div className="flex items-center justify-center py-12 h-full">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!server) {
    return (
      <div className="flex flex-col items-center justify-center pb-12 h-full">
        <Server className="h-12 w-12 text-slate-400 mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">
          Server Not Found
        </h2>
        <p className="text-muted-foreground mb-4">
          The requested server could not be found.
        </p>
        <Link
          to="/dashboard/$orgId/servers"
          params={{ orgId }}
          className="text-primary hover:opacity-80 flex items-center justify-center gap-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Servers
        </Link>
      </div>
    );
  }

  const tabs: { id: TabType; label: string; hasIndicator?: boolean }[] = [
    { id: "overview", label: "Overview" },
    { id: "details", label: "Details" },
    { id: "alerts", label: "Alerts", hasIndicator: activeAlertsCount > 0 },
    { id: "settings", label: "Settings" },
  ];

  return (
    <>
      {/* Header */}
      <div className="bg-background/95 backdrop-blur-sm -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-2 lg:px-8 py-2 mb-8 transition-colors duration-200 border-b border-border">
        <div className=" mx-auto">
          <Link
            to="/dashboard/$orgId/servers"
            params={{ orgId }}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Servers
          </Link>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div
                  className={`p-2 rounded-lg ${online ? "bg-emerald-500/10" : "bg-muted"}`}
                >
                  <Server
                    className={`h-6 w-6 ${online ? "text-emerald-500" : "text-muted-foreground"}`}
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    {server.name}
                  </h1>
                  <p className="text-sm text-muted-foreground font-mono">
                    {server.hostname}
                    {server.ip_address && ` • ${server.ip_address}`}
                  </p>
                </div>
                <Badge status={online ? "success" : "neutral"}>
                  {online ? "Online" : "Offline"}
                </Badge>
              </div>
            </div>

            {/* Quick Info Pills */}
            <div className="flex flex-wrap gap-2">
              {server.os_type && (
                <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-muted text-muted-foreground">
                  <Info className="h-3 w-3 mr-1.5" />
                  {server.os_type} {server.os_version}
                </span>
              )}
              {server.agent_version && (
                <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary">
                  Agent v{server.agent_version}
                </span>
              )}
              <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-muted text-muted-foreground">
                <Clock className="h-3 w-3 mr-1.5" />
                {formatRelativeTime(server.last_seen_at)}
              </span>
            </div>
          </div>

          {/* Tags */}
          {server.tags && server.tags.length > 0 && (
            <div className="flex items-center gap-2 mt-4">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-wrap gap-1.5">
                {server.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="mt-6">
            <nav className="-mb-px flex space-x-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer
                    ${
                      activeTab === tab.id
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                    }
                  `}
                >
                  <span className="relative">
                    {tab.label}
                    {tab.hasIndicator && (
                      <span className="absolute -top-1 -right-2 w-2 h-2 bg-destructive rounded-full" />
                    )}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-8">
        {activeTab === "overview" && (
          <ServerOverviewTab
            orgId={orgId}
            serverId={serverId}
            latestMetric={latestMetric}
            metricsLoading={metricsLoading}
          />
        )}

        {activeTab === "details" && (
          <ServerDetailsTab server={server} online={online} />
        )}

        {activeTab === "alerts" && (
          <ServerAlertsTab orgId={orgId} serverId={serverId} />
        )}

        {activeTab === "settings" && (
          <ServerSettingsTab
            settingsForm={settingsForm}
            settingsLoading={settingsLoading}
            hasActualChanges={hasActualChanges}
            isSaving={updateSettings.isPending}
            onSettingsChange={handleSettingsChange}
            onSaveSettings={handleSaveSettings}
          />
        )}
      </div>

      {/* Unsaved Changes Modal */}
      <Modal
        isOpen={showUnsavedModal}
        onClose={handleStayOnPage}
        title="Unsaved Changes"
        footer={
          <>
            <button
              onClick={handleStayOnPage}
              className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
            >
              Stay on Page
            </button>
            <button
              onClick={handleDiscardChanges}
              className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity"
            >
              Discard Changes
            </button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-warning/10">
            <AlertTriangle className="h-5 w-5 text-warning" />
          </div>
          <div>
            <p className="text-sm text-foreground">
              You have unsaved changes to your alert settings.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              If you leave this page, your changes will be lost.
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
}
