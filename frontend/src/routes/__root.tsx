import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import type { QueryClient } from "@tanstack/react-query";
import NotFound from "@/components/Notfound";
import AccessDenied from "@/components/AccessDenied";

interface MyRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  notFoundComponent: NotFound,
  errorComponent: ({ error }) => {
    // Check for 403 Forbidden error
    if (
      (error as any)?.response?.status === 403 ||
      (error as any)?.status === 403 ||
      (error as any)?.message?.includes("Access denied")
    ) {
      return <AccessDenied message={(error as any)?.message} />;
    }

    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold text-destructive mb-2">
          Something went wrong
        </h1>
        <p className="text-muted-foreground mb-4">
          {(error as any)?.message || "An unexpected error occurred"}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
        >
          Reload Page
        </button>
      </div>
    );
  },
  component: () => (
    <>
      <Outlet />
      <TanStackDevtools
        config={{
          position: "bottom-right",
        }}
        plugins={[
          {
            name: "Tanstack Router",
            render: <TanStackRouterDevtoolsPanel />,
          },
          TanStackQueryDevtools,
        ]}
      />
    </>
  ),
});
