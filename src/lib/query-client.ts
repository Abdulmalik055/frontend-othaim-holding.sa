import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api-client";

function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError) {
    // Auth/permission errors won't pass by retrying.
    if (error.status === 401 || error.status === 403 || error.status === 404) {
      return false;
    }
  }

  return failureCount < 3;
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: shouldRetryQuery,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 1,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always make a new query client per request
    // to avoid sharing state between different users/requests
    return makeQueryClient();
  }
  // Browser: reuse singleton to preserve cache across navigations
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}
