import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAllInvitedUsers,
  getAllMembers,
  getOrgById,
  getOrgSettings,
  inviteUser,
  suspendMemberApi,
  updateMemberPermissionsApi,
  updateOrgSettings,
  type inviteUserProps,
} from "@/lib/api/organizations.api";
import type { OrgSettings } from "@/lib/types/org.types";

export function useOrganization(orgId: string) {
  return useQuery({
    queryKey: ["organization", orgId],
    queryFn: () => getOrgById({ orgId }),
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useInvites(orgId: string) {
  return useQuery({
    queryKey: ["invites", orgId],
    queryFn: () => getAllInvitedUsers({ orgId }),
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateInvite(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<inviteUserProps, "orgId">) =>
      inviteUser({ orgId, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invites", orgId] });
    },
  });
}

export function useMembers(orgId: string, status: "active" | "suspended") {
  return useQuery({
    queryKey: ["members", orgId, status],
    queryFn: () => getAllMembers({ orgId, status }),
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useSuspendMember(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => suspendMemberApi({ orgId, userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", orgId] });
    },
  });
}

export function useUpdateMemberPermissions(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      permissions,
    }: {
      userId: string;
      permissions: string[];
    }) => updateMemberPermissionsApi({ orgId, userId, permissions }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", orgId] });
    },
  });
}

export function useOrgSettings(orgId: string) {
  return useQuery({
    queryKey: ["orgSettings", orgId],
    queryFn: () => getOrgSettings({ orgId }),
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdateOrgSettings(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      settings: Partial<
        Omit<OrgSettings, "id" | "org_id" | "created_at" | "updated_at">
      >
    ) => updateOrgSettings({ orgId, settings }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orgSettings", orgId] });
    },
  });
}
