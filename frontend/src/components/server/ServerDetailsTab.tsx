import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { Server } from "@/lib/types/monitoring.types";
import { Info } from "lucide-react";

function formatDate(dateString: string | null): string {
  if (!dateString) return "Never";
  const date = new Date(dateString);
  return date.toLocaleString();
}

interface ServerDetailsTabProps {
  server: Server;
  online: boolean;
}

export function ServerDetailsTab({ server, online }: ServerDetailsTabProps) {
  return (
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
  );
}
