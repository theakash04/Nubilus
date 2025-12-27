import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listAlerts,
  listAlertRules,
  acknowledgeAlert,
  resolveAlert,
  createAlertRule,
  deleteAlertRule,
} from "@/lib/api/alerts.api";

export function useAlerts(orgId: string) {
  return useQuery({
    queryKey: ["org", orgId, "alerts"],
    queryFn: () => listAlerts(orgId),
    enabled: !!orgId,
    staleTime: 1000 * 30, // 30 seconds for alerts
    refetchInterval: 1000 * 30, // Auto-refresh
  });
}

export function useAlertRules(orgId: string) {
  return useQuery({
    queryKey: ["org", orgId, "alert-rules"],
    queryFn: () => listAlertRules(orgId),
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useAcknowledgeAlert(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertId: string) => acknowledgeAlert(orgId, alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org", orgId, "alerts"] });
    },
  });
}

export function useResolveAlert(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertId: string) => resolveAlert(orgId, alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org", orgId, "alerts"] });
    },
  });
}

export function useCreateAlertRule(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof createAlertRule>[1]) =>
      createAlertRule(orgId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["org", orgId, "alert-rules"],
      });
    },
  });
}

export function useDeleteAlertRule(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ruleId: string) => deleteAlertRule(orgId, ruleId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["org", orgId, "alert-rules"],
      });
    },
  });
}
