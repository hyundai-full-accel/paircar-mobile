import { useQuery } from '@tanstack/react-query'
import { fetchRoute, type RoutePoint } from '../lib/route'

// 지점이 같으면 다시 부르지 않음 (데모 서버 사용량 제한)
export function useRoute(stops: RoutePoint[]) {
  const key = stops.map((it) => `${it.latitude},${it.longitude}`).join(';')
  return useQuery({
    queryKey: ['route', key],
    queryFn: ({ signal }) => fetchRoute(stops, signal),
    enabled: stops.length >= 2,
    staleTime: Infinity,
    gcTime: 60 * 60 * 1000,
    retry: false,
  })
}
