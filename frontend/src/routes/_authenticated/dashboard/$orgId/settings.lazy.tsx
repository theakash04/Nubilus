import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ComingSoon } from "@/components/ui/ComingSoon";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import {
  useOrganization,
  useOrgSettings,
  useUpdateOrgSettings,
} from "@/hooks/useOrganization";
import { usePermissions } from "@/hooks/usePermissions";
import { createLazyFileRoute } from "@tanstack/react-router";
import {
  Bell,
  Check,
  Clock,
  LinkIcon,
  Loader2,
  Lock,
  Mail,
  Plus,
  Save,
  Server,
  Shield,
  Users,
  Webhook,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export const Route = createLazyFileRoute(
  "/_authenticated/dashboard/$orgId/settings"
)({
  component: SettingsPage,
});

function SettingsPage() {
  const { orgId } = Route.useParams();
  const { data: orgData } = useOrganization(orgId);
  const { data: settingsData, isLoading } = useOrgSettings(orgId);
  const updateMutation = useUpdateOrgSettings(orgId);
  const toast = useToast();

  const settings = settingsData?.data;
  const org = orgData?.data;

  // Local state for form
  const [inviteExpiryInput, setInviteExpiryInput] = useState("72");
  const [defaultPermissions, setDefaultPermissions] = useState({
    read: true,
    write: false,
    manage: false,
  });
  const [require2fa, setRequire2fa] = useState(false);
  const [notifyNewMember, setNotifyNewMember] = useState(true);
  const [notifyServerOffline, setNotifyServerOffline] = useState(true);
  const [notifyAlertTriggered, setNotifyAlertTriggered] = useState(true);
  const [notificationEmails, setNotificationEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEnabled, setWebhookEnabled] = useState(false);

  // Validate expiry input
  const parsedExpiry = parseInt(inviteExpiryInput, 10);
  const isValidExpiry =
    !isNaN(parsedExpiry) && parsedExpiry >= 1 && parsedExpiry <= 720;

  // Sync form state with fetched settings
  useEffect(() => {
    if (settings) {
      setInviteExpiryInput(settings.invite_expiry_hours.toString());
      setDefaultPermissions({
        read: settings.default_member_permissions.includes("read"),
        write: settings.default_member_permissions.includes("write"),
        manage: settings.default_member_permissions.includes("manage"),
      });
      setRequire2fa(settings.require_2fa);
      setNotifyNewMember(settings.notify_on_new_member);
      setNotifyServerOffline(settings.notify_on_server_offline);
      setNotifyAlertTriggered(settings.notify_on_alert_triggered);
      setNotificationEmails(settings.notification_emails || []);
      setWebhookUrl(settings.webhook_url || "");
      setWebhookEnabled(settings.webhook_enabled);
    }
  }, [settings]);

  // Track if any changes were made
  const hasChanges = useMemo(() => {
    if (!settings) return false;

    const currentPerms = [
      defaultPermissions.read && "read",
      defaultPermissions.write && "write",
      defaultPermissions.manage && "manage",
    ].filter(Boolean) as string[];

    return (
      parsedExpiry !== settings.invite_expiry_hours ||
      JSON.stringify(currentPerms.sort()) !==
        JSON.stringify([...settings.default_member_permissions].sort()) ||
      require2fa !== settings.require_2fa ||
      notifyNewMember !== settings.notify_on_new_member ||
      notifyServerOffline !== settings.notify_on_server_offline ||
      notifyAlertTriggered !== settings.notify_on_alert_triggered ||
      JSON.stringify(notificationEmails.sort()) !==
        JSON.stringify([...(settings.notification_emails || [])].sort()) ||
      webhookUrl !== (settings.webhook_url || "") ||
      webhookEnabled !== settings.webhook_enabled
    );
  }, [
    settings,
    parsedExpiry,
    defaultPermissions,
    require2fa,
    notifyNewMember,
    notifyServerOffline,
    notifyAlertTriggered,
    notificationEmails,
    webhookUrl,
    webhookEnabled,
  ]);

  const handleSave = () => {
    const permissionArray: string[] = [];
    if (defaultPermissions.read) permissionArray.push("read");
    if (defaultPermissions.write) permissionArray.push("write");
    if (defaultPermissions.manage) permissionArray.push("manage");

    updateMutation.mutate(
      {
        invite_expiry_hours: parsedExpiry,
        default_member_permissions: permissionArray,
        require_2fa: require2fa,
        notify_on_new_member: notifyNewMember,
        notify_on_server_offline: notifyServerOffline,
        notify_on_alert_triggered: notifyAlertTriggered,
        notification_emails: notificationEmails,
        webhook_url: webhookUrl || null,
        webhook_enabled: webhookEnabled,
      },
      {
        onSuccess: () => {
          toast.success(
            "Settings saved",
            "Organization settings updated successfully."
          );
        },
        onError: (error: any) => {
          toast.error(
            "Failed to save",
            error?.response?.data?.message || "Something went wrong."
          );
        },
      }
    );
  };

  const togglePermission = (key: keyof typeof defaultPermissions) => {
    setDefaultPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const addEmail = () => {
    const email = newEmail.trim().toLowerCase();
    if (email && !notificationEmails.includes(email) && email.includes("@")) {
      setNotificationEmails([...notificationEmails, email]);
      setNewEmail("");
    }
  };

  const removeEmail = (emailToRemove: string) => {
    setNotificationEmails(
      notificationEmails.filter((e) => e !== emailToRemove)
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6  mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Organization Settings
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Configure settings for <strong>{org?.name}</strong>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <span className="text-sm text-warning">Unsaved changes</span>
          )}
          <Button
            onClick={handleSave}
            isLoading={updateMutation.isPending}
            disabled={!hasChanges || !isValidExpiry || updateMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" /> Save Changes
          </Button>
        </div>
      </div>

      {/* Two Column Grid for larger screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invite Settings */}
        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-foreground">
                Invite Settings
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Configure how invitations work
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <Input
                label="Invite Expiry (hours)"
                type="text"
                inputMode="numeric"
                value={inviteExpiryInput}
                onChange={(e) => setInviteExpiryInput(e.target.value)}
                className={
                  !isValidExpiry && inviteExpiryInput
                    ? "border-destructive"
                    : ""
                }
              />
              {!isValidExpiry && inviteExpiryInput ? (
                <p className="text-xs text-destructive mt-1.5">
                  Please enter a valid number between 1 and 720
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1.5">
                  Invites expire after{" "}
                  {isValidExpiry
                    ? parsedExpiry >= 24
                      ? `${parsedExpiry} hours (${(parsedExpiry / 24).toFixed(1).replace(/\.0$/, "")} days)`
                      : `${parsedExpiry} hours`
                    : "this many hours"}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Security Settings */}
        <ComingSoon>
          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-warning/10 shrink-0">
                <Lock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-foreground">
                  Security
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Organization security settings
                </p>
              </div>
            </div>
            <div
              className="flex items-center justify-between cursor-pointer bg-muted/30 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              onClick={() => setRequire2fa(!require2fa)}
            >
              <div className="flex-1 min-w-0 mr-3">
                <div className="text-sm font-medium text-foreground">
                  Require 2FA
                </div>
                <p className="text-xs text-muted-foreground">
                  Members must enable two-factor authentication
                </p>
              </div>
              <div
                className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${require2fa ? "bg-primary" : "bg-muted border border-border"}`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${require2fa ? "left-6" : "left-1"}`}
                />
              </div>
            </div>
          </Card>
        </ComingSoon>
      </div>

      {/* Default Member Permissions - Full Width */}
      <Card className="p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-info/10 shrink-0">
            <Users className="h-5 w-5 text-info" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-foreground">
              Default Member Permissions
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Permissions assigned to new members by default
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div
            className="flex items-center justify-between cursor-pointer bg-muted/30 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            onClick={() => togglePermission("read")}
          >
            <div className="flex-1 min-w-0 mr-3">
              <div className="text-sm font-medium text-foreground">
                Read Access
              </div>
              <p className="text-xs text-muted-foreground">
                View dashboards & logs
              </p>
            </div>
            <div
              className={`w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ${defaultPermissions.read ? "bg-primary border-primary text-primary-foreground" : "border-input"}`}
            >
              {defaultPermissions.read && <Check className="w-3.5 h-3.5" />}
            </div>
          </div>
          <div
            className="flex items-center justify-between cursor-pointer bg-muted/30 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            onClick={() => togglePermission("write")}
          >
            <div className="flex-1 min-w-0 mr-3">
              <div className="text-sm font-medium text-foreground">
                Write Access
              </div>
              <p className="text-xs text-muted-foreground">
                Add/edit servers & alerts
              </p>
            </div>
            <div
              className={`w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ${defaultPermissions.write ? "bg-primary border-primary text-primary-foreground" : "border-input"}`}
            >
              {defaultPermissions.write && <Check className="w-3.5 h-3.5" />}
            </div>
          </div>
          <div
            className="flex items-center justify-between cursor-pointer bg-muted/30 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            onClick={() => togglePermission("manage")}
          >
            <div className="flex-1 min-w-0 mr-3">
              <div className="text-sm font-medium text-foreground flex items-center">
                <Shield className="w-3 h-3 mr-1 text-primary shrink-0" />
                Manage
              </div>
              <p className="text-xs text-muted-foreground">
                Users, billing & settings
              </p>
            </div>
            <div
              className={`w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ${defaultPermissions.manage ? "bg-primary border-primary text-primary-foreground" : "border-input"}`}
            >
              {defaultPermissions.manage && <Check className="w-3.5 h-3.5" />}
            </div>
          </div>
        </div>
      </Card>

      {/* Notification Settings */}
      <Card className="p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-success/10 shrink-0">
            <Bell className="h-5 w-5 text-success" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-foreground">
              Notifications
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Configure when to receive notifications
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div
            className="flex items-center justify-between cursor-pointer bg-muted/30 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            onClick={() => setNotifyNewMember(!notifyNewMember)}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0 mr-3">
              <Users className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-medium text-foreground truncate">
                  New Member
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  When someone joins
                </p>
              </div>
            </div>
            <div
              className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${notifyNewMember ? "bg-primary" : "bg-muted border border-border"}`}
            >
              <div
                className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${notifyNewMember ? "left-6" : "left-1"}`}
              />
            </div>
          </div>
          <div
            className="flex items-center justify-between cursor-pointer bg-muted/30 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            onClick={() => setNotifyServerOffline(!notifyServerOffline)}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0 mr-3">
              <Server className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-medium text-foreground truncate">
                  Server Offline
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  When server goes down
                </p>
              </div>
            </div>
            <div
              className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${notifyServerOffline ? "bg-primary" : "bg-muted border border-border"}`}
            >
              <div
                className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${notifyServerOffline ? "left-6" : "left-1"}`}
              />
            </div>
          </div>
          <div
            className="flex items-center justify-between cursor-pointer bg-muted/30 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            onClick={() => setNotifyAlertTriggered(!notifyAlertTriggered)}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0 mr-3">
              <Bell className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-medium text-foreground truncate">
                  Alert Triggered
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  When alert fires
                </p>
              </div>
            </div>
            <div
              className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${notifyAlertTriggered ? "bg-primary" : "bg-muted border border-border"}`}
            >
              <div
                className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${notifyAlertTriggered ? "left-6" : "left-1"}`}
              />
            </div>
          </div>
        </div>

        {/* Notification Emails */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2 mb-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              Notification Recipients
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Add email addresses to receive alert notifications. If empty, admins
            will be notified.
          </p>
          <div className="flex  gap-2 mb-3 items-start">
            <div className="flex-1">
              <Input
                label=""
                placeholder="connect@akashtwt.me"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addEmail()}
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={addEmail}
              disabled={!newEmail.includes("@")}
              className="h-10 px-3 mt-1"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {notificationEmails.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {notificationEmails.map((email) => (
                <div
                  key={email}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-sm text-foreground"
                >
                  <Mail className="h-3.5 w-3.5 text-primary" />
                  <span className="truncate max-w-[200px]">{email}</span>
                  <button
                    type="button"
                    onClick={() => removeEmail(email)}
                    className="ml-1 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Webhook Settings */}
      <ComingSoon active={true}>
        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-purple-500/10 shrink-0">
              <Webhook className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-foreground">
                Webhooks
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Send events to external services
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div
              className="flex items-center justify-between cursor-pointer bg-muted/30 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              onClick={() => setWebhookEnabled(!webhookEnabled)}
            >
              <div className="flex-1 min-w-0 mr-3">
                <div className="text-sm font-medium text-foreground">
                  Enable Webhooks
                </div>
                <p className="text-xs text-muted-foreground">
                  Send event notifications to your URL
                </p>
              </div>
              <div
                className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${webhookEnabled ? "bg-primary" : "bg-muted border border-border"}`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${webhookEnabled ? "left-6" : "left-1"}`}
                />
              </div>
            </div>
            {webhookEnabled && (
              <div className="relative max-w-lg">
                <LinkIcon className="absolute left-3 top-9 h-4 w-4 text-muted-foreground" />
                <Input
                  label="Webhook URL"
                  placeholder="https://your-service.com/webhook"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}
          </div>
        </Card>
      </ComingSoon>
    </div>
  );
}
