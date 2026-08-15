import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { CACHE } from '@/lib/constants/cache-config'
import { paginationParams, type PaginatedResponse } from '@/lib/pagination'

export type TicketStatus = 'new' | 'read' | 'closed'

export interface SupportTicket {
  id:          string
  fullName:    string
  email:       string
  companyName: string
  subject:     string
  message:     string
  status:      TicketStatus
  attachments: string[]
  createdAt:   string
}

export interface SupportTicketsParams {
  page?:   number
  limit?:  number
  search?: string
  status?: TicketStatus
  enabled?: boolean
}

export type SupportTicketsResponse = PaginatedResponse<SupportTicket>

export function useSupportTickets(params: SupportTicketsParams = {}) {
  return useQuery<SupportTicketsResponse>({
    queryKey: ['admin', 'support', 'list', params],
    queryFn: () =>
      apiClient
        .get<SupportTicketsResponse>('/api/admin/support-tickets', {
          params: {
            ...paginationParams(params),
            status: params.status || undefined,
          },
        })
        .then((r) => r.data),
    staleTime: CACHE.MIN_5,
    enabled: params.enabled ?? true,
  })
}
