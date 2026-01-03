export interface Organization {
  id: string;
  name: string;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
  webhook_url: string | null;
  server_offline_threshold_seconds: number;
  user_permissions?: string[]; // Current user's permissions for this org
}

export interface OrgInvite {
  id: string;
  org_id: string;
  email: string;
  full_name: string;
  permissions: string[];
  token: string;
  invited_by: string;
  expires_at: string;
  accepted: boolean;
  accepted_at: string | null;
  created_at: string;
}

export interface OrgMember {
  id: string;
  email: string;
  name: string;
  last_login: string;
  organization_id: string;
  permissions: string[];
  joined_at: string;
  status: "active" | "suspended";
}

export interface OrgSettings {
  id: string;
  org_id: string;
  invite_expiry_hours: number;
  default_member_permissions: string[];
  require_2fa: boolean;
  notify_on_new_member: boolean;
  notify_on_server_offline: boolean;
  notify_on_alert_triggered: boolean;
  notification_emails: string[];
  webhook_url: string | null;
  webhook_secret: string | null;
  webhook_enabled: boolean;
  created_at: string;
  updated_at: string;
}
