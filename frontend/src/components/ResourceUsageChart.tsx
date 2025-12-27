import { useState, useMemo } from "react";
import { useServers, useServerMetrics } from "@/hooks/useServers";
import { Card } from "@/components/ui/Card";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChevronDown, Server, Loader2 } from "lucide-react";

interface ResourceUsageChartProps {
  orgId: string;
}

export function ResourceUsageChart({ orgId }: ResourceUsageChartProps) {
  const { data: serversData, isLoading: serversLoading } = useServers(orgId);
  const servers = serversData?.data?.servers || [];

  // Default to first server
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Auto-select first server when data loads
  const activeServerId = selectedServerId || servers[0]?.id || null;

  const { data: metricsData, isLoading: metricsLoading } = useServerMetrics(
    orgId,
    activeServerId || ""
  );

  const selectedServer = servers.find((s) => s.id === activeServerId);

  // Transform metrics data for the chart
  const chartData = useMemo(() => {
    const metrics = metricsData?.data?.metrics || [];
    if (metrics.length === 0) {
      // Return placeholder if no data
      return [{ time: "No data", cpu: 0, ram: 0 }];
    }

    // Take last 24 data points, reversed to show oldest first
    return metrics
      .slice(0, 24)
      .reverse()
      .map((m) => {
        const date = new Date(m.timestamp);
        return {
          time: date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          cpu: Math.round(m.cpuUsage || 0),
          ram: Math.round(m.memoryUsage || 0),
        };
      });
  }, [metricsData]);

  const isLoading = serversLoading || metricsLoading;

  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Resource Usage
        </h3>
        <div className="flex items-center space-x-4">
          {/* Server Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              disabled={servers.length === 0}
            >
              <Server className="h-4 w-4" />
              <span className="max-w-[150px] truncate">
                {selectedServer?.name || "Select Server"}
              </span>
              <ChevronDown className="h-4 w-4" />
            </button>

            {dropdownOpen && servers.length > 0 && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-50 max-h-60 overflow-y-auto">
                {servers.map((server) => (
                  <button
                    key={server.id}
                    onClick={() => {
                      setSelectedServerId(server.id);
                      setDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between ${
                      server.id === activeServerId
                        ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
                        : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <span className="truncate">{server.name}</span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        server.status === "online"
                          ? "bg-emerald-500"
                          : "bg-slate-400"
                      }`}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="flex items-center space-x-2">
            <span className="flex items-center text-xs text-slate-500 dark:text-slate-400">
              <span className="w-2 h-2 rounded-full bg-primary-500 mr-1"></span>{" "}
              CPU
            </span>
            <span className="flex items-center text-xs text-slate-500 dark:text-slate-400">
              <span className="w-2 h-2 rounded-full bg-blue-500 mr-1"></span>{" "}
              RAM
            </span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 md:h-80 w-full">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : servers.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 dark:text-slate-400">
            No servers found. Add a server to see resource usage.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                  backgroundColor: "rgba(15, 23, 42, 0.95)",
                  color: "#f8fafc",
                  padding: "8px 12px",
                }}
                formatter={(value) => [`${value}%`, ""]}
              />
              <Area
                type="monotone"
                dataKey="cpu"
                name="CPU"
                stroke="#8b5cf6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCpu)"
              />
              <Area
                type="monotone"
                dataKey="ram"
                name="RAM"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRam)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
