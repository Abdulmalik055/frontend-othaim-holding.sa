import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

function invalidateRoles(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] })
}

export interface RolePayload {
  name:        string
  permissions: string[]
}

export interface RoleUpdatePayload {
  name?:        string
  permissions?: string[]
}

export function useRoleCreate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: RolePayload) =>
      apiClient.post('/api/admin/roles', payload).then((response) => response.data),
    onSuccess: () => invalidateRoles(queryClient),
  })
}

export function useRoleUpdate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RoleUpdatePayload }) =>
      apiClient.patch(`/api/admin/roles/${id}`, payload).then((response) => response.data),
    onSuccess: () => invalidateRoles(queryClient),
  })
}

export function useRoleDelete() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/api/admin/roles/${id}`).then((response) => response.data),
    onSuccess: () => invalidateRoles(queryClient),
  })
}
