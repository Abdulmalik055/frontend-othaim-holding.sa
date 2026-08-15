export const CACHE = {
  SEC_15:  1000 * 15,
  SEC_30:  1000 * 30,
  MIN_1:   1000 * 60,
  MIN_2:   1000 * 60 * 2,
  MIN_5:   1000 * 60 * 5,
  MIN_10:  1000 * 60 * 10,
  MIN_30:  1000 * 60 * 30,
  HOUR_1:  1000 * 60 * 60,
} as const

export type CacheKey = keyof typeof CACHE
