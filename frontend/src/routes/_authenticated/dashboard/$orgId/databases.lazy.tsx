import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import {
  useDatabases,
  useCreateDatabase,
  useDeleteDatabase,
} from "@/hooks/useDatabases";
import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { Database, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { DatabaseTarget } from "@/lib/types/monitoring.types";

export const Route = createLazyFileRoute(
  "/_authenticated/dashboard/$orgId/databases"
)({
  component: RouteComponent,
});

const dbTypeIcons: Record<string, string> = {
  postgresql: "🐘",
  mysql: "🐬",
  mongodb: "🍃",
  redis: "🔴",
  mssql: "🔷",
};

const dbTypeLabels: Record<string, string> = {
  postgresql: "PostgreSQL",
  mysql: "MySQL",
  mongodb: "MongoDB",
  redis: "Redis",
  mssql: "SQL Server",
};

function RouteComponent() {
  const { orgId } = Route.useParams();
  const { data, isLoading, refetch } = useDatabases(orgId);
  const createMutation = useCreateDatabase(orgId);
  const deleteMutation = useDeleteDatabase(orgId);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DatabaseTarget | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    type: "postgresql" as
      | "postgresql"
      | "mysql"
      | "mongodb"
      | "redis"
      | "mssql",
    connectionUrl: "",
  });

  const databases = data?.data?.databases || [];

  // Placeholder hints for connection strings
  const connectionPlaceholders: Record<string, string> = {
    postgresql: "postgresql://user:password@host:5432/dbname",
    mysql: "mysql://user:password@host:3306/dbname",
    mongodb: "mongodb+srv://user:password@cluster.mongodb.net/dbname",
    redis: "redis://:password@host:6379",
    mssql: "mssql://user:password@host:1433/dbname",
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.connectionUrl) return;

    await createMutation.mutateAsync({
      name: formData.name,
      type: formData.type,
      connectionUrl: formData.connectionUrl,
    });

    setIsCreateModalOpen(false);
    setFormData({
      name: "",
      type: "postgresql",
      connectionUrl: "",
    });
    refetch();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
    refetch();
  };

  const handleTypeChange = (
    type: "postgresql" | "mysql" | "mongodb" | "redis" | "mssql"
  ) => {
    setFormData({ ...formData, type });
  };

  const getStatusBadge = (db: DatabaseTarget) => {
    if (!db.last_checked_at) {
      return <Badge status="neutral">Pending</Badge>;
    }
    return <Badge status="success">Monitored</Badge>;
  };

  const formatLastChecked = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);

    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
    if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Databases</h1>
          <p className="text-sm text-muted-foreground">
            Monitor database connectivity and health
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Database
        </Button>
      </div>

      {/* Databases List */}
      {databases.length === 0 ? (
        <div className="text-center flex flex-col items-center justify-center h-[60vh]">
          <div className="p-4 rounded-full bg-muted w-fit mx-auto mb-4">
            <Database className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">
            No databases monitored
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Add your first database to start monitoring its availability.
          </p>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Database
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {databases.map((db) => (
            <Link
              key={db.id}
              to={`/dashboard/$orgId/database/$database`}
              params={{ orgId, database: db.id }}
            >
              <Card className="p-4 hover:border-primary/50 transition-colors cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-lg bg-primary/10 text-2xl">
                      {dbTypeIcons[db.db_type] || "🗄️"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                          {db.name}
                        </h3>
                        <Badge status="info">
                          {dbTypeLabels[db.db_type] || db.db_type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-muted-foreground">
                        Last checked
                      </p>
                      <p className="text-sm text-foreground">
                        {formatLastChecked(db.last_checked_at)}
                      </p>
                    </div>
                    {getStatusBadge(db)}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDeleteTarget(db);
                      }}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add Database"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              isLoading={createMutation.isPending}
              disabled={!formData.name || !formData.connectionUrl}
            >
              Create
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Name
            </label>
            <Input
              placeholder="Production DB"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Type
            </label>
            <Select
              value={formData.type}
              onChange={(e) =>
                handleTypeChange(
                  e.target.value as
                    | "postgresql"
                    | "mysql"
                    | "mongodb"
                    | "redis"
                    | "mssql"
                )
              }
              options={[
                { value: "postgresql", label: "PostgreSQL" },
                { value: "mysql", label: "MySQL" },
                { value: "mongodb", label: "MongoDB" },
                { value: "redis", label: "Redis" },
                { value: "mssql", label: "MSSQL Server" },
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Connection URL
            </label>
            <Input
              type="password"
              placeholder={connectionPlaceholders[formData.type]}
              value={formData.connectionUrl}
              onChange={(e) =>
                setFormData({ ...formData, connectionUrl: e.target.value })
              }
            />
            <p className="text-xs text-muted-foreground mt-1">
              Credentials are encrypted before storage
            </p>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Database"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              isLoading={deleteMutation.isPending}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-foreground">
          Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
          This will stop all monitoring for this database.
        </p>
      </Modal>
    </div>
  );
}
