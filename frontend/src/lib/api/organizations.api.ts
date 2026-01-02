import type { ApiResponse } from "../types/auth.types";
import type {
  Organization,
  OrgInvite,
  OrgMember,
  OrgSettings,
} from "../types/org.types";
import api from "./AxiosInstance";

export async function ListMyOrgs() {
  const res =
    await api.get<ApiResponse<{ organizations: Organization[] }>>("/org");

  return res.data;
}

export async function getOrgById({ orgId }: { orgId: string }) {
  const res = await api.get<ApiResponse<Organization>>(`/org/${orgId}`);

  return res.data;
}

interface orgProps {
  name: string;
}
export async function createOrg(org: orgProps) {
  const res = await api.post<ApiResponse<Organization>>("/org", org);

  return res.data;
}

interface updateOrgProps {
  id: string;
  updateData: {
    name: string;
  };
}
export async function updateOrg(org: updateOrgProps) {
  const res = await api.put<ApiResponse>(`/org/${org.id}`, org.updateData);

  return res.data;
}

// user/member invite api's

interface invitedUsersProps {
  orgId: string;
}
export async function getAllInvitedUsers({ orgId }: invitedUsersProps) {
  const res = await api.get<ApiResponse<{ invites: OrgInvite[] }>>(
    `/org/${orgId}/invites`
  );

  return res.data;
}

export interface inviteUserProps {
  orgId: string;
  email: string;
  permissions: string[];
  fullName: string;
}
export async function inviteUser({
  orgId,
  email,
  fullName,
  permissions,
}: inviteUserProps) {
  const res = await api.post<ApiResponse>(`/org/${orgId}/invite`, {
    email,
    fullName,
    permissions,
  });

  return res.data;
}

interface accpetInviteProps {
  token: string;
}
export async function AcceptInvite({ token }: accpetInviteProps) {
  const res = await api.get<ApiResponse<{ mustSetPassword: boolean }>>(
    `/org/invite/accept`,
    {
      params: token,
    }
  );

  return res.data;
}

export async function getAllMembers({
  orgId,
  status,
}: {
  orgId: string;
  status: "active" | "suspended";
}) {
  const res = await api.get<ApiResponse<{ members: OrgMember[] }>>(
    `/org/${orgId}/members`,
    {
      params: status ? { status } : undefined,
    }
  );

  return res.data;
}

export async function suspendMemberApi({
  orgId,
  userId,
}: {
  orgId: string;
  userId: string;
}) {
  const res = await api.patch<ApiResponse>(
    `/org/${orgId}/members/${userId}/suspend`
  );
  return res.data;
}

export async function updateMemberPermissionsApi({
  orgId,
  userId,
  permissions,
}: {
  orgId: string;
  userId: string;
  permissions: string[];
}) {
  const res = await api.put<ApiResponse>(`/org/${orgId}/members/${userId}`, {
    permissions,
  });
  return res.data;
}

// Org Settings APIs
export async function getOrgSettings({ orgId }: { orgId: string }) {
  const res = await api.get<ApiResponse<OrgSettings>>(`/org/${orgId}/settings`);
  return res.data;
}

export async function updateOrgSettings({
  orgId,
  settings,
}: {
  orgId: string;
  settings: Partial<
    Omit<OrgSettings, "id" | "org_id" | "created_at" | "updated_at">
  >;
}) {
  const res = await api.put<ApiResponse>(`/org/${orgId}/settings`, settings);
  return res.data;
}
