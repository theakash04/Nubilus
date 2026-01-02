import { EndpointsStatusCard } from "@/components/EndpointsStatusCard";
import { ResourceUsageChart } from "@/components/ResourceUsageChart";
import { ServersStatusCard } from "@/components/ServersStatusCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useOrganization } from "@/hooks/useOrganization";
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
  const { data: orgData } = useOrganization(orgId);
  const offlineThreshold =
    orgData?.data?.server_offline_threshold_seconds ?? 300;
  const { stats, isLoading, refetch, systemStatus } = useDashboardStats(
    orgId,
    offlineThreshold
  );

  const statusConfig = {
    operational: {
      label: "System Operational",
      bgClass: "bg-emerald-500/10",
      textClass: "text-emerald-500",
      dotClass: "bg-emerald-500",
    },
    degraded: {
      label: "Degraded Performance",
      bgClass: "bg-warning/10",
      textClass: "text-warning",
      dotClass: "bg-warning",
    },
    outage: {
      label: "System Outage",
      bgClass: "bg-destructive/10",
      textClass: "text-destructive",
      dotClass: "bg-destructive",
    },
  };

  const currentStatus = statusConfig[systemStatus];

  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${currentStatus.bgClass} ${currentStatus.textClass}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${currentStatus.dotClass} mr-1.5 animate-pulse`}
              ></span>
              {currentStatus.label}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
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
        {/* Servers Card */}
        <Card className="p-5 border-l-4 border-l-primary">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-primary/10 text-primary mr-4">
              <Server className="h-6 w-6" />
            </div>
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-1 md:grid-cols-2 gap-x-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Servers
              </p>
              <p className="text-2xl font-bold text-foreground row-start-2 sm:row-start-auto md:row-start-1 md:col-start-2 md:text-right">
                {stats.onlineServers}/{stats.totalServers}
              </p>
              <p
                className={`text-xs col-span-2 sm:col-span-1 md:col-span-2 ${stats.onlineServers === stats.totalServers ? "text-emerald-500" : "text-warning"}`}
              >
                {stats.totalServers === 0
                  ? "No servers"
                  : stats.onlineServers === stats.totalServers
                    ? "All online"
                    : `${stats.totalServers - stats.onlineServers} offline`}
              </p>
            </div>
          </div>
        </Card>

        {/* Endpoints Card */}
        <Card className="p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-500 mr-4">
              <CloudLightning className="h-6 w-6" />
            </div>
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-1 md:grid-cols-2 gap-x-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Endpoints
              </p>
              <p className="text-2xl font-bold text-foreground row-start-2 sm:row-start-auto md:row-start-1 md:col-start-2 md:text-right">
                {stats.healthyEndpoints}/{stats.totalEndpoints}
              </p>
              <p
                className={`text-xs col-span-2 sm:col-span-1 md:col-span-2 ${stats.healthyEndpoints === stats.totalEndpoints ? "text-emerald-500" : "text-destructive"}`}
              >
                {stats.totalEndpoints === 0
                  ? "No endpoints"
                  : stats.healthyEndpoints === stats.totalEndpoints
                    ? "All healthy"
                    : `${stats.totalEndpoints - stats.healthyEndpoints} unhealthy`}
              </p>
            </div>
          </div>
        </Card>

        {/* Databases Card */}
        <Card className="p-5 border-l-4 border-l-blue-500">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-500/10 text-blue-500 mr-4">
              <Database className="h-6 w-6" />
            </div>
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-1 md:grid-cols-2 gap-x-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Databases
              </p>
              <p className="text-2xl font-bold text-foreground row-start-2 sm:row-start-auto md:row-start-1 md:col-start-2 md:text-right">
                {stats.connectedDatabases}/{stats.databaseTargets}
              </p>
              <p
                className={`text-xs col-span-2 sm:col-span-1 md:col-span-2 ${stats.connectedDatabases === stats.databaseTargets ? "text-emerald-500" : "text-destructive"}`}
              >
                {stats.databaseTargets === 0
                  ? "No databases"
                  : stats.connectedDatabases === stats.databaseTargets
                    ? "All connected"
                    : `${stats.databaseTargets - stats.connectedDatabases} disconnected`}
              </p>
            </div>
          </div>
        </Card>

        {/* Alerts Card */}
        <Card className="p-5 border-l-4 border-l-warning">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-warning/10 text-warning mr-4">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-1 md:grid-cols-2 gap-x-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Active Alerts
              </p>
              <p className="text-2xl font-bold text-foreground row-start-2 sm:row-start-auto md:row-start-1 md:col-start-2 md:text-right">
                {stats.activeAlerts}
              </p>
              <p
                className={`text-xs col-span-2 sm:col-span-1 md:col-span-2 ${stats.activeAlerts === 0 ? "text-emerald-500" : "text-warning"}`}
              >
                {stats.activeAlerts === 0
                  ? "All clear"
                  : `${stats.activeAlerts} need attention`}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Resource Usage Chart - Full Width on lg */}
        <div className="lg:col-span-3">
          <ResourceUsageChart orgId={orgId} />
        </div>

        {/* Recent Alerts */}
        {/* <div className="lg:col-span-1">
          <RecentAlertsCard orgId={orgId} limit={4} />
        </div> */}
      </div>

      {/* Status Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ServersStatusCard orgId={orgId} limit={5} />
        <EndpointsStatusCard orgId={orgId} limit={5} />
      </div>
    </>
  );
}
