import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import {
  useApiKeys,
  useCreateApiKey,
  useDeleteApiKey,
} from "@/hooks/useApiKeys";
import { createLazyFileRoute } from "@tanstack/react-router";
import { Copy, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

export const Route = createLazyFileRoute(
  "/_authenticated/dashboard/$orgId/keys"
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { orgId } = Route.useParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);

  // Use the API key hooks
  const { data: apiKeysData, isLoading, error } = useApiKeys(orgId);
  const createApiKeyMutation = useCreateApiKey(orgId);
  const deleteApiKeyMutation = useDeleteApiKey(orgId);

  const apiKeys = apiKeysData?.data?.keys ?? [];

  const handleCreate = () => {
    createApiKeyMutation.mutate(
      { name: keyName },
      {
        onSuccess: (data) => {
          setNewKey(data.data.key);
          setKeyName("");
        },
      }
    );
  };

  const handleDelete = (keyId: string) => {
    deleteApiKeyMutation.mutate(keyId);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setNewKey(null);
  };
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">API Keys</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Create Key
        </Button>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            Loading API keys...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-destructive">
            Failed to load API keys
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No API keys yet. Create one to get started.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Prefix
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {apiKeys.map((key) => (
                <tr
                  key={key.id}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                    {key.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-muted-foreground">
                    {key.key_prefix}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(key.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge status={key.is_active ? "success" : "error"}>
                      {key.is_active ? "Active" : "In-active"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="w-full flex items-center-safe justify-end">
                      <button
                        onClick={() => handleDelete(key.id)}
                        disabled={
                          deleteApiKeyMutation.isPending || !key.is_active
                        }
                        className="text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50 cursor-pointer flex  items-center justify-end gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Revoke</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={handleClose}
        title="Create API Key"
        footer={
          !newKey && (
            <>
              <Button variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!keyName || createApiKeyMutation.isPending}
              >
                {createApiKeyMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </>
          )
        }
      >
        {!newKey ? (
          <Input
            label="Key Name"
            placeholder="e.g. CI/CD Pipeline"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
          />
        ) : (
          <div className="space-y-4">
            <div className="bg-warning/10 p-3 rounded-md border border-warning/20 text-sm text-warning">
              Copy this key now. You won't be able to see it again.
            </div>
            <div className="flex space-x-2">
              <input
                readOnly
                value={newKey}
                className="flex-1 bg-muted/50 border border-input rounded-lg px-3 py-2 font-mono text-sm text-foreground focus:outline-none"
              />
              <Button
                onClick={() => navigator.clipboard.writeText(newKey)}
                variant="secondary"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <Button className="w-full" onClick={handleClose}>
              Done
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
