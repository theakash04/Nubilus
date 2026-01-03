import { useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ListMyOrgs } from "@/lib/api/organizations.api";

export type Permission = "read" | "write" | "manage";

export function usePermissions() {
  const { orgId } = useParams({ strict: false });

  const { data: orgsData } = useQuery({
    queryKey: ["organizations"],
    queryFn: ListMyOrgs,
    staleTime: 1000 * 60 * 5,
  });

  const currentOrg = orgsData?.data?.organizations?.find(
    (org) => org.id === orgId
  );
  const permissions = currentOrg?.user_permissions || [];

  const hasPermission = (permission: Permission): boolean => {
    return permissions.includes(permission);
  };

  const canRead = hasPermission("read");
  const canWrite = hasPermission("write");
  const canManage = hasPermission("manage");

  return {
    permissions,
    hasPermission,
    canRead,
    canWrite,
    canManage,
    // For convenience - manage implies write and read
    canModify: canWrite || canManage,
  };
}
