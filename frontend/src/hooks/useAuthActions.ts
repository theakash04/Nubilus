import { getUser, LoginUser, logoutUser } from "@/lib/api/Authapi";
import type { LoginCredentialProps } from "@/lib/types/auth.types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouter } from "@tanstack/react-router";

/**
 * Hook to get the current user from TanStack Query cache.
 * Uses the same query key as the route beforeLoad, so data is shared.
 */
export function useUser() {
  const query = useQuery({
    queryKey: ["user"],
    queryFn: getUser,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  return {
    user: query.data?.success ? query.data.data : null,
    isLoading: query.isLoading,
    isAuthenticated: query.data?.success === true,
    error:
      query.error?.message ||
      (query.data?.success === false ? query.data.message : null),
  };
}

/**
 * Hook for login mutation.
 * Invalidates user query on success.
 */
export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (credentials: LoginCredentialProps) => LoginUser(credentials),
    onSuccess: async (data) => {
      if (data.success) {
        await queryClient.invalidateQueries({ queryKey: ["user"] });
        await router.invalidate();
      }
    },
  });
}

/**
 * Hook for logout mutation.
 * Clears all query cache and redirects to login.
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: logoutUser,
    onSuccess: async () => {
      queryClient.clear();
      await router.invalidate();
      navigate({ to: "/", replace: true });
      localStorage.clear();
    },
  });
}
