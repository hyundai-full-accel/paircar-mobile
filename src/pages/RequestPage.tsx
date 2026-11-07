import { CheckCheck } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import type { Crew, CrewMember, CrewPlace, Trip } from '../api/types'
import { BottomBar } from '../components/BottomBar'
import { Button } from '../components/Button'
import { ChoiceCard } from '../components/Choice'
import { Modal } from '../components/Modal'
import { NotificationButton } from '../components/NotificationButton'
import { Page } from '../components/Page'
import { EmptyView, ErrorView, LoadingView } from '../components/StatusView'
import { useChangeAttendance } from '../hooks/useAttendance'
import { useCrewView, useCurrentTrip } from '../hooks/useCrew'
import { useCrewPlaces } from '../hooks/usePlaces'
import { useTripRequest } from '../hooks/useTrip'
import { cn } from '../lib/cn'
import { formatServiceDate, todayKst, upcomingCarpoolDays } from '../lib/dates'
import { errorMessage } from '../lib/errors'
import { NotFoundPage } from './NotFoundPage'

type RequestType = 'late' | 'absent' | 'place'

const TYPES: { type: RequestType; title: string; description: string }[] = [
  { type: 'late', title: '조금 늦어요', description: '경로는 유지되고, 도착 예정 시간만 전달해요.' },
  { type: 'absent', title: '오늘은 안 타요', description: '오늘 경유지와 정산 기록에서 제외돼요.' },
  { type: 'place', title: '승차 지점을 변경해요', description: '이번 운행에서만 새로운 지점으로 변경해요.' },
]

const DELAY_MINUTES = [5, 10]

// 변경 사항 요청 (시안 M05): 지각, 불참, 승차 지점 변경을 운전자에게 전달
// 운행 중이면 그 운행에 바로 반영(운전자 차량 앱이 음성으로 읽어 줌)하고, 출발 전이면 그날 출석을 바꿈
export function RequestPage() {
  const crewId = Number(useParams().crewId)
  if (!Number.isInteger(crewId)) return <NotFoundPage />
  return <Request crewId={crewId} />
}

function Request({ crewId }: { crewId: number }) {
  const view = useCrewView(crewId)
  const currentTrip = useCurrentTrip(crewId)
  const places = useCrewPlaces(crewId)

  let content
  if (view.error || places.error) {
    content = <ErrorView error={view.error ?? places.error} onRetry={view.refetch} />
  } else if (view.isPending || currentTrip.isPending || places.isPending || !view.crew) {
    content = <LoadingView />
  } else if (!view.myMember) {
    content = <EmptyView message="이 크루의 멤버가 아니에요." />
  } else {
    content = <RequestForm crew={view.crew} me={view.myMember} trip={currentTrip.data ?? null} places={places.data ?? []} />
  }

  return (
    <Page title="변경 사항 요청" back action={<NotificationButton />}>
      {content}
    </Page>
  )
}

type RequestFormProps = { crew: Crew; me: CrewMember; trip: Trip | null; places: CrewPlace[] }

