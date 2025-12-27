import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute(
  '/_authenticated/dashboard/$orgId/servers',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/dashboard/$orgId/server"!</div>
}
