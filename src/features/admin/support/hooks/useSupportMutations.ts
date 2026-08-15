import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { TicketStatus } from './useSupportTickets'

function invalidateSupport(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['admin', 'support'] })
}

export function useSupportStatusUpdate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TicketStatus }) =>
      apiClient
        .patch(`/api/admin/support-tickets/${id}/status`, { status })
        .then((r) => r.data),
    onSuccess: () => invalidateSupport(queryClient),
  })
}

export function useSupportDelete() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/api/admin/support-tickets/${id}`).then((r) => r.data),
    onSuccess: () => invalidateSupport(queryClient),
  })
}
