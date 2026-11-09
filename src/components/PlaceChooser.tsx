import { Check, MapPin, Plus } from 'lucide-react'
import { lazy, Suspense, useState } from 'react'
import { ApiError } from '../api/client'
import { cn } from '../lib/cn'
import { errorMessage } from '../lib/errors'
import type { Coordinates } from '../lib/location'
import { Button } from './Button'
import { Modal } from './Modal'
import { TextField } from './TextField'

// 지도 라이브러리가 커서 새 장소를 추가할 때만 불러옴
const PlaceMap = lazy(() => import('./map/PlaceMap'))

export type ChoosablePlace = { placeId: number; name: string; latitude: number; longitude: number }
export type NewPlace = { name: string } & Coordinates

type PlaceChooserProps = {
  label: string // 화면 읽기용 이름 (예: 탈 곳)
  places: ChoosablePlace[]
  selectedId: number | null
  onSelect: (placeId: number | null) => void
  // 지도에서 새 장소를 정했을 때. 만든 장소 ID를 돌려주면 그 장소가 골라짐 (실패하면 throw → 창에 오류 표시)
  onCreate: (place: NewPlace) => Promise<number>
  noneLabel?: string // 있으면 맨 위에 "고르지 않음" 선택지 (예: 평소처럼)
  excludeIds?: (number | null | undefined)[] // 목록에서 뺄 장소 (예: 지금 타는 곳)
  disabled?: boolean
}

// 크루 장소 목록에서 고르거나, 지도에서 위치를 찍고 이름을 붙여 새 장소로 추가
// 크루 참여, 평소 탈 곳, 지점 변경, 출석에서 같이 씀
export function PlaceChooser({ label, places, selectedId, onSelect, onCreate, noneLabel, excludeIds = [], disabled }: PlaceChooserProps) {
  const [adding, setAdding] = useState(false)
  const shown = places.filter((place) => !excludeIds.includes(place.placeId))

  return (
    <div className="flex flex-col gap-1">
      {(noneLabel !== undefined || shown.length > 0) && (
        <div role="radiogroup" aria-label={label} className="flex flex-col gap-1">
          {noneLabel !== undefined && (
            <PlaceOption name={noneLabel} selected={selectedId === null} disabled={disabled} onClick={() => onSelect(null)} />
          )}
          {shown.map((place) => (
            <PlaceOption
              key={place.placeId}
              name={place.name}
              selected={place.placeId === selectedId}
              disabled={disabled}
              onClick={() => onSelect(place.placeId)}
            />
          ))}
        </div>
      )}
      <Button variant="ghost" className="justify-start px-3 text-brand" disabled={disabled} onClick={() => setAdding(true)}>
        <Plus className="size-5" />
        지도에서 새 장소 추가
      </Button>
      {adding && (
        <NewPlaceModal
          title={`새 ${label} 추가`}
          places={places}
          onClose={() => setAdding(false)}
          onSubmit={async (place) => {
            const placeId = await onCreate(place)
            onSelect(placeId)
            setAdding(false)
          }}
        />
      )}
    </div>
  )
}

function PlaceOption({ name, selected, disabled, onClick }: { name: string; selected: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex h-12 items-center gap-3 rounded-xl px-3 text-left transition-colors disabled:opacity-60',
        selected ? 'bg-brand-soft font-semibold text-brand' : 'active:bg-surface',
      )}
    >
      <span
        className={cn(
          'flex size-5 shrink-0 items-center justify-center rounded-full border-2',
          selected ? 'border-brand bg-brand text-white' : 'border-line',
        )}
      >
        {selected && <Check className="size-3" strokeWidth={3} />}
      </span>
      <span className="truncate">{name}</span>
    </button>
  )
}

type NewPlaceModalProps = {
  title: string
  places: ChoosablePlace[] // 지도에 점으로 보여 주고, 같은 이름을 막는 데 씀
  onClose: () => void
  onSubmit: (place: NewPlace) => Promise<void>
}

// 이름 + 지도 가운데 핀 위치로 새 장소를 정하는 창
function NewPlaceModal({ title, places, onClose, onSubmit }: NewPlaceModalProps) {
  const [name, setName] = useState('')
  const [center, setCenter] = useState<Coordinates | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<unknown>(null)

  const trimmed = name.trim()
  // 크루 안에서 장소 이름은 하나뿐 (서버도 같은 이름을 막음)
  const duplicated =
    places.some((place) => place.name.trim() === trimmed) || (error instanceof ApiError && error.code === 'CREW_PLACE_NAME_DUPLICATED')

  const submit = async () => {
    if (!center || !trimmed || duplicated) return
    setError(null)
    setPending(true)
    try {
      await onSubmit({ name: trimmed, ...center })
    } catch (e) {
      setError(e)
    } finally {
      setPending(false)
    }
  }

  return (
    <Modal open onClose={onClose} title={title}>
      <TextField
        label="장소 이름"
        placeholder="예: ○○아파트 정문"
        maxLength={50}
        value={name}
        onChange={(e) => {
          setName(e.target.value)
          setError(null)
        }}
        error={duplicated ? '이미 같은 이름의 장소가 있어요. 목록에서 골라 주세요.' : undefined}
        autoFocus
      />
      <div className="flex flex-col gap-2">
        <p className="text-sm text-sub">지도를 움직여 핀을 장소에 맞춰 주세요.</p>
        <Suspense fallback={<div className="flex h-60 items-center justify-center rounded-xl bg-surface text-sm text-muted">지도를 불러오는 중…</div>}>
          <PlaceMap places={places} onCenterChange={setCenter} className="h-60" />
        </Suspense>
      </div>
      {error != null && !duplicated && <p className="text-sm text-red-600">{errorMessage(error)}</p>}
      <div className="grid grid-cols-[auto_1fr] gap-2">
        <Button variant="secondary" onClick={onClose}>
          취소
        </Button>
        <Button loading={pending} disabled={!trimmed || !center || duplicated} onClick={submit}>
          <MapPin className="size-5" />이 위치로 정하기
        </Button>
      </div>
    </Modal>
  )
}
