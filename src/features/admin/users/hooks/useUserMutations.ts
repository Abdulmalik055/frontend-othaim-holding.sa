import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { createInvalidator } from '@/lib/query-invalidation'

const invalidateUsers = createInvalidator(['admin', 'users'])

export interface UserCreatePayload {
  name:     string
  email:    string
  role:     string
  password: string
}

export interface UserUpdatePayload {
  name?:     string
  email?:    string
  password?: string
}

export function useUserCreate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UserCreatePayload) =>
      apiClient.post('/api/admin/users', payload).then((response) => response.data),
    onSuccess: () => invalidateUsers(queryClient),
  })
}

export function useUserUpdate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UserUpdatePayload }) =>
      apiClient.patch(`/api/admin/users/${id}`, payload).then((response) => response.data),
    onSuccess: () => invalidateUsers(queryClient),
  })
}

export function useUserChangeRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      apiClient.patch(`/api/admin/users/${id}/role`, { role }).then((response) => response.data),
    onSuccess: () => invalidateUsers(queryClient),
  })
}

export function useUserBan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.patch(`/api/admin/users/${id}/ban`, {}).then((response) => response.data),
    onSuccess: () => invalidateUsers(queryClient),
  })
}

export function useUserUnban() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.patch(`/api/admin/users/${id}/unban`, {}).then((response) => response.data),
    onSuccess: () => invalidateUsers(queryClient),
  })
}

export function useUserDelete() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/api/admin/users/${id}`).then((response) => response.data),
    onSuccess: () => invalidateUsers(queryClient),
  })
}
