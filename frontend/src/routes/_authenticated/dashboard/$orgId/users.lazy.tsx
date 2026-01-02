import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useOrganization } from "@/hooks/useOrganization";
import { createLazyFileRoute } from "@tanstack/react-router";
import { Check, Mail, Shield, Trash2, UserPlus } from "lucide-react";
import { useState } from "react";

export const Route = createLazyFileRoute(
  "/_authenticated/dashboard/$orgId/users"
)({
  component: UsersPage,
});

interface Permissions {
  read: boolean;
  write: boolean;
  manage: boolean;
}

interface TeamUser {
  id: string;
  name: string;
  email: string;
  permissions: Permissions;
  status: "active" | "inactive" | "pending";
  lastLogin: string;
}

function UsersPage() {
  const { orgId } = Route.useParams();
  const { data: orgData } = useOrganization(orgId);
  const currentOrganization = orgData?.data;

  // Mock Data & State
  const [teamUsers, setTeamUsers] = useState<TeamUser[]>([
    {
      id: "1",
      name: "Alice Smith",
      email: "alice@example.com",
      permissions: { read: true, write: true, manage: true },
      status: "active",
      lastLogin: "2 hours ago",
    },
    {
      id: "2",
      name: "Bob Jones",
      email: "bob@example.com",
      permissions: { read: true, write: true, manage: false },
      status: "active",
      lastLogin: "1 day ago",
    },
    {
      id: "3",
      name: "Charlie Brown",
      email: "charlie@example.com",
      permissions: { read: true, write: false, manage: false },
      status: "pending",
      lastLogin: "Never",
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [permissions, setPermissions] = useState<Permissions>({
    read: true,
    write: false,
    manage: false,
  });

  const addTeamUser = (
    name: string,
    email: string,
    permissions: Permissions
  ) => {
    const newUser: TeamUser = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      email,
      permissions,
      status: "pending",
      lastLogin: "Never",
    };
    setTeamUsers([...teamUsers, newUser]);
  };

  const removeTeamUser = (id: string) => {
    setTeamUsers(teamUsers.filter((user) => user.id !== id));
  };

  const handleCreate = () => {
    if (!name || !email) return;
    addTeamUser(name, email, permissions);
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setPermissions({ read: true, write: false, manage: false });
  };

  const togglePermission = (key: keyof Permissions) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Organization Members
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage access to <strong>{currentOrganization?.name}</strong>.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" /> Invite Member
        </Button>
      </div>

      <Card className="overflow-hidden border border-border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Permissions
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {teamUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20">
                          {user.name.charAt(0)}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-foreground">
                          {user.name}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center">
                          <Mail className="w-3 h-3 mr-1" /> {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      status={user.status === "active" ? "success" : "neutral"}
                    >
                      {user.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                          user.permissions.read
                            ? "bg-muted text-muted-foreground border-border"
                            : "opacity-30 border-dashed border-border text-muted-foreground"
                        }`}
                      >
                        Read
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                          user.permissions.write
                            ? "bg-info/10 text-info border-info/20"
                            : "opacity-30 border-dashed border-border text-muted-foreground"
                        }`}
                      >
                        Write
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                          user.permissions.manage
                            ? "bg-primary/10 text-primary border-primary/20"
                            : "opacity-30 border-dashed border-border text-muted-foreground"
                        }`}
                      >
                        Manage
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {user.lastLogin}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => removeTeamUser(user.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-2 rounded-full hover:bg-muted"
                      title="Remove user"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Invite Team Member"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!name || !email}>
              Send Invitation
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Full Name"
            placeholder="Alice Smith"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Email Address"
            type="email"
            placeholder="alice@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="mt-6">
            <label className="block text-sm font-medium text-foreground mb-3">
              Permissions
            </label>
            <div className="space-y-3 bg-muted/30 p-4 rounded-lg border border-border">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => togglePermission("read")}
              >
                <div>
                  <div className="text-sm font-medium text-foreground flex items-center">
                    Read Access
                    <span className="ml-2 text-xs text-muted-foreground bg-muted px-1.5 rounded">
                      Default
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Can view dashboards, metrics, and logs.
                  </p>
                </div>
                <div
                  className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                    permissions.read
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-input"
                  }`}
                >
                  {permissions.read && <Check className="w-3.5 h-3.5" />}
                </div>
              </div>

              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => togglePermission("write")}
              >
                <div>
                  <div className="text-sm font-medium text-foreground">
                    Write Access
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Can add/edit servers, endpoints, and alerts.
                  </p>
                </div>
                <div
                  className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                    permissions.write
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-input"
                  }`}
                >
                  {permissions.write && <Check className="w-3.5 h-3.5" />}
                </div>
              </div>

              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => togglePermission("manage")}
              >
                <div>
                  <div className="text-sm font-medium text-foreground flex items-center">
                    <Shield className="w-3 h-3 mr-1 text-primary" />
                    Manage Access
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Can manage users, billing, and org settings.
                  </p>
                </div>
                <div
                  className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                    permissions.manage
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-input"
                  }`}
                >
                  {permissions.manage && <Check className="w-3.5 h-3.5" />}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
