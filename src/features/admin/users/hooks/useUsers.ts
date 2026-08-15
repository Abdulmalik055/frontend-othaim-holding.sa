import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { CACHE } from '@/lib/constants/cache-config'
import { paginationParams, type PaginatedResponse, type PaginationParams } from '@/lib/pagination'

export interface AdminUser {
  id:        string
  name:      string
  email:     string
  role:      string
  banned:    boolean
  createdAt: string
}

type UseUsersOptions = {
  enabled?: boolean
} & PaginationParams

export type UsersResponse = PaginatedResponse<AdminUser>

export function useUsers(options: UseUsersOptions = {}) {
  return useQuery<UsersResponse>({
    queryKey: ['admin', 'users', options],
    queryFn:  () =>
      apiClient
        .get<UsersResponse>('/api/admin/users', { params: paginationParams(options) })
        .then((response) => response.data),
    staleTime: CACHE.MIN_2,
    enabled: options.enabled ?? true,
  })
}
