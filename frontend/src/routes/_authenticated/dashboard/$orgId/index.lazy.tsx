import { EndpointsStatusCard } from "@/components/EndpointsStatusCard";
import { ResourceUsageChart } from "@/components/ResourceUsageChart";
import { RecentAlertsCard } from "@/components/RecentAlertsCard";
import { ServersStatusCard } from "@/components/ServersStatusCard";
import Sparkline from "@/components/SparkLine";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { createLazyFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  CloudLightning,
  Database,
  RefreshCw,
  Server,
} from "lucide-react";

export const Route = createLazyFileRoute("/_authenticated/dashboard/$orgId/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { orgId } = Route.useParams();
  const { stats, isLoading, refetch, systemStatus, sparklines } =
    useDashboardStats(orgId);

  const statusConfig = {
    operational: {
      label: "System Operational",
      bgClass: "bg-emerald-100 dark:bg-emerald-900/30",
      textClass: "text-emerald-800 dark:text-emerald-400",
      dotClass: "bg-emerald-500",
    },
    degraded: {
      label: "Degraded Performance",
      bgClass: "bg-amber-100 dark:bg-amber-900/30",
      textClass: "text-amber-800 dark:text-amber-400",
      dotClass: "bg-amber-500",
    },
    outage: {
      label: "System Outage",
      bgClass: "bg-rose-100 dark:bg-rose-900/30",
      textClass: "text-rose-800 dark:text-rose-400",
      dotClass: "bg-rose-500",
    },
  };

  const currentStatus = statusConfig[systemStatus];

  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Dashboard
            </h1>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${currentStatus.bgClass} ${currentStatus.textClass}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${currentStatus.dotClass} mr-1.5 animate-pulse`}
              ></span>
              {currentStatus.label}
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Last updated: Just now
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="secondary"
            size="sm"
            className="hidden sm:flex cursor-pointer ring-0"
            disabled={isLoading}
            onClick={refetch}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />{" "}
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="p-5 flex items-center justify-between border-l-4 border-l-primary-500">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 mr-4">
              <Server className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Servers
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats.onlineServers}/{stats.totalServers}
              </p>
            </div>
          </div>
          <Sparkline data={sparklines.servers} color="#8b5cf6" />
        </Card>

        <Card className="p-5 flex items-center justify-between border-l-4 border-l-emerald-500">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 mr-4">
              <CloudLightning className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Endpoints
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats.healthyEndpoints}/{stats.totalEndpoints}
              </p>
            </div>
          </div>
          <Sparkline data={sparklines.endpoints} color="#10b981" />
        </Card>

        <Card className="p-5 flex items-center justify-between border-l-4 border-l-blue-500">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 mr-4">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Databases
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats.connectedDatabases}/{stats.databaseTargets}
              </p>
            </div>
          </div>
          <Sparkline data={sparklines.databases} color="#3b82f6" />
        </Card>

        <Card className="p-5 flex items-center justify-between border-l-4 border-l-amber-500">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 mr-4">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Active Alerts
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats.activeAlerts}
              </p>
            </div>
          </div>
          <Sparkline data={sparklines.alerts} color="#f59e0b" />
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Resource Usage Chart - Full Width on lg */}
        <div className="lg:col-span-2">
          <ResourceUsageChart orgId={orgId} />
        </div>

        {/* Recent Alerts */}
        <div className="lg:col-span-1">
          <RecentAlertsCard orgId={orgId} limit={4} />
        </div>
      </div>

      {/* Status Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ServersStatusCard orgId={orgId} limit={5} />
        <EndpointsStatusCard orgId={orgId} limit={5} />
      </div>
    </>
  );
}
