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
import type { HrCustomField, HrJobStatus } from './useHrJobs'

export type HrCandidateStatus = 'new' | 'under_review' | 'accepted' | 'rejected'

export interface HrCandidateJobSummary {
  id: string
  titleAr: string
  titleEn: string
  status?: HrJobStatus
  cityId?: string | null
  city?: CareerLookupOption | null
  customFields?: HrCustomField[]
}

export interface HrCandidate {
  id: string
  jobId: string
  fullName: string
  gender?: 'male' | 'female' | string
  nationalityId?: string | null
  nationality?: CareerLookupOption | null
  cityId?: string | null
  city?: CareerLookupOption | null
  email: string
  phoneNumber?: string | null
  coverLetter?: string | null
  customAnswers?: Record<string, string | boolean | null>
  cvFile?: string | null
  status: HrCandidateStatus
  createdAt: string
  updatedAt?: string
  job?: HrCandidateJobSummary | null
  [key: string]: unknown
}

export type HrCandidatesResponse = PaginatedResponse<HrCandidate>

export type UseHrCandidatesOptions = {
  enabled?: boolean
  jobId?: string
  status?: HrCandidateStatus
} & PaginationParams

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function normalizeUuid(value?: string): string | undefined {
  const normalized = normalizeSearch(value)
  return normalized && UUID_RE.test(normalized) ? normalized : undefined
}

export function useHrCandidates(options: UseHrCandidatesOptions = {}) {
  return useQuery<HrCandidatesResponse>({
    queryKey: ['admin', 'hr', 'candidates', options],
    queryFn: () =>
      apiClient
        .get<HrCandidatesResponse>('/api/admin/hr/candidates', {
          params: {
            ...paginationParams(options),
            jobId: normalizeUuid(options.jobId),
            status: options.status,
          },
        })
        .then((response) => response.data),
    staleTime: CACHE.MIN_2,
    enabled: options.enabled ?? true,
  })
}

export function useHrCandidate(id?: string) {
  return useQuery<HrCandidate>({
    queryKey: ['admin', 'hr', 'candidates', 'detail', id],
    queryFn: () =>
      apiClient
        .get<HrCandidate>(`/api/admin/hr/candidates/${id}`)
        .then((response) => response.data),
    staleTime: CACHE.MIN_2,
    enabled: !!id,
  })
}
