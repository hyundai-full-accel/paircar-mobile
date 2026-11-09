import { LocateFixed, MapPin } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { CrewPlace } from '../../api/types'
import { cn } from '../../lib/cn'
import { errorMessage } from '../../lib/errors'
import { getCurrentPosition, type Coordinates } from '../../lib/location'
import { Spinner } from '../Spinner'
import { createMap, fitTo, maplibregl, toLngLat } from './mapBase'

type PlaceMapProps = {
  places: Pick<CrewPlace, 'placeId' | 'name' | 'latitude' | 'longitude'>[] // 이미 있는 장소 (점으로 표시)
  onCenterChange: (center: Coordinates) => void // 가운데 핀이 가리키는 곳
  className?: string
}

// 지도를 움직여 가운데 핀으로 위치를 고르는 지도. 현재 위치 버튼은 핀을 내 위치로 옮기는 도우미
// (현재 위치는 https나 localhost에서만 되지만, 지도로 고르는 건 어디서든 됨)
export default function PlaceMap({ places, onCenterChange, className }: PlaceMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const onCenterChangeRef = useRef(onCenterChange)
  const [locating, setLocating] = useState(false)
  const [locateError, setLocateError] = useState<unknown>(null)

  useEffect(() => {
    onCenterChangeRef.current = onCenterChange
  }, [onCenterChange])

  // 지도는 한 번만 만듦. 처음 위치: 크루 장소가 있으면 모두 보이게, 없으면 기본 위치
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const map = createMap(container)
    mapRef.current = map
    fitTo(map, places)

    const report = () => {
      const { lat, lng } = map.getCenter()
      onCenterChangeRef.current({ latitude: round6(lat), longitude: round6(lng) })
    }
    map.on('moveend', report)
    report()

    return () => {
      map.remove()
      mapRef.current = null
    }
    // 처음 places로만 화면을 맞춤. 장소가 늘어도 사용자가 옮긴 지도를 되돌리지 않음
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 이미 있는 크루 장소: 점 + 이름표
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const markers = places.map((place) =>
      new maplibregl.Marker({ element: placeMarker(place.name), anchor: 'left' }).setLngLat(toLngLat(place)).addTo(map),
    )
    return () => markers.forEach((marker) => marker.remove())
  }, [places])

  const locate = async () => {
    setLocateError(null)
    setLocating(true)
    try {
      const position = await getCurrentPosition()
      mapRef.current?.flyTo({ center: toLngLat(position), zoom: 17 })
    } catch (e) {
      setLocateError(e)
    } finally {
      setLocating(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className={cn('relative overflow-hidden rounded-xl bg-surface', className)}>
        {/* maplibre CSS가 이 칸에 position: relative를 넣으므로 absolute 대신 크기를 직접 줌 */}
        <div ref={containerRef} className="size-full" />
        {/* 가운데 핀: 핀 끝이 지도 가운데에 오도록 위로 올림 */}
        <MapPin
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-1/2 size-9 -translate-x-1/2 -translate-y-full fill-brand text-white drop-shadow"
          strokeWidth={1.5}
        />
        <button
          type="button"
          aria-label="현재 위치로 이동"
          onClick={locate}
          disabled={locating}
          className="absolute top-3 right-3 flex size-11 items-center justify-center rounded-full bg-white text-ink shadow-md active:bg-surface"
        >
          {locating ? <Spinner /> : <LocateFixed className="size-5" />}
        </button>
      </div>
      {locateError != null && <p className="text-sm text-red-600">{errorMessage(locateError)}</p>}
    </div>
  )
}

function placeMarker(name: string) {
  const element = document.createElement('div')
  element.className = 'pointer-events-none flex items-center gap-1'
  const dot = document.createElement('span')
  dot.className = 'size-3 rounded-full border-2 border-white bg-ink shadow'
  const label = document.createElement('span')
  label.className = 'rounded-md bg-white/90 px-1.5 py-0.5 text-xs font-semibold text-ink shadow-sm'
  label.textContent = name
  element.append(dot, label)
  return element
}

// 서버는 소수 6자리까지 받음 (약 10cm)
function round6(value: number) {
  return Math.round(value * 1_000_000) / 1_000_000
}
