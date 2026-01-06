import sql from "..";
import { Organization } from "../../modules/org/org.types";
import { AppError } from "../../utils/handler";
import { createNewUser, getUserByEmail } from "./users";
import crypto from "crypto";

export async function createOrganization(name: string, userId: string): Promise<Organization> {
  const [org] = await sql<Organization[]>`
    INSERT INTO organizations (name, created_by)
    VALUES (${name}, ${userId}::uuid)
    RETURNING *
  `;

  await sql`
    INSERT INTO organizations_users (organization_id, user_id, permissions, status)
    VALUES (${org.id}::uuid, ${userId}::uuid, ARRAY['read', 'write', 'manage'], 'active')
  `;

  return org;
}

export async function getOrganizationById(id: string): Promise<Organization | null> {
  const [org] = await sql<Organization[]>`
    SELECT * FROM organizations WHERE id = ${id}::uuid
  `;
  return org ?? null;
}

export async function getOrganizationsByUserId(
  userId: string
): Promise<(Organization & { user_permissions: string[] })[]> {
  const orgs = await sql<(Organization & { user_permissions: string[] })[]>`
    SELECT o.*, ou.permissions as user_permissions 
    FROM organizations o
    JOIN organizations_users ou ON o.id = ou.organization_id
    WHERE ou.user_id = ${userId}::uuid AND ou.status = 'active'
  `;
  return orgs;
}

export async function updateOrganization(
  id: string,
  updates: { name?: string; webhook_url?: string | null; server_offline_threshold_seconds?: number }
): Promise<Organization | null> {
  const setClauses: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) {
    setClauses.push("name");
    values.push(updates.name);
  }
  if (updates.webhook_url !== undefined) {
    setClauses.push("webhook_url");
    values.push(updates.webhook_url);
  }

  if (setClauses.length === 0) return getOrganizationById(id);

  const [org] = await sql<Organization[]>`
    UPDATE organizations
    SET ${sql(updates)}, updated_at = NOW()
    WHERE id = ${id}::uuid
    RETURNING *
  `;
  return org ?? null;
}

export async function userHasOrgPermission(
  userId: string,
  orgId: string,
  requiredPermission: string
): Promise<boolean> {
  const [result] = await sql<{ has_permission: boolean }[]>`
    SELECT ${requiredPermission} = ANY(permissions) as has_permission
    FROM organizations_users
    WHERE user_id = ${userId}::uuid 
      AND organization_id = ${orgId}::uuid 
      AND status = 'active'
  `;
  return result?.has_permission ?? false;
}

export async function getUserOrgWithPermissions(userId: string, orgId: string) {
  const [result] = await sql`
    SELECT ou.permissions, ou.status
    FROM organizations_users ou
    WHERE ou.user_id = ${userId}::uuid AND ou.organization_id = ${orgId}::uuid
  `;
  return result ?? null;
}

export async function createOrgInvite({
  email,
  fullName,
  inviterId,
  orgId,
  permissions,
}: {
  fullName: string;
  orgId: string;
  email: string;
  permissions: string[];
  inviterId: string;
}): Promise<{ token: string }> {
  const token = crypto.randomBytes(32).toString("hex");

  // Get org settings for invite expiry
  const orgSettings = await getOrgSettings(orgId);
  const expiryHours = orgSettings?.invite_expiry_hours ?? 72;
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * expiryHours);

  await sql`
    INSERT INTO org_invites (
      id,
      org_id,
      email,
      full_name,
      permissions,
      token,
      invited_by,
      expires_at,
      accepted
    )
    VALUES (
      gen_random_uuid(),
      ${orgId}::uuid,
      ${email},
      ${fullName},
      ${permissions},
      ${token},
      ${inviterId}::uuid,
      ${expiresAt},
      false
    )
  `;

  return { token };
}

