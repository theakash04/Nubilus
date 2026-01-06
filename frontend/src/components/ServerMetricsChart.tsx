import { Card } from "@/components/ui/Card";
import { useServerMetrics } from "@/hooks/useServers";
import { ChevronDown, Clock, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ServerMetricsChartProps {
  orgId: string;
  serverId: string;
}

const METRIC_CONFIG = {
  cpu: {
    key: "cpu",
    label: "CPU",
    color: "#8b5cf6",
    unit: "%",
    maxValue: 100,
  },
  memory: {
    key: "memory",
    label: "Memory",
    color: "#3b82f6",
    unit: "%",
    maxValue: 100,
  },
  disk: {
    key: "disk",
    label: "Disk",
    color: "#10b981",
    unit: "%",
    maxValue: 100,
  },
  load1m: {
    key: "load1m",
    label: "Load 1m",
    color: "#f59e0b",
    unit: "",
    maxValue: null,
  },
  load5m: {
    key: "load5m",
    label: "Load 5m",
    color: "#ef4444",
    unit: "",
    maxValue: null,
  },
  networkIn: {
    key: "networkIn",
    label: "Net In",
    color: "#06b6d4",
    unit: " MB",
    maxValue: null,
  },
  networkOut: {
    key: "networkOut",
    label: "Net Out",
    color: "#ec4899",
    unit: " MB",
    maxValue: null,
  },
  diskRead: {
    key: "diskRead",
    label: "Disk Read",
    color: "#14b8a6",
    unit: " MB",
    maxValue: null,
  },
  diskWrite: {
    key: "diskWrite",
    label: "Disk Write",
    color: "#f97316",
    unit: " MB",
    maxValue: null,
  },
} as const;

type MetricKey = keyof typeof METRIC_CONFIG;

const TIME_RANGES = {
  "6h": { label: "6 Hours", hours: 6, limit: 720 },
  "24h": { label: "24 Hours", hours: 24, limit: 2880 },
  "7d": { label: "7 Days", hours: 24 * 7, limit: 20160 },
  "30d": { label: "30 Days", hours: 24 * 30, limit: 86400 },
} as const;

type TimeRangeKey = keyof typeof TIME_RANGES;

export function ServerMetricsChart({
  orgId,
  serverId,
}: ServerMetricsChartProps) {
  const [metricsDropdownOpen, setMetricsDropdownOpen] = useState(false);
  const [timeRangeDropdownOpen, setTimeRangeDropdownOpen] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] =
    useState<TimeRangeKey>("6h");

  const [enabledMetrics, setEnabledMetrics] = useState<Set<MetricKey>>(
    new Set(["cpu", "memory", "disk"])
  );

  const timeRangeParams = useMemo(() => {
    const range = TIME_RANGES[selectedTimeRange];
    const now = new Date();
    const from = new Date(now.getTime() - range.hours * 60 * 60 * 1000);
    return {
      from: from.toISOString(),
      to: now.toISOString(),
      limit: range.limit,
    };
  }, [selectedTimeRange]);

  const { data: metricsData, isLoading } = useServerMetrics(
    orgId,
    serverId,
    timeRangeParams
  );

  const toggleMetric = (metric: MetricKey) => {
    setEnabledMetrics((prev) => {
      const next = new Set(prev);
      if (next.has(metric)) {
        if (next.size > 1) {
          next.delete(metric);
        }
      } else {
        next.add(metric);
      }
      return next;
    });
  };

  // Transform metrics data and detect spikes
  const { chartData } = useMemo(() => {
    const metrics = metricsData?.data?.metrics || [];
    const range = TIME_RANGES[selectedTimeRange];

    const formatTime = (date: Date) => {
      if (range.hours <= 24) {
        return date.toLocaleTimeString("en-US", {
          hour: "numeric",
          hour12: true,
        });
      } else if (range.hours <= 24 * 7) {
        return date.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });
      } else {
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      }
    };

    const now = new Date();

    const getLocalBucketStart = (date: Date, intervalHours: number) => {
      const d = new Date(date);
      if (intervalHours >= 24) {
        d.setHours(0, 0, 0, 0);
      } else {
        const hours = d.getHours();
        const alignedHour = Math.floor(hours / intervalHours) * intervalHours;
        d.setHours(alignedHour, 0, 0, 0);
      }
      return d;
    };

    let intervalHours: number;
    let bucketCount: number;

    if (range.hours <= 6) {
      intervalHours = 1;
      bucketCount = 7;
    } else if (range.hours <= 24) {
      intervalHours = 3;
      bucketCount = 9;
    } else if (range.hours <= 24 * 7) {
      intervalHours = 24;
      bucketCount = 8;
    } else {
      intervalHours = 72;
      bucketCount = 11;
    }

    const intervalMs = intervalHours * 60 * 60 * 1000;

    const buckets: Map<
      number,
      {
        time: string;
        fullTime: string;
        timestamp: number;
        cpu: number;
        memory: number;
        disk: number;
        load1m: number;
        load5m: number;
        networkIn: number;
        networkOut: number;
        diskRead: number;
        diskWrite: number;
        count: number;
        cpuMax: number;
        memoryMax: number;
        diskMax: number;
      }
    > = new Map();

    const currentBucketStart = getLocalBucketStart(now, intervalHours);

    for (let i = 0; i < bucketCount; i++) {
      const bucketTime = new Date(
        currentBucketStart.getTime() - i * intervalMs
      );
      const bucketKey = bucketTime.getTime();

      buckets.set(bucketKey, {
        time: formatTime(bucketTime),
        fullTime: bucketTime.toLocaleString(),
        timestamp: bucketTime.getTime(),
        cpu: 0,
        memory: 0,
        disk: 0,
        load1m: 0,
        load5m: 0,
        networkIn: 0,
        networkOut: 0,
        diskRead: 0,
        diskWrite: 0,
        count: 0,
        cpuMax: 0,
        memoryMax: 0,
        diskMax: 0,
      });
    }

    const sortedMetrics = [...metrics].sort(
      (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
    );

    interface MetricWithDeltas {
      time: string;
      cpu_usage: number;
      memory_usage: number;
      disk_usage: number;
      load_average_1m: number;
      load_average_5m: number;
      networkInDelta: number;
      networkOutDelta: number;
      diskReadDelta: number;
      diskWriteDelta: number;
    }

    const metricsWithDeltas: MetricWithDeltas[] = [];

    for (let i = 0; i < sortedMetrics.length; i++) {
      const current = sortedMetrics[i];
      const prev = i > 0 ? sortedMetrics[i - 1] : null;

      let networkInDelta = 0;
      let networkOutDelta = 0;
      let diskReadDelta = 0;
      let diskWriteDelta = 0;

      if (prev) {
        const netInCurr = Number(current.network_in) || 0;
        const netInPrev = Number(prev.network_in) || 0;
        const netOutCurr = Number(current.network_out) || 0;
        const netOutPrev = Number(prev.network_out) || 0;
        const diskReadCurr = Number(current.disk_read_bytes) || 0;
        const diskReadPrev = Number(prev.disk_read_bytes) || 0;
        const diskWriteCurr = Number(current.disk_write_bytes) || 0;
        const diskWritePrev = Number(prev.disk_write_bytes) || 0;

        if (netInCurr >= netInPrev) networkInDelta = netInCurr - netInPrev;
        if (netOutCurr >= netOutPrev) networkOutDelta = netOutCurr - netOutPrev;
        if (diskReadCurr >= diskReadPrev)
          diskReadDelta = diskReadCurr - diskReadPrev;
        if (diskWriteCurr >= diskWritePrev)
          diskWriteDelta = diskWriteCurr - diskWritePrev;
      }

      metricsWithDeltas.push({
        time: current.time,
        cpu_usage: current.cpu_usage || 0,
        memory_usage: current.memory_usage || 0,
        disk_usage: current.disk_usage || 0,
        load_average_1m: current.load_average_1m || 0,
        load_average_5m: current.load_average_5m || 0,
        networkInDelta,
        networkOutDelta,
        diskReadDelta,
        diskWriteDelta,
      });
    }

    metricsWithDeltas.forEach((m) => {
      const metricDate = new Date(m.time);
      const metricBucketStart = getLocalBucketStart(metricDate, intervalHours);
      const bucketKey = metricBucketStart.getTime();

      if (buckets.has(bucketKey)) {
        const bucket = buckets.get(bucketKey)!;
        bucket.cpu += m.cpu_usage;
        bucket.memory += m.memory_usage;
        bucket.disk += m.disk_usage;
        bucket.load1m += m.load_average_1m;
        bucket.load5m += m.load_average_5m;
        bucket.networkIn += m.networkInDelta / (1024 * 1024);
        bucket.networkOut += m.networkOutDelta / (1024 * 1024);
        bucket.diskRead += m.diskReadDelta / (1024 * 1024);
        bucket.diskWrite += m.diskWriteDelta / (1024 * 1024);
        bucket.count += 1;

        // Track max values for spike detection
        bucket.cpuMax = Math.max(bucket.cpuMax, m.cpu_usage);
        bucket.memoryMax = Math.max(bucket.memoryMax, m.memory_usage);
        bucket.diskMax = Math.max(bucket.diskMax, m.disk_usage);
      }
    });

    const data = Array.from(buckets.values())
      .sort((a, b) => a.timestamp - b.timestamp)
      .map((bucket) => {
        const cpuVal =
          bucket.count > 0 ? Math.round(bucket.cpu / bucket.count) : 0;
        const memVal =
          bucket.count > 0 ? Math.round(bucket.memory / bucket.count) : 0;
        const diskVal =
          bucket.count > 0 ? Math.round(bucket.disk / bucket.count) : 0;

        return {
          time: bucket.time,
          fullTime: bucket.fullTime,
          cpu: cpuVal,
          memory: memVal,
          disk: diskVal,
          load1m:
            bucket.count > 0
              ? Number((bucket.load1m / bucket.count).toFixed(2))
              : 0,
          load5m:
            bucket.count > 0
              ? Number((bucket.load5m / bucket.count).toFixed(2))
              : 0,
          networkIn: Number(bucket.networkIn.toFixed(1)),
          networkOut: Number(bucket.networkOut.toFixed(1)),
          diskRead: Number(bucket.diskRead.toFixed(1)),
          diskWrite: Number(bucket.diskWrite.toFixed(1)),
        };
      });

    return { chartData: data };
  }, [metricsData, selectedTimeRange]);

  const yAxisDomain = useMemo(() => {
    const percentMetrics: MetricKey[] = ["cpu", "memory", "disk"];
    const hasPercentMetrics = [...enabledMetrics].some((m) =>
      percentMetrics.includes(m)
    );

    if (
      hasPercentMetrics &&
      enabledMetrics.size ===
        [...enabledMetrics].filter((m) => percentMetrics.includes(m)).length
    ) {
      return [0, 100] as [number, number];
    }

    return ["auto", "auto"] as ["auto", "auto"];
  }, [enabledMetrics]);

  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h3 className="text-lg font-bold text-foreground">
          Historical Metrics
        </h3>
        <div className="flex items-center flex-wrap gap-2">
          {/* Time Range Selector */}
          <div className="relative">
            <button
              onClick={() => {
                setTimeRangeDropdownOpen(!timeRangeDropdownOpen);
                setMetricsDropdownOpen(false);
              }}
              className="flex items-center space-x-2 px-3 py-1.5 bg-muted rounded-lg text-sm text-muted-foreground hover:bg-accent transition-colors cursor-pointer"
            >
              <Clock className="h-4 w-4" />
              <span>{TIME_RANGES[selectedTimeRange].label}</span>
              <ChevronDown className="h-4 w-4" />
            </button>

            {timeRangeDropdownOpen && (
              <div className="absolute right-0 mt-2 w-36 bg-popover rounded-lg shadow-lg border border-border z-50 py-1">
                {Object.entries(TIME_RANGES).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedTimeRange(key as TimeRangeKey);
                      setTimeRangeDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-accent cursor-pointer ${
                      key === selectedTimeRange
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground"
                    }`}
                  >
                    {config.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Metrics Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setMetricsDropdownOpen(!metricsDropdownOpen);
                setTimeRangeDropdownOpen(false);
              }}
              className="flex items-center space-x-2 px-3 py-1.5 bg-muted rounded-lg text-sm text-muted-foreground hover:bg-accent transition-colors cursor-pointer"
            >
              <span>Metrics ({enabledMetrics.size})</span>
              <ChevronDown className="h-4 w-4" />
            </button>

            {metricsDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-popover rounded-lg shadow-lg border border-border z-50 py-2">
                {Object.entries(METRIC_CONFIG).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => toggleMetric(key as MetricKey)}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-accent flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center space-x-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: config.color }}
                      />
                      <span className="text-muted-foreground">
                        {config.label}
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={enabledMetrics.has(key as MetricKey)}
                      onChange={() => {}}
                      className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {Object.entries(METRIC_CONFIG)
          .filter(([key]) => enabledMetrics.has(key as MetricKey))
          .map(([key, config]) => (
            <button
              key={key}
              onClick={() => toggleMetric(key as MetricKey)}
              className="flex items-center text-xs text-muted-foreground hover:opacity-75 transition-opacity cursor-pointer"
            >
              <span
                className="w-2 h-2 rounded-full mr-1"
                style={{ backgroundColor: config.color }}
              />
              {config.label}
            </button>
          ))}
      </div>

      {/* Chart */}
      <div className="h-64 md:h-80 w-full">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            No metrics data available for this time range.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                {Object.entries(METRIC_CONFIG).map(([key, config]) => (
                  <linearGradient
                    key={key}
                    id={`serverColor${key}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={config.color}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={config.color}
                      stopOpacity={0}
                    />
                  </linearGradient>
                ))}
              </defs>
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                dy={10}
                interval="preserveStartEnd"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                domain={yAxisDomain}
                tickFormatter={(value) => {
                  const percentMetrics: MetricKey[] = ["cpu", "memory", "disk"];
                  const hasPercent = [...enabledMetrics].some((m) =>
                    percentMetrics.includes(m)
                  );
                  return hasPercent &&
                    enabledMetrics.size ===
                      [...enabledMetrics].filter((m) =>
                        percentMetrics.includes(m)
                      ).length
                    ? `${value}%`
                    : `${value}`;
                }}
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
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    return payload[0].payload.fullTime;
                  }
                  return label;
                }}
                formatter={(value, name) => {
                  const config = Object.values(METRIC_CONFIG).find(
                    (c) => c.key === name
                  );
                  return [
                    `${value ?? 0}${config?.unit || ""}`,
                    config?.label || String(name),
                  ];
                }}
              />
              {Object.entries(METRIC_CONFIG)
                .filter(([key]) => enabledMetrics.has(key as MetricKey))
                .map(([key, config]) => (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={key}
                    name={key}
                    stroke={config.color}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill={`url(#serverColor${key})`}
                  />
                ))}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
