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

export async function getOrganizationsByUserId(userId: string): Promise<Organization[]> {
  const orgs = await sql<Organization[]>`
    SELECT o.* FROM organizations o
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
  // TODO: make it controllable from the org settings
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

  await sql`
    INSERT INTO org_invites (
      id,
      organization_id,
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

export async function acceptOrgInvite({
  token,
}: {
  token: string;
}): Promise<{ userId: string; mustSetPassword: boolean }> {
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
    WHERE organization_id = ${invite.organization_id}::uuid
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
        ${invite.organization_id}::uuid,
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

  return { userId: user.id, mustSetPassword: isNewUser };
}

export async function ListOrgInvites({ orgId, accepted }: { orgId: string; accepted?: boolean }) {
  const invites = await sql`
    SELECT *
    FROM org_invites
    WHERE org_id = ${orgId}
    ${accepted !== undefined ? sql`AND accepted = ${accepted}` : sql``}
  `;

  return invites;
}
