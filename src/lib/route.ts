// 지점들을 잇는 도로 경로. 차량 앱(OsrmRoutePreviewRepository.kt)처럼 OSRM 공개 데모 서버를 씀
// 데모 서버는 사용량 제한이 있고 상용용이 아니라서, 실서비스 전에는 서버 쪽 길찾기 API로 바꿔야 함
// 실패하면 지점끼리 직선으로 이음
export type RoutePoint = { latitude: number; longitude: number }
export type RoutePath = { path: RoutePoint[]; approximate: boolean }

const OSRM_URL = 'https://router.project-osrm.org'

export async function fetchRoute(stops: RoutePoint[], signal?: AbortSignal): Promise<RoutePath> {
  if (stops.length < 2) return { path: stops, approximate: true }
  try {
    const coordinates = stops.map((it) => `${it.longitude},${it.latitude}`).join(';')
    const response = await fetch(`${OSRM_URL}/route/v1/driving/${coordinates}?overview=full&geometries=geojson`, { signal })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const body = (await response.json()) as { routes?: { geometry: { coordinates: [number, number][] } }[] }
    const line = body.routes?.[0]?.geometry.coordinates
    if (!line || line.length < 2) throw new Error('경로 없음')
    return { path: line.map(([longitude, latitude]) => ({ latitude, longitude })), approximate: false }
  } catch (e) {
    if (signal?.aborted) throw e
    return { path: stops, approximate: true }
  }
}