function RequestForm({ crew, me, trip, places }: RequestFormProps) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initial = searchParams.get('type')
  const [type, setType] = useState<RequestType>(TYPES.some((it) => it.type === initial) ? (initial as RequestType) : 'late')
  const [minutes, setMinutes] = useState(DELAY_MINUTES[0])
  const [sent, setSent] = useState(false)

  const myBoarding = trip?.boardings.find((it) => it.crewMemberId === me.crewMemberId)
  // 운행 중이고 아직 안 탔으면 그 운행에, 운행 전이면 다음 카풀 날 출석에 반영
  const mode = trip ? (myBoarding ? (myBoarding.boardedAt ? 'boarded' : 'trip') : 'excluded') : 'before'
  const [date] = upcomingCarpoolDays(crew.departureDays, 1)
  const currentPlaceId = myBoarding?.boardPlaceId ?? me.boardPlace?.placeId ?? null
  const [placeId, setPlaceId] = useState<number | null>(places.find((it) => it.placeId !== currentPlaceId)?.placeId ?? null)

  const tripRequest = useTripRequest(trip?.tripId ?? 0, me.crewMemberId)
  const attendance = useChangeAttendance(crew.crewId, me.crewMemberId)
  const pending = tripRequest.delay.isPending || tripRequest.cancel.isPending || tripRequest.changePlace.isPending || attendance.isPending
  const error = tripRequest.delay.error ?? tripRequest.cancel.error ?? tripRequest.changePlace.error ?? attendance.error

  const blocked = blockedReason(type, mode, placeId)
  const onDone = { onSuccess: () => setSent(true) }
  const send = () => {
    if (mode === 'trip') {
      if (type === 'late') tripRequest.delay.mutate(minutes, onDone)
      if (type === 'absent') tripRequest.cancel.mutate(undefined, onDone)
      if (type === 'place' && placeId) tripRequest.changePlace.mutate(placeId, onDone)
    } else if (mode === 'before') {
      if (type === 'absent') attendance.mutate({ date, attending: false, boardPlaceId: null }, onDone)
      if (type === 'place' && placeId) attendance.mutate({ date, attending: true, boardPlaceId: placeId }, onDone)
    }
  }

  return (
    <div className="flex flex-col gap-7 pt-2">
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">변경할 내용을 선택하세요.</h2>
        {mode === 'before' && (
          <p className="text-sm text-sub">
            아직 출발 전이에요. {date === todayKst() ? '오늘' : formatServiceDate(date)} 카풀에 반영돼요.
          </p>
        )}
        <div role="radiogroup" aria-label="변경할 내용" className="flex flex-col gap-3">
          {TYPES.map((it) => (
            <ChoiceCard key={it.type} title={it.title} description={it.description} selected={type === it.type} onSelect={() => setType(it.type)} />
          ))}
        </div>
      </section>

      {type === 'late' && (
        <section className="flex flex-col gap-3">
          <h2 className="text-[17px] font-bold">얼마나 늦나요?</h2>
          <div className="flex gap-2">
            {DELAY_MINUTES.map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={minutes === m}
                onClick={() => setMinutes(m)}
                className={cn('h-10 rounded-full px-5 text-[15px] font-medium', minutes === m ? 'bg-ink text-white' : 'bg-surface text-ink')}
              >
                {m}분
              </button>
            ))}
          </div>
          <p className="rounded-xl border border-line p-4 text-[15px] text-sub">
            예상 안내: “{me.nickname}님이 {minutes}분 늦어요.”
          </p>
        </section>
      )}

      {type === 'place' && (
        <section className="flex flex-col gap-3">
          <h2 className="text-[17px] font-bold">어디서 탈까요?</h2>
          <select
            aria-label="새 승차 지점"
            value={placeId ?? ''}
            onChange={(e) => setPlaceId(e.target.value ? Number(e.target.value) : null)}
            className="h-13 rounded-xl bg-surface px-4 text-base outline-none focus:ring-2 focus:ring-ink"
          >
            {places
              .filter((it) => it.placeId !== currentPlaceId)
              .map((it) => (
                <option key={it.placeId} value={it.placeId}>
                  {it.name}
                </option>
              ))}
          </select>
        </section>
      )}

      <p className="text-xs text-muted">*변경된 내용은 운전자에게 음성으로 전달돼요.</p>
      {blocked && <p className="text-sm text-sub">{blocked}</p>}
      {error && <p className="text-sm text-red-600">{errorMessage(error)}</p>}

      <BottomBar>
        <Button block loading={pending} disabled={blocked !== null} onClick={send}>
          운전자에게 전달하기
        </Button>
      </BottomBar>

      <Modal open={sent} onClose={() => navigate(`/crews/${crew.crewId}`, { replace: true })}>
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <CheckCheck className="size-7" />
          <p className="text-[17px] font-bold">정상적으로 요청을 보냈어요.</p>
        </div>
        <Button block variant="secondary" onClick={() => navigate(`/crews/${crew.crewId}`, { replace: true })}>
          확인
        </Button>
      </Modal>
    </div>
  )
}

// 보낼 수 없는 경우와 그 이유. null이면 보낼 수 있음
function blockedReason(type: RequestType, mode: string, placeId: number | null): string | null {
  if (mode === 'boarded') return '이미 탔어요. 내린 뒤에 바꿀 수 있어요.'
  if (mode === 'excluded') return '오늘 운행에서 이미 빠졌어요.'
  if (type === 'late' && mode === 'before') return '지각 알림은 운전자가 출발한 뒤에 보낼 수 있어요.'
  if (type === 'place' && placeId === null) return '바꿀 수 있는 다른 장소가 없어요. 내 크루 관리에서 장소를 추가해 주세요.'
  return null
}
