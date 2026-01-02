import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ServerMetricsChart } from "@/components/ServerMetricsChart";
import { useServer, useServerMetrics } from "@/hooks/useServers";
import { isServerOnline } from "@/hooks/useDashboardStats";
import { useOrganization } from "@/hooks/useOrganization";
import { createLazyFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowLeft,
  Cpu,
  HardDrive,
  Loader2,
  Network,
  Server,
  ArrowDown,
  ArrowUp,
  Info,
  Clock,
  Tag,
} from "lucide-react";

import { useState } from "react";

export const Route = createLazyFileRoute(
  "/_authenticated/dashboard/$orgId/server/$serverId"
)({
  component: RouteComponent,
});

function formatBytes(bytes: string | number): string {
  const num = typeof bytes === "string" ? parseInt(bytes, 10) : bytes;
  if (isNaN(num) || num === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(num) / Math.log(k));
  return parseFloat((num / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

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

function RouteComponent() {
  const { orgId, serverId } = Route.useParams();
  const [activeTab, setActiveTab] = useState<"overview" | "details">(
    "overview"
  );

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
              {(["overview", "details"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`
                    whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors cursor-pointer
                    ${
                      activeTab === tab
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                    }
                  `}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-8">
        {activeTab === "overview" && (
          <>
            {/* Metrics Section */}
            <section>
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center">
                <Activity className="h-5 w-5 mr-2 text-primary" />
                Live Metrics
              </h2>

              {metricsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : !latestMetric ? (
                <Card className="p-8 text-center">
                  <Activity className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-base font-bold text-foreground mb-1">
                    Waiting for Metrics
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    The agent has not sent any metrics data yet.
                  </p>
                </Card>
              ) : (
                <>
                  {/* Primary Resource Usage */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <Card className="p-5 relative overflow-hidden">
                      <div
                        className="absolute inset-0 bg-linear-to-r from-primary-500/10 to-transparent"
                        style={{
                          width: `${Math.min(latestMetric.cpu_usage, 100)}%`,
                        }}
                      />
                      <div className="relative">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <Cpu className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium text-muted-foreground">
                              CPU
                            </span>
                          </div>
                          <span className="text-2xl font-bold text-foreground">
                            {latestMetric.cpu_usage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-1.5">
                          <div
                            className="bg-primary h-1.5 rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(latestMetric.cpu_usage, 100)}%`,
                            }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {latestMetric.cpu_count} cores • Load:{" "}
                          {latestMetric.load_average_1m.toFixed(2)}
                        </p>
                      </div>
                    </Card>

                    <Card className="p-5 relative overflow-hidden">
                      <div
                        className="absolute inset-0 bg-linear-to-r from-blue-500/10 to-transparent"
                        style={{
                          width: `${Math.min(latestMetric.memory_usage, 100)}%`,
                        }}
                      />
                      <div className="relative">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <Activity className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-medium text-muted-foreground">
                              Memory
                            </span>
                          </div>
                          <span className="text-2xl font-bold text-foreground">
                            {latestMetric.memory_usage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-1.5">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(latestMetric.memory_usage, 100)}%`,
                            }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatBytes(latestMetric.memory_used)} /{" "}
                          {formatBytes(latestMetric.memory_total)}
                        </p>
                      </div>
                    </Card>

                    <Card className="p-5 relative overflow-hidden">
                      <div
                        className="absolute inset-0 bg-linear-to-r from-emerald-500/10 to-transparent"
                        style={{
                          width: `${Math.min(latestMetric.disk_usage, 100)}%`,
                        }}
                      />
                      <div className="relative">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <HardDrive className="h-4 w-4 text-emerald-500" />
                            <span className="text-sm font-medium text-muted-foreground">
                              Disk
                            </span>
                          </div>
                          <span className="text-2xl font-bold text-foreground">
                            {latestMetric.disk_usage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-1.5">
                          <div
                            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(latestMetric.disk_usage, 100)}%`,
                            }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatBytes(latestMetric.disk_used)} /{" "}
                          {formatBytes(latestMetric.disk_total)}
                        </p>
                      </div>
                    </Card>
                  </div>

                  {/* I/O Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="p-5">
                      <div className="flex items-center space-x-2 mb-4">
                        <HardDrive className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">
                          Disk I/O
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-emerald-500/10">
                            <ArrowDown className="h-4 w-4 text-emerald-500" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Read
                            </p>
                            <p className="text-lg font-bold text-foreground">
                              {formatBytes(latestMetric.disk_read_bytes)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-blue-500/10">
                            <ArrowUp className="h-4 w-4 text-blue-500" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Write
                            </p>
                            <p className="text-lg font-bold text-foreground">
                              {formatBytes(latestMetric.disk_write_bytes)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-5">
                      <div className="flex items-center space-x-2 mb-4">
                        <Network className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">
                          Network I/O
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-emerald-500/10">
                            <ArrowDown className="h-4 w-4 text-emerald-500" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">In</p>
                            <p className="text-lg font-bold text-foreground">
                              {formatBytes(latestMetric.network_in)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-blue-500/10">
                            <ArrowUp className="h-4 w-4 text-blue-500" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Out</p>
                            <p className="text-lg font-bold text-foreground">
                              {formatBytes(latestMetric.network_out)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Last Updated */}
                  <p className="text-xs text-muted-foreground text-right mt-3">
                    Last updated: {formatDate(latestMetric.time)}
                  </p>
                </>
              )}
            </section>

            {/* Historical Metrics Chart */}
            <section>
              <ServerMetricsChart orgId={orgId} serverId={serverId} />
            </section>
          </>
        )}

        {activeTab === "details" && (
          <section>
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center">
              <Info className="h-5 w-5 mr-2 text-primary" />
              Server Details
            </h2>
            <Card className="p-5">
              <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Server ID
                  </dt>
                  <dd className="text-sm text-foreground font-mono mt-1 truncate">
                    {server.id}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Hostname
                  </dt>
                  <dd className="text-sm text-foreground font-mono mt-1">
                    {server.hostname}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    IP Address
                  </dt>
                  <dd className="text-sm text-foreground font-mono mt-1">
                    {server.ip_address || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Status
                  </dt>
                  <dd className="mt-1">
                    <Badge status={online ? "success" : "neutral"}>
                      {online ? "Online" : "Offline"}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Operating System
                  </dt>
                  <dd className="text-sm text-foreground mt-1">
                    {server.os_type || "—"} {server.os_version}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Agent Version
                  </dt>
                  <dd className="text-sm text-foreground font-mono mt-1">
                    {server.agent_version || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Created
                  </dt>
                  <dd className="text-sm text-foreground mt-1">
                    {formatDate(server.created_at)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Last Seen
                  </dt>
                  <dd className="text-sm text-foreground mt-1">
                    {formatDate(server.last_seen_at)}
                  </dd>
                </div>
              </dl>
            </Card>
          </section>
        )}
      </div>
    </>
  );
}
