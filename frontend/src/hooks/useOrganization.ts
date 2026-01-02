import { useQuery } from "@tanstack/react-query";
import { getOrgById } from "@/lib/api/organizations.api";

export function useOrganization(orgId: string) {
  return useQuery({
    queryKey: ["organization", orgId],
    queryFn: () => getOrgById({ orgId }),
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5,
  });
}