export async function acceptOrgInvite({ token }: { token: string }): Promise<{
  userId: string;
  mustSetPassword: boolean;
  orgId: string;
  email: string;
  fullName: string;
}> {
  const [invite] = await sql`
    SELECT * FROM org_invites WHERE token= ${token}
    AND accepted = false
    AND expires_at > now()
  `;

  if (!invite) {
    throw new AppError("Invalid or expired invite", 400);
  }

  let user = await getUserByEmail(invite.email);
  const isNewUser = !user;

  if (!user) {
    const [newUser] = await sql`
      INSERT INTO users (name, email, password_hash, is_active)
      VALUES (
        ${invite.full_name},
        ${invite.email},
        NULL,
        true
      )
      RETURNING *
    `;

    user = newUser as any;
  }

  const [existingLink] = await sql`
    SELECT *
    FROM organizations_users
    WHERE organization_id = ${invite.org_id}::uuid
      AND user_id = ${user.id}::uuid
  `;

  if (!existingLink) {
    await sql`
      INSERT INTO organizations_users (
        organization_id,
        user_id,
        permissions,
        status
      )
      VALUES (
        ${invite.org_id}::uuid,
        ${user.id}::uuid,
        ${invite.permissions},
        'active'
      )
    `;
  }

  await sql`
    UPDATE org_invites
    SET accepted = true,
        accepted_at = now()
    WHERE id = ${invite.id}::uuid
  `;

  return {
    userId: user.id,
    mustSetPassword: isNewUser,
    orgId: invite.org_id,
    email: invite.email,
    fullName: invite.full_name,
  };
}

export async function ListOrgInvites({ orgId, accepted }: { orgId: string; accepted?: boolean }) {
  const invites = await sql`
    SELECT *
    FROM org_invites
    WHERE org_id = ${orgId}::uuid
    ${accepted !== undefined ? sql`AND accepted = ${accepted}` : sql``}
  `;

  return invites;
}

export async function listAllMembers({
  orgId,
  status,
}: {
  orgId: string;
  status: "active" | "suspended";
}) {
  const users = await sql`
    SELECT 
      u.id,
      u.email,
      u.name,
      u.last_login,
      ou.organization_id,
      ou.permissions,
      ou.joined_at,
      ou.status
    FROM organizations_users ou JOIN users u ON u.id = ou.user_id
    WHERE organization_id = ${orgId}::uuid
    AND status = ${status}
  `;

  return users;
}

// Count active members with "manage" permission
export async function countActiveManagers(orgId: string) {
  const [result] = await sql`
    SELECT COUNT(*) as count
    FROM organizations_users
    WHERE organization_id = ${orgId}::uuid
      AND status = 'active'
      AND 'manage' = ANY(permissions)
  `;
  return parseInt(result?.count || "0", 10);
}

// Get a specific member's permissions
export async function getMemberPermissions({
  orgId,
  userId,
}: {
  orgId: string;
  userId: string;
}): Promise<string[] | null> {
  const [result] = await sql`
    SELECT permissions
    FROM organizations_users
    WHERE organization_id = ${orgId}::uuid
      AND user_id = ${userId}::uuid
  `;
  return result?.permissions || null;
}

// Suspend a member (change status to 'suspended')
export async function suspendMember({ orgId, userId }: { orgId: string; userId: string }) {
  await sql`
    UPDATE organizations_users
    SET status = 'suspended'
    WHERE organization_id = ${orgId}::uuid
      AND user_id = ${userId}::uuid
  `;
}

// Update member permissions
export async function updateMemberPermissions({
  orgId,
  userId,
  permissions,
}: {
  orgId: string;
  userId: string;
  permissions: string[];
}) {
  await sql`
    UPDATE organizations_users
    SET permissions = ${permissions}
    WHERE organization_id = ${orgId}::uuid
      AND user_id = ${userId}::uuid
  `;
}

