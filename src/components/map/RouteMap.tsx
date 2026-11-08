import { useEffect, useRef } from 'react'
import { cn } from '../../lib/cn'
import type { RoutePoint } from '../../lib/route'
import { createMap, fitTo, maplibregl, toLngLat, type LatLng } from './mapBase'

export type StopRole = 'origin' | 'board' | 'alight' | 'stop' | 'destination'
export type MapStop = LatLng & { key: string; name: string; role: StopRole }

type RouteMapProps = {
  stops: MapStop[] // 순서대로 (출발 → 경유 → 도착)
  path: RoutePoint[] | null // 도로 경로 (없으면 선을 안 그림)
  vehicle: LatLng | null // 운행 중 차 위치 (10초마다 바뀜)
  className?: string
}

const ROUTE_SOURCE = 'route'

// 오늘의 카풀 지도: 경로, 지점(내가 탈 곳 강조), 차 위치
// 화면을 스크롤하다 지도가 끌려가지 않게, 폰은 두 손가락·PC는 Ctrl+휠로만 움직임
export default function RouteMap({ stops, path, vehicle, className }: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const vehicleMarkerRef = useRef<maplibregl.Marker | null>(null)
  const fittedWithVehicleRef = useRef(false)
  // 지도 스타일이 불리기 전에 경로가 먼저 오면 여기 두었다가 불린 뒤 그림
  const pathRef = useRef(path)

  // 지도는 한 번만 만들고, 처음 지점들로 화면을 맞춤
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const map = createMap(container, {
      cooperativeGestures: true,
      locale: {
        'CooperativeGesturesHandler.WindowsHelpText': 'Ctrl 키를 누른 채 스크롤하면 지도를 확대·축소해요',
        'CooperativeGesturesHandler.MacHelpText': '⌘ 키를 누른 채 스크롤하면 지도를 확대·축소해요',
        'CooperativeGesturesHandler.MobileHelpText': '두 손가락으로 지도를 움직여요',
      },
    })
    mapRef.current = map
    fitTo(map, stops, { padding: 40, maxZoom: 15 })
    map.on('load', () => {
      map.addSource(ROUTE_SOURCE, { type: 'geojson', data: lineOf(pathRef.current ?? []) })
      // 경로 아래 흰 테두리 + 위에 파란 선 (차량 앱과 같은 느낌)
      map.addLayer({
        id: 'route-casing',
        type: 'line',
        source: ROUTE_SOURCE,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#ffffff', 'line-width': 7 },
      })
      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: ROUTE_SOURCE,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#3178f6', 'line-width': 4 },
      })
    })
    return () => {
      map.remove()
      mapRef.current = null
      vehicleMarkerRef.current = null
    }
    // 처음 지점으로만 화면을 맞춤. 이후 값이 바뀌어도 사용자가 옮긴 지도를 되돌리지 않음
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 경로 선. 스타일이 아직 안 불렸으면 load 때 pathRef로 그림
  useEffect(() => {
    pathRef.current = path
    const source = mapRef.current?.getSource(ROUTE_SOURCE) as maplibregl.GeoJSONSource | undefined
    source?.setData(lineOf(path ?? []))
  }, [path])

  // 지점 표시
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const markers = stops.map((stop) =>
      new maplibregl.Marker({ element: stopMarker(stop), anchor: 'left', offset: [-7, 0] }).setLngLat(toLngLat(stop)).addTo(map),
    )
    return () => markers.forEach((marker) => marker.remove())
  }, [stops])

  // 차 위치. 처음 들어왔을 때 한 번만 차까지 보이게 화면을 맞춤
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (!vehicle) {
      vehicleMarkerRef.current?.remove()
      vehicleMarkerRef.current = null
      return
    }
    if (vehicleMarkerRef.current) {
      vehicleMarkerRef.current.setLngLat(toLngLat(vehicle))
    } else {
      vehicleMarkerRef.current = new maplibregl.Marker({ element: vehicleMarker() }).setLngLat(toLngLat(vehicle)).addTo(map)
    }
    if (!fittedWithVehicleRef.current) {
      fittedWithVehicleRef.current = true
      fitTo(map, [...stops, vehicle], { padding: 40, maxZoom: 15, duration: 600 })
    }
  }, [vehicle, stops])

  return (
    <div className={cn('relative overflow-hidden rounded-xl bg-surface', className)}>
      {/* maplibre CSS가 이 칸에 position: relative를 넣으므로 absolute 대신 크기를 직접 줌 */}
      <div ref={containerRef} className="size-full" />
    </div>
  )
}

function lineOf(path: RoutePoint[]): maplibregl.GeoJSONSourceSpecification['data'] {
  return { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: path.map(toLngLat) } }
}

const DOT_CLASS: Record<StopRole, string> = {
  origin: 'bg-ink',
  destination: 'bg-ink',
  stop: 'bg-muted',
  board: 'bg-brand',
  alight: 'bg-brand',
}

// 점 + 이름표. 내가 타고 내리는 곳은 파란 점, 굵은 글씨
function stopMarker(stop: MapStop) {
  const mine = stop.role === 'board' || stop.role === 'alight'
  const element = document.createElement('div')
  element.className = 'pointer-events-none flex items-center gap-1'
  const dot = document.createElement('span')
  dot.className = cn('shrink-0 rounded-full border-2 border-white shadow', mine ? 'size-4' : 'size-3', DOT_CLASS[stop.role])
  const label = document.createElement('span')
  label.className = cn(
    'rounded-md px-1.5 py-0.5 text-xs whitespace-nowrap shadow-sm',
    mine ? 'bg-brand font-bold text-white' : 'bg-white/90 font-semibold text-ink',
  )
  label.textContent = stop.role === 'board' ? `${stop.name} (탈 곳)` : stop.role === 'alight' ? `${stop.name} (내릴 곳)` : stop.name
  element.append(dot, label)
  return element
}

// 차: 검은 원 안에 차 아이콘 (lucide car-front), 바깥에 퍼지는 테두리
function vehicleMarker() {
  const element = document.createElement('div')
  element.className = 'pointer-events-none relative flex size-9 items-center justify-center'
  element.innerHTML = `
    <span class="absolute inset-0 animate-ping rounded-full bg-ink-strong/25"></span>
    <span class="relative flex size-9 items-center justify-center rounded-full border-2 border-white bg-ink-strong text-white shadow-md">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="m21 8-2 2-1.5-3.7A2 2 0 0 0 15.646 5H8.4a2 2 0 0 0-1.903 1.257L5 10 3 8"/>
        <path d="M7 14h.01"/><path d="M17 14h.01"/>
        <rect width="18" height="8" x="3" y="10" rx="2"/>
        <path d="M5 18v2"/><path d="M19 18v2"/>
      </svg>
    </span>`
  return element
}
