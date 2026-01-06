import { Card } from "@/components/ui/Card";
import { ServerMetricsChart } from "@/components/ServerMetricsChart";
import { useServerSettings } from "@/hooks/useServers";
import type { ServerMetric } from "@/lib/types/monitoring.types";
import {
  Activity,
  Cpu,
  HardDrive,
  Loader2,
  Network,
  ArrowDown,
  ArrowUp,
} from "lucide-react";

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

interface ServerOverviewTabProps {
  orgId: string;
  serverId: string;
  latestMetric: ServerMetric | undefined;
  metricsLoading: boolean;
}

export function ServerOverviewTab({
  orgId,
  serverId,
  latestMetric,
  metricsLoading,
}: ServerOverviewTabProps) {
  const { data: settingsData } = useServerSettings(orgId, serverId);
  const thresholds = settingsData?.data
    ? {
        cpu: settingsData.data.cpu_threshold ?? 90,
        memory: settingsData.data.memory_threshold ?? 90,
        disk: settingsData.data.disk_threshold ?? 85,
      }
    : undefined;

  return (
    <>
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
                      <p className="text-xs text-muted-foreground">Read</p>
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
                      <p className="text-xs text-muted-foreground">Write</p>
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
  );
}
