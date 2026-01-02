import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import {
  useCreateInvite,
  useInvites,
  useMembers,
  useOrganization,
  useSuspendMember,
  useUpdateMemberPermissions,
} from "@/hooks/useOrganization";
import type { OrgMember } from "@/lib/types/org.types";
import { createLazyFileRoute } from "@tanstack/react-router";
import {
  Check,
  Clock,
  Edit2,
  Mail,
  Shield,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
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

type TabType = "members" | "invites";

function UsersPage() {
  const { orgId } = Route.useParams();
  const { data: orgData } = useOrganization(orgId);
  const currentOrganization = orgData?.data;
  const [status, setStatus] = useState<"active" | "suspended">("active");
  const { data: invitesData } = useInvites(orgId);
  const inviteMutation = useCreateInvite(orgId);
  const suspendMutation = useSuspendMember(orgId);
  const updatePermissionsMutation = useUpdateMemberPermissions(orgId);
  const { data: teamUsers } = useMembers(orgId, status);
  const toast = useToast();

  const memebers = teamUsers?.data?.members || [];
  const invites = invitesData?.data?.invites || [];

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>("members");

  // Modal states
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<OrgMember | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [permissions, setPermissions] = useState<Permissions>({
    read: true,
    write: false,
    manage: false,
  });

  // Open edit modal with member data
  const openEditModal = (member: OrgMember) => {
    setSelectedMember(member);
    setPermissions({
      read: member.permissions.includes("read"),
      write: member.permissions.includes("write"),
      manage: member.permissions.includes("manage"),
    });
    setIsEditModalOpen(true);
  };

  // Open suspend modal
  const openSuspendModal = (member: OrgMember) => {
    setSelectedMember(member);
    setIsSuspendModalOpen(true);
  };

  const handleSuspend = () => {
    if (!selectedMember) return;
    suspendMutation.mutate(selectedMember.id, {
      onSuccess: () => {
        setIsSuspendModalOpen(false);
        setSelectedMember(null);
        toast.success(
          "Member suspended",
          `${selectedMember.name} has been suspended.`
        );
      },
      onError: (error: any) => {
        setIsSuspendModalOpen(false);
        setSelectedMember(null);
        toast.error(
          "Failed to suspend",
          error?.response?.data?.message || "Something went wrong."
        );
      },
    });
  };

  const handleUpdatePermissions = () => {
    if (!selectedMember) return;
    const permissionArray: string[] = [];
    if (permissions.read) permissionArray.push("read");
    if (permissions.write) permissionArray.push("write");
    if (permissions.manage) permissionArray.push("manage");

    updatePermissionsMutation.mutate(
      { userId: selectedMember.id, permissions: permissionArray },
      {
        onSuccess: () => {
          setIsEditModalOpen(false);
          setSelectedMember(null);
          resetForm();
          toast.success(
            "Permissions updated",
            `${selectedMember.name}'s permissions have been updated.`
          );
        },
        onError: (error: any) => {
          toast.error(
            "Failed to update",
            error?.response?.data?.message || "Something went wrong."
          );
        },
      }
    );
  };

  const handleCreate = () => {
    if (!name || !email) return;

    const permissionArray: string[] = [];
    if (permissions.read) permissionArray.push("read");
    if (permissions.write) permissionArray.push("write");
    if (permissions.manage) permissionArray.push("manage");

    inviteMutation.mutate(
      {
        email,
        fullName: name,
        permissions: permissionArray,
      },
      {
        onSuccess: () => {
          setIsInviteModalOpen(false);
          resetForm();
          toast.success("Invitation sent", `Invite sent to ${email}.`);
        },
        onError: (error: any) => {
          toast.error(
            "Failed to invite",
            error?.response?.data?.message || "Something went wrong."
          );
        },
      }
    );
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setPermissions({ read: true, write: false, manage: false });
  };

  const togglePermission = (key: keyof Permissions) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderPermissionBadges = (perms: string[] | Permissions) => {
    const permObj = Array.isArray(perms)
      ? {
          read: perms.includes("read"),
          write: perms.includes("write"),
          manage: perms.includes("manage"),
        }
      : perms;

    return (
      <div className="flex space-x-2">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${permObj.read ? "bg-muted text-muted-foreground border-border" : "opacity-30 border-dashed border-border text-muted-foreground"}`}
        >
          Read
        </span>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${permObj.write ? "bg-info/10 text-info border-info/20" : "opacity-30 border-dashed border-border text-muted-foreground"}`}
        >
          Write
        </span>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${permObj.manage ? "bg-primary/10 text-primary border-primary/20" : "opacity-30 border-dashed border-border text-muted-foreground"}`}
        >
          Manage
        </span>
      </div>
    );
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
        <Button onClick={() => setIsInviteModalOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" /> Invite Member
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-muted/50 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab("members")}
          className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-all cursor-pointer ${
            activeTab === "members"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="h-4 w-4 mr-2" />
          Members
          <span className="ml-2 bg-muted px-2 py-0.5 rounded-full text-xs">
            {memebers.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("invites")}
          className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-all cursor-pointer ${
            activeTab === "invites"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Clock className="h-4 w-4 mr-2" />
          Pending Invites
          <span className="ml-2 bg-muted px-2 py-0.5 rounded-full text-xs">
            {invites.length}
          </span>
        </button>
      </div>

      {/* Members Tab */}
      {activeTab === "members" && (
        <Card className="overflow-hidden border border-border">
          {/* Status Filter */}
          <div className="px-6 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Filter by status:
            </span>
            <div className="flex space-x-1 bg-muted p-1 rounded-lg">
              <button
                onClick={() => setStatus("active")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  status === "active"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setStatus("suspended")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  status === "suspended"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Suspended
              </button>
            </div>
          </div>
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
                {memebers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20">
                          {user.name.charAt(0)}
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
                        status={
                          user.status === "active" ? "success" : "neutral"
                        }
                      >
                        {user.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderPermissionBadges(user.permissions)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {user.last_login}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-1">
                      <button
                        onClick={() => openEditModal(user)}
                        className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-full hover:bg-muted cursor-pointer"
                        title="Edit permissions"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openSuspendModal(user)}
                        disabled={suspendMutation.isPending}
                        className="text-muted-foreground hover:text-warning transition-colors p-2 rounded-full hover:bg-muted disabled:opacity-50 cursor-pointer"
                        title="Suspend member"
                      >
                        <UserMinus className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {memebers.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-muted-foreground"
                    >
                      No members yet. Invite someone to get started!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Invites Tab */}
      {activeTab === "invites" && (
        <Card className="overflow-hidden border border-border">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Invited User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Permissions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Expires
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {invites.map((invite: any) => (
                  <tr
                    key={invite.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center text-warning font-bold border border-warning/20">
                          {invite.full_name?.charAt(0) ||
                            invite.email?.charAt(0) ||
                            "?"}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-foreground">
                            {invite.full_name || "Pending"}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center">
                            <Mail className="w-3 h-3 mr-1" /> {invite.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge status={invite.accepted ? "success" : "warning"}>
                        {invite.accepted ? "Accepted" : "Pending"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderPermissionBadges(invite.permissions || [])}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {invite.expires_at
                        ? new Date(invite.expires_at).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                ))}
                {invites.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-muted-foreground"
                    >
                      No pending invites.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Invite Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Team Member"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!name || !email}
              isLoading={inviteMutation.isPending}
            >
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
                  className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${permissions.read ? "bg-primary border-primary text-primary-foreground" : "border-input"}`}
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
                  className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${permissions.write ? "bg-primary border-primary text-primary-foreground" : "border-input"}`}
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
                  className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${permissions.manage ? "bg-primary border-primary text-primary-foreground" : "border-input"}`}
                >
                  {permissions.manage && <Check className="w-3.5 h-3.5" />}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit Permissions Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedMember(null);
          resetForm();
        }}
        title={`Edit ${selectedMember?.name}'s Permissions`}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedMember(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdatePermissions}
              isLoading={updatePermissionsMutation.isPending}
            >
              Save Changes
            </Button>
          </>
        }
      >
        <div className="space-y-3 bg-muted/30 p-4 rounded-lg border border-border">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => togglePermission("read")}
          >
            <div>
              <div className="text-sm font-medium text-foreground">
                Read Access
              </div>
              <p className="text-xs text-muted-foreground">
                Can view dashboards, metrics, and logs.
              </p>
            </div>
            <div
              className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${permissions.read ? "bg-primary border-primary text-primary-foreground" : "border-input"}`}
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
              className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${permissions.write ? "bg-primary border-primary text-primary-foreground" : "border-input"}`}
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
              className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${permissions.manage ? "bg-primary border-primary text-primary-foreground" : "border-input"}`}
            >
              {permissions.manage && <Check className="w-3.5 h-3.5" />}
            </div>
          </div>
        </div>
      </Modal>

      {/* Suspend Confirmation Modal */}
      <Modal
        isOpen={isSuspendModalOpen}
        onClose={() => {
          setIsSuspendModalOpen(false);
          setSelectedMember(null);
        }}
        title="Suspend Member"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setIsSuspendModalOpen(false);
                setSelectedMember(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleSuspend}
              isLoading={suspendMutation.isPending}
            >
              Suspend
            </Button>
          </>
        }
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4">
            <UserMinus className="h-8 w-8 text-warning" />
          </div>
          <p className="text-foreground">
            Are you sure you want to suspend{" "}
            <strong>{selectedMember?.name}</strong>?
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            They will lose access to this organization until reactivated.
          </p>
        </div>
      </Modal>
    </>
  );
}
