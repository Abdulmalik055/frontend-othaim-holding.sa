import type { QueryClient } from '@tanstack/react-query'

export function createInvalidator(queryKey: readonly unknown[]) {
  return (queryClient: QueryClient) =>
    queryClient.invalidateQueries({ queryKey })
}
