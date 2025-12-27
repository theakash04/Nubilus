import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listDatabases,
  getDatabase,
  getDatabaseMetrics,
  createDatabase,
  deleteDatabase,
} from "@/lib/api/databases.api";

export function useDatabases(orgId: string) {
  return useQuery({
    queryKey: ["org", orgId, "databases"],
    queryFn: () => listDatabases(orgId),
    enabled: !!orgId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useDatabase(orgId: string, dbId: string) {
  return useQuery({
    queryKey: ["org", orgId, "databases", dbId],
    queryFn: () => getDatabase(orgId, dbId),
    enabled: !!orgId && !!dbId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useDatabaseMetrics(orgId: string, dbId: string) {
  return useQuery({
    queryKey: ["org", orgId, "databases", dbId, "metrics"],
    queryFn: () => getDatabaseMetrics(orgId, dbId),
    enabled: !!orgId && !!dbId,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 30,
  });
}

export function useCreateDatabase(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof createDatabase>[1]) =>
      createDatabase(orgId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org", orgId, "databases"] });
    },
  });
}

export function useDeleteDatabase(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dbId: string) => deleteDatabase(orgId, dbId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org", orgId, "databases"] });
    },
  });
}
