import sql from "..";
import { Organization } from "../../modules/org/org.types";

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
  updates: { name?: string; webhook_url?: string | null }
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