// Org Settings Types
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
  // Alert threshold defaults
  default_cpu_threshold: number;
  default_memory_threshold: number;
  default_disk_threshold: number;
  default_load_threshold: number;
  default_alert_cooldown_minutes: number;
  server_offline_threshold_seconds: number;
  created_at: string;
  updated_at: string;
}

// Get org settings
export async function getOrgSettings(orgId: string): Promise<OrgSettings> {
  const [settings] = await sql<OrgSettings[]>`
    SELECT * FROM org_settings WHERE org_id = ${orgId}::uuid
  `;
  return settings;
}

// Update org settings
export async function updateOrgSettings({
  orgId,
  invite_expiry_hours,
  default_member_permissions,
  require_2fa,
  notify_on_new_member,
  notify_on_server_offline,
  notify_on_alert_triggered,
  notification_emails,
  webhook_url,
  webhook_secret,
  webhook_enabled,
  default_cpu_threshold,
  default_memory_threshold,
  default_disk_threshold,
  default_load_threshold,
  default_alert_cooldown_minutes,
  server_offline_threshold_seconds,
}: {
  orgId: string;
  invite_expiry_hours?: number;
  default_member_permissions?: string[];
  require_2fa?: boolean;
  notify_on_new_member?: boolean;
  notify_on_server_offline?: boolean;
  notify_on_alert_triggered?: boolean;
  notification_emails?: string[];
  webhook_url?: string | null;
  webhook_secret?: string | null;
  webhook_enabled?: boolean;
  // Alert threshold defaults
  default_cpu_threshold?: number;
  default_memory_threshold?: number;
  default_disk_threshold?: number;
  default_load_threshold?: number;
  default_alert_cooldown_minutes?: number;
  server_offline_threshold_seconds?: number;
}) {
  await sql`
    UPDATE org_settings
    SET
      invite_expiry_hours = COALESCE(${invite_expiry_hours ?? null}, invite_expiry_hours),
      default_member_permissions = COALESCE(${
        default_member_permissions ?? null
      }, default_member_permissions),
      require_2fa = COALESCE(${require_2fa ?? null}, require_2fa),
      notify_on_new_member = COALESCE(${notify_on_new_member ?? null}, notify_on_new_member),
      notify_on_server_offline = COALESCE(${
        notify_on_server_offline ?? null
      }, notify_on_server_offline),
      notify_on_alert_triggered = COALESCE(${
        notify_on_alert_triggered ?? null
      }, notify_on_alert_triggered),
      notification_emails = COALESCE(${notification_emails ?? null}, notification_emails),
      webhook_url = COALESCE(${webhook_url ?? null}, webhook_url),
      webhook_secret = COALESCE(${webhook_secret ?? null}, webhook_secret),
      webhook_enabled = COALESCE(${webhook_enabled ?? null}, webhook_enabled),
      default_cpu_threshold = COALESCE(${default_cpu_threshold ?? null}, default_cpu_threshold),
      default_memory_threshold = COALESCE(${
        default_memory_threshold ?? null
      }, default_memory_threshold),
      default_disk_threshold = COALESCE(${default_disk_threshold ?? null}, default_disk_threshold),
      default_load_threshold = COALESCE(${default_load_threshold ?? null}, default_load_threshold),
      default_alert_cooldown_minutes = COALESCE(${
        default_alert_cooldown_minutes ?? null
      }, default_alert_cooldown_minutes),
      server_offline_threshold_seconds = COALESCE(${
        server_offline_threshold_seconds ?? null
      }, server_offline_threshold_seconds)
    WHERE org_id = ${orgId}::uuid
  `;
}

export async function getOrgAdminEmails(orgId: string): Promise<string[]> {
  const admins = await sql<{ email: string }[]>`
    SELECT u.email
    FROM organizations_users ou
    JOIN users u ON u.id = ou.user_id
    WHERE ou.organization_id = ${orgId}::uuid
      AND ou.status = 'active'
      AND 'manage' = ANY(ou.permissions)
  `;
  return admins.map(a => a.email);
}
