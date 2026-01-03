import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function getContext() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        throwOnError: (error: any) => {
          return error?.response?.status === 403 || error?.status === 403;
        },
      },
      mutations: {
        throwOnError: (error: any) => {
          return error?.response?.status === 403 || error?.status === 403;
        },
      },
    },
  });
  return {
    queryClient,
  };
}

export function Provider({
  children,
  queryClient,
}: {
  children: React.ReactNode;
  queryClient: QueryClient;
}) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
