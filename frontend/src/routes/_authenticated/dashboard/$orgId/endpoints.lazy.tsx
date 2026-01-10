import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import {
  useEndpoints,
  useCreateEndpoint,
  useDeleteEndpoint,
} from "@/hooks/useEndpoints";
import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { Globe, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Endpoint } from "@/lib/types/monitoring.types";

export const Route = createLazyFileRoute(
  "/_authenticated/dashboard/$orgId/endpoints"
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { orgId } = Route.useParams();
  const { data, isLoading, refetch } = useEndpoints(orgId);
  const createMutation = useCreateEndpoint(orgId);
  const deleteMutation = useDeleteEndpoint(orgId);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Endpoint | null>(null);

  // Form state
  const [formData, setFormData] = useState<{
    name: string;
    url: string;
    method: "GET" | "POST" | "PUT" | "DELETE" | "HEAD";
    expectedStatus: number;
    checkInterval: number;
    timeout: number;
  }>({
    name: "",
    url: "",
    method: "GET",
    expectedStatus: 200,
    checkInterval: 60,
    timeout: 10,
  });

  const endpoints = data?.data?.endpoints || [];

  const handleCreate = async () => {
    if (!formData.name || !formData.url) return;

    await createMutation.mutateAsync({
      name: formData.name,
      url: formData.url,
      method: formData.method,
      expectedStatus: formData.expectedStatus,
      checkInterval: formData.checkInterval,
      timeout: formData.timeout,
    });

    setIsCreateModalOpen(false);
    setFormData({
      name: "",
      url: "",
      method: "GET",
      expectedStatus: 200,
      checkInterval: 60,
      timeout: 10,
    });
    refetch();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
    refetch();
  };

  const getStatusBadge = (endpoint: Endpoint) => {
    if (!endpoint.last_checked_at) {
      return <Badge status="neutral">Pending</Badge>;
    }
    // Status is determined by the last check - for now, we show based on last_checked_at
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
          <h1 className="text-2xl font-bold text-foreground">Endpoints</h1>
          <p className="text-sm text-muted-foreground">
            Monitor HTTP endpoints and APIs
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Endpoint
        </Button>
      </div>

      {/* Endpoints List */}
      {endpoints.length === 0 ? (
        <div className="text-center flex flex-col items-center justify-center h-[60vh]">
          <div className="p-4 rounded-full bg-muted w-fit mx-auto mb-4">
            <Globe className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">
            No endpoints monitored
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Add your first endpoint to start monitoring its availability.
          </p>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Endpoint
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {endpoints.map((endpoint) => (
            <Link
              key={endpoint.id}
              to={`/dashboard/$orgId/endpoint/$endpointId`}
              params={{ orgId, endpointId: endpoint.id }}
            >
              <Card className="p-4 hover:border-primary/50 transition-colors cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-lg bg-primary/10 text-primary">
                      <Globe className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                          {endpoint.name}
                        </h3>
                        <Badge status="info">{endpoint.method}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground font-mono truncate max-w-md">
                        {endpoint.url}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-muted-foreground">
                        Last checked
                      </p>
                      <p className="text-sm text-foreground">
                        {formatLastChecked(endpoint.last_checked_at)}
                      </p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-muted-foreground">Interval</p>
                      <p className="text-sm text-foreground">
                        {endpoint.check_interval}s
                      </p>
                    </div>
                    {getStatusBadge(endpoint)}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDeleteTarget(endpoint);
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
        title="Add Endpoint"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              isLoading={createMutation.isPending}
              disabled={!formData.name || !formData.url}
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
              placeholder="My API"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              URL
            </label>
            <Input
              placeholder="https://api.example.com/health"
              value={formData.url}
              onChange={(e) =>
                setFormData({ ...formData, url: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Method
              </label>
              <Select
                value={formData.method}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    method: e.target.value as
                      | "GET"
                      | "POST"
                      | "PUT"
                      | "DELETE"
                      | "HEAD",
                  })
                }
                options={[
                  { value: "GET", label: "GET" },
                  { value: "POST", label: "POST" },
                  { value: "PUT", label: "PUT" },
                  { value: "DELETE", label: "DELETE" },
                  { value: "HEAD", label: "HEAD" },
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Expected Status
              </label>
              <Input
                type="number"
                value={formData.expectedStatus}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    expectedStatus: parseInt(e.target.value),
                  })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Check Interval (seconds)
              </label>
              <Input
                type="number"
                value={formData.checkInterval}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    checkInterval: parseInt(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Timeout (seconds)
              </label>
              <Input
                type="number"
                value={formData.timeout}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    timeout: parseInt(e.target.value),
                  })
                }
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Endpoint"
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
          This will stop all monitoring for this endpoint.
        </p>
      </Modal>
    </div>
  );
}
