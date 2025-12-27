import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getUser } from "@/lib/api/Authapi";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ context }) => {
    try {
      const res = await context.queryClient.fetchQuery({
        queryKey: ["user"],
        queryFn: getUser,
        staleTime: 1000 * 60 * 5,
      });

      if (!res.success) {
        throw redirect({
          to: "/",
        });
      }

      return {
        user: res.data,
      };
    } catch (error) {
      if (error instanceof Response || (error as any)?.to) {
        throw error;
      }
      throw redirect({
        to: "/",
      });
    }
  },
  component: () => <Outlet />,
});
