import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { CACHE } from '@/lib/constants/cache-config'
import {
  normalizeSearch,
  paginationParams,
  type PaginatedResponse,
  type PaginationParams,
} from '@/lib/pagination'
import type { CareerLookupOption } from './useCareerCities'

export type HrJobStatus = 'draft' | 'published' | 'closed'
export type HrCustomFieldType = 'text' | 'boolean'

export interface HrCustomField {
  key: string
  type: HrCustomFieldType
  labelAr: string
  labelEn: string
  required: boolean
}

export interface HrJob {
  id: string
  titleAr: string
  titleEn: string
  descriptionAr?: string | null
  descriptionEn?: string | null
  status: HrJobStatus
  cityId: string
  city?: CareerLookupOption | null
  closingDate?: string | null
  customFields?: HrCustomField[]
  createdAt: string
  updatedAt?: string
  _count: { candidates: number }
  [key: string]: unknown
}

export type HrJobsResponse = PaginatedResponse<HrJob>

export type UseHrJobsOptions = {
  enabled?: boolean
  status?: HrJobStatus
  cityId?: string
} & PaginationParams

export function useHrJobs(options: UseHrJobsOptions = {}) {
  return useQuery<HrJobsResponse>({
    queryKey: ['admin', 'hr', 'jobs', options],
    queryFn: () =>
      apiClient
        .get<HrJobsResponse>('/api/admin/hr/jobs', {
          params: {
            ...paginationParams(options),
            status: options.status,
            cityId: normalizeSearch(options.cityId),
          },
        })
        .then((response) => response.data),
    staleTime: CACHE.MIN_2,
    enabled: options.enabled ?? true,
  })
}

export function useHrJob(id?: string) {
  return useQuery<HrJob>({
    queryKey: ['admin', 'hr', 'jobs', 'detail', id],
    queryFn: () =>
      apiClient
        .get<HrJob>(`/api/admin/hr/jobs/${id}`)
        .then((response) => response.data),
    staleTime: CACHE.MIN_2,
    enabled: !!id,
  })
}
