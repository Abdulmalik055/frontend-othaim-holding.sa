import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { CACHE } from '@/lib/constants/cache-config'

export interface CareerLookupOption {
  id: string
  nameAr: string
  nameEn: string
}

export type CareerCity = CareerLookupOption

export function useCareerCities() {
  return useQuery<CareerCity[]>({
    queryKey: ['careers', 'lookups', 'cities'],
    queryFn: () =>
      apiClient
        .get<CareerCity[]>('/api/careers/cities')
        .then((response) => response.data),
    staleTime: CACHE.MIN_5,
  })
}
