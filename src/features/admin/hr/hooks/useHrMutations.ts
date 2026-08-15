import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { HrCandidateStatus } from './useHrCandidates'
import type { HrCustomField, HrJobStatus } from './useHrJobs'

export type HrCustomFieldPayload = Omit<HrCustomField, 'key'>

export interface HrJobPayload {
  titleAr: string
  titleEn: string
  descriptionAr: string
  descriptionEn: string
  cityId: string
  status: HrJobStatus
  closingDate: string | null
  customFields: HrCustomFieldPayload[]
}

function invalidateHr(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['admin', 'hr'] })
}

export function useHrJobCreate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: HrJobPayload) =>
      apiClient.post('/api/admin/hr/jobs', payload).then((response) => response.data),
    onSuccess: () => invalidateHr(queryClient),
  })
}

export function useHrJobUpdate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<HrJobPayload> }) =>
      apiClient.patch(`/api/admin/hr/jobs/${id}`, payload).then((response) => response.data),
    onSuccess: () => invalidateHr(queryClient),
  })
}

export function useHrJobDelete() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/api/admin/hr/jobs/${id}`).then((response) => response.data),
    onSuccess: () => invalidateHr(queryClient),
  })
}

export function useHrCandidateStatusUpdate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: HrCandidateStatus }) =>
      apiClient
        .patch(`/api/admin/hr/candidates/${id}/status`, { status })
        .then((response) => response.data),
    onSuccess: () => invalidateHr(queryClient),
  })
}
