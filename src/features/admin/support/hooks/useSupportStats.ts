import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { TicketStatus } from './useSupportTickets'
import { CACHE } from '@/lib/constants/cache-config'
import { PAGINATION } from '@/lib/constants/pagination'

interface MinimalResponse { total: number }

function fetchCount(status: TicketStatus) {
  return apiClient
    .get<MinimalResponse>('/api/admin/support-tickets', { params: { limit: PAGINATION.COUNT_ONLY_LIMIT, status } })
    .then((r) => r.data.total)
}

export interface SupportStats {
  newCount:    number
  readCount:   number
  closedCount: number
}

type UseSupportStatsOptions = {
  enabled?: boolean
}

export function useSupportStats(options: UseSupportStatsOptions = {}): { data: SupportStats; isLoading: boolean } {
  const enabled = options.enabled ?? true

  const { data: newCount    = 0, isLoading: l1 } = useQuery({
    queryKey: ['admin', 'support', 'stats', 'new'],
    queryFn:  () => fetchCount('new'),
    staleTime: CACHE.MIN_5,
    enabled,
  })
  const { data: readCount   = 0, isLoading: l2 } = useQuery({
    queryKey: ['admin', 'support', 'stats', 'read'],
    queryFn:  () => fetchCount('read'),
    staleTime: CACHE.MIN_5,
    enabled,
  })
  const { data: closedCount = 0, isLoading: l3 } = useQuery({
    queryKey: ['admin', 'support', 'stats', 'closed'],
    queryFn:  () => fetchCount('closed'),
    staleTime: CACHE.MIN_5,
    enabled,
  })

  return {
    data:      { newCount, readCount, closedCount },
    isLoading: enabled && (l1 || l2 || l3),
  }
}
