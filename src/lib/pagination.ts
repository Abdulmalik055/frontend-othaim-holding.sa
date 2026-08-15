import { PAGINATION } from '@/lib/constants/pagination'

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: PAGINATION.DEFAULT_LIMIT,
  MIN_LIMIT: 1,
  MAX_LIMIT: 100,
} as const

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
}

export interface PaginationMeta {
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export function normalizePage(page?: number): number {
  if (!Number.isFinite(page)) return PAGINATION_DEFAULTS.PAGE
  return Math.max(PAGINATION_DEFAULTS.PAGE, Math.floor(page as number))
}

export function normalizeLimit(limit?: number): number {
  if (!Number.isFinite(limit)) return PAGINATION_DEFAULTS.LIMIT
  return Math.min(
    PAGINATION_DEFAULTS.MAX_LIMIT,
    Math.max(PAGINATION_DEFAULTS.MIN_LIMIT, Math.floor(limit as number)),
  )
}

export function normalizeSearch(search?: string): string | undefined {
  const normalized = search?.trim()
  return normalized ? normalized : undefined
}

export function paginationParams(params: PaginationParams = {}) {
  return {
    page: normalizePage(params.page),
    limit: normalizeLimit(params.limit),
    search: normalizeSearch(params.search),
  }
}

export function getPaginationMeta(total: number, page: number, limit: number): PaginationMeta {
  const normalizedLimit = normalizeLimit(limit)
  const normalizedPage = normalizePage(page)
  const totalPages = Math.ceil(total / normalizedLimit)

  return {
    totalPages,
    hasNext: normalizedPage * normalizedLimit < total,
    hasPrev: normalizedPage > 1,
  }
}
