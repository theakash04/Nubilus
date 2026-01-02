import type { ApiResponse } from "../types/auth.types";
import type { Organization } from "../types/org.types";
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

// user invite and addition
interface props1 {
  orgId: string;
}
export async function getAllInvitedUsers({ orgId }: props1) {
  const res = await api.get<ApiResponse>(`/org/${orgId}/invites`);

  return res.data;
}
