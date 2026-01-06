import { ComingSoon } from "@/components/ComingSoon";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute(
  "/_authenticated/dashboard/$orgId/endpoint/$endpointId"
)({
  component: RouteComponent,
});

function RouteComponent() {
  return <ComingSoon />;
}
