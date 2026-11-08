import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'

// 웹 지도 공통 설정. 차량 앱(CarpoolMap.kt)과 같은 지도를 씀. OpenFreeMap은 API 키 없이 쓸 수 있음
// maplibre-gl이 커서 이 파일을 쓰는 지도 컴포넌트는 React.lazy로 필요할 때만 불러옴

// maplibre는 지도 타일을 워커에서 처리함. Vite가 maplibre를 미리 묶으면 기본 워커 주소를 못 찾으므로 주소를 직접 알려 줌
// (워커 파일은 다른 파일을 불러오지 않는 단독 파일이라 그대로 복사돼도 동작함)
maplibregl.setWorkerUrl(workerUrl)

export { maplibregl }

const STYLE_URL = 'https://tiles.openfreemap.org/styles/positron'
// 보여 줄 장소가 하나도 없을 때 처음 보여 줄 곳 (서울시청)
export const DEFAULT_CENTER: [number, number] = [126.978, 37.5665]

export type LatLng = { latitude: number; longitude: number }

export const toLngLat = (point: LatLng): [number, number] => [point.longitude, point.latitude]

// 회전, 기울이기는 끔 (폰에서 잘못 건드리기 쉬움)
export function createMap(container: HTMLElement, options: Partial<maplibregl.MapOptions> = {}) {
  const map = new maplibregl.Map({
    container,
    style: STYLE_URL,
    center: DEFAULT_CENTER,
    zoom: 11,
    attributionControl: { compact: true },
    dragRotate: false,
    pitchWithRotate: false,
    touchPitch: false,
    ...options,
  })
  map.touchZoomRotate.disableRotation()
  return map
}

// 점들이 모두 보이게 맞춤. 하나면 그 점으로
export function fitTo(map: maplibregl.Map, points: LatLng[], options: { padding?: number; maxZoom?: number; duration?: number } = {}) {
  const { padding = 48, maxZoom = 16, duration = 0 } = options
  if (points.length === 0) return
  if (points.length === 1) {
    map.jumpTo({ center: toLngLat(points[0]), zoom: maxZoom })
    return
  }
  const bounds = new maplibregl.LngLatBounds()
  points.forEach((point) => bounds.extend(toLngLat(point)))
  map.fitBounds(bounds, { padding, maxZoom, duration })
}
