import { Check, LocateFixed, Plus } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { ApiError } from '../api/client'
import type { CrewMember, CrewPlace } from '../api/types'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Page } from '../components/Page'
import { EmptyView, ErrorView, LoadingView } from '../components/StatusView'
import { TextField } from '../components/TextField'
import { useCrewMembers } from '../hooks/useCrew'
import { useMe } from '../hooks/useMe'
import { useChangeMemberPlaces, useCrewPlaces, useRegisterPlace } from '../hooks/usePlaces'
import { cn } from '../lib/cn'
import { errorMessage } from '../lib/errors'
import { getCurrentPosition } from '../lib/location'
import { NotFoundPage } from './NotFoundPage'

// 평소 탈 곳, 내릴 곳. 운전자는 출발 전에 이 값(과 그날 출석)으로 경유지를 정함
export function MyPlacesPage() {
  const crewId = Number(useParams().crewId)
  if (!Number.isInteger(crewId)) return <NotFoundPage />
  return <MyPlaces crewId={crewId} />
}

function MyPlaces({ crewId }: { crewId: number }) {
  const me = useMe()
  const members = useCrewMembers(crewId)
  const places = useCrewPlaces(crewId)

  let content
  if (me.isError || members.isError || places.isError) {
    content = <ErrorView error={me.error ?? members.error ?? places.error} />
  } else if (me.isPending || members.isPending || places.isPending) {
    content = <LoadingView />
  } else {
    const myMember = members.data.find((it) => it.memberId === me.data.memberId)
    content = myMember ? (
      <MyPlacesForm key={myMember.crewMemberId} crewId={crewId} member={myMember} places={places.data} />
    ) : (
      <EmptyView message="이 크루의 멤버가 아니에요." />
    )
  }

  return (
    <Page title="평소 탈 곳" back>
      {content}
    </Page>
  )
}

function MyPlacesForm({ crewId, member, places }: { crewId: number; member: CrewMember; places: CrewPlace[] }) {
  const navigate = useNavigate()
  const [boardPlaceId, setBoardPlaceId] = useState(member.boardPlace?.placeId ?? null)
  const [alightPlaceId, setAlightPlaceId] = useState(member.alightPlace?.placeId ?? null)
  const save = useChangeMemberPlaces(crewId, member.crewMemberId)

  const unchanged = boardPlaceId === (member.boardPlace?.placeId ?? null) && alightPlaceId === (member.alightPlace?.placeId ?? null)
  const samePlace = boardPlaceId !== null && boardPlaceId === alightPlaceId

  const onSave = () =>
    save.mutate({ boardPlaceId, alightPlaceId }, { onSuccess: () => navigate(`/crews/${crewId}`, { replace: true }) })

  return (
    <>
      <p className="px-1 text-sm text-sub">
        운전자가 출발 전에 이 장소로 경유지를 잡아요. 그날만 다른 곳에서 탈 때는 출석에서 바꾸면 돼요.
      </p>
      <PlacePicker crewId={crewId} title="탈 곳" places={places} selectedId={boardPlaceId} onSelect={setBoardPlaceId} />
      <PlacePicker crewId={crewId} title="내릴 곳" places={places} selectedId={alightPlaceId} onSelect={setAlightPlaceId} />
      {samePlace && <p className="text-sm text-red-600">탈 곳과 내릴 곳이 같아요.</p>}
      {save.error && <p className="text-sm text-red-600">{errorMessage(save.error)}</p>}
      <Button block loading={save.isPending} disabled={unchanged || samePlace} onClick={onSave}>
        저장
      </Button>
    </>
  )
}

type PlacePickerProps = {
  crewId: number
  title: string
  places: CrewPlace[]
  selectedId: number | null
  onSelect: (placeId: number) => void
}

function PlacePicker({ crewId, title, places, selectedId, onSelect }: PlacePickerProps) {
  const [adding, setAdding] = useState(false)

  return (
    <Card className="flex flex-col gap-2">
      <h2 className="font-semibold">{title}</h2>
      {places.length > 0 && (
        <div role="radiogroup" aria-label={title} className="flex flex-col gap-1">
          {places.map((place) => {
            const selected = place.placeId === selectedId
            return (
              <button
                key={place.placeId}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onSelect(place.placeId)}
                className={cn(
                  'flex h-12 items-center gap-3 rounded-xl px-3 text-left transition-colors',
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
                <span className="truncate">{place.name}</span>
              </button>
            )
          })}
        </div>
      )}
      {adding ? (
        <AddPlaceForm
          crewId={crewId}
          onAdded={(placeId) => {
            onSelect(placeId)
            setAdding(false)
          }}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <Button variant="ghost" className="justify-start px-3 text-brand" onClick={() => setAdding(true)}>
          <Plus className="size-5" />
          지금 있는 곳을 새 장소로 추가
        </Button>
      )}
    </Card>
  )
}

// 지금 서 있는 곳을 이름 붙여 크루 장소로 등록 (지도 없이 폰 위치로)
function AddPlaceForm({ crewId, onAdded, onCancel }: { crewId: number; onAdded: (placeId: number) => void; onCancel: () => void }) {
  const [name, setName] = useState('')
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const register = useRegisterPlace(crewId)

  const trimmed = name.trim()

  const onAdd = async () => {
    setError(null)
    setLocating(true)
    try {
      const position = await getCurrentPosition()
      const place = await register.mutateAsync({ name: trimmed, ...position })
      onAdded(place.placeId)
    } catch (e) {
      setError(e)
    } finally {
      setLocating(false)
    }
  }

  const duplicated = error instanceof ApiError && error.code === 'CREW_PLACE_NAME_DUPLICATED'

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-surface-soft p-3">
      <TextField
        label="장소 이름"
        placeholder="예: ○○아파트 정문"
        maxLength={50}
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={duplicated ? '이미 같은 이름의 장소가 있어요. 위 목록에서 골라 주세요.' : undefined}
        autoFocus
      />
      {error != null && !duplicated && <p className="text-sm text-red-600">{errorMessage(error)}</p>}
      <div className="flex gap-2">
        <Button variant="ghost" onClick={onCancel}>
          취소
        </Button>
        <Button className="flex-1" loading={locating} disabled={trimmed.length === 0} onClick={onAdd}>
          <LocateFixed className="size-5" />
          현재 위치로 추가
        </Button>
      </div>
    </div>
  )
}
