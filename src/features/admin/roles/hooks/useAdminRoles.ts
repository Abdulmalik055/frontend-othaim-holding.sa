import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { CACHE } from '@/lib/constants/cache-config'
import { paginationParams, type PaginatedResponse, type PaginationParams } from '@/lib/pagination'

export interface AdminRole {
  id:          string
  name:        string
  permissions: string[]
  createdAt:   string
}

type UseAdminRolesOptions = {
  enabled?: boolean
} & PaginationParams

export type AdminRolesResponse = PaginatedResponse<AdminRole>

export function useAdminRoles(options: UseAdminRolesOptions = {}) {
  return useQuery<AdminRolesResponse>({
    queryKey: ['admin', 'roles', options],
    queryFn:  () =>
      apiClient
        .get<AdminRolesResponse>('/api/admin/roles', { params: paginationParams(options) })
        .then((response) => response.data),
    staleTime: CACHE.MIN_5,
    enabled: options.enabled ?? true,
  })
}
