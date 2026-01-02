import { ComingSoon } from "@/components/ComingSoon";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute(
  "/_authenticated/dashboard/$orgId/databases"
)({
  component: RouteComponent,
});

function RouteComponent() {
  return <ComingSoon />;
}
