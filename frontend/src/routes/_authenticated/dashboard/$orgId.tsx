import { AppLayout } from "@/components/Layouts/AppLayout";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard/$orgId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { orgId } = Route.useParams();

  return (
    <AppLayout orgId={orgId}>
      <Outlet />
    </AppLayout>
  );
}
