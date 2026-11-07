import type { UseQueryResult } from '@tanstack/react-query'
import { useParams } from 'react-router'
import type { Attendance, CrewMember, CrewPlace } from '../api/types'
import { Card } from '../components/Card'
import { Page } from '../components/Page'
import { Spinner } from '../components/Spinner'
import { EmptyView, ErrorView, LoadingView } from '../components/StatusView'
import { useAttendances, useChangeAttendance } from '../hooks/useAttendance'
import { useCrew, useMyCrewMember } from '../hooks/useCrew'
import { useCrewPlaces } from '../hooks/usePlaces'
import { cn } from '../lib/cn'
import { upcomingCarpoolDays, formatServiceDate } from '../lib/dates'
import { errorMessage } from '../lib/errors'
import { NotFoundPage } from './NotFoundPage'

// 다가오는 카풀 날마다 "타요 / 안 타요", 그날만 다른 탈 곳
// 기록이 없으면 서버 기본값(탐, 평소 탈 곳). 바꾸면 운전자 차량 앱에 바로 알림이 감
export function AttendancePage() {
  const crewId = Number(useParams().crewId)
  if (!Number.isInteger(crewId)) return <NotFoundPage />
  return <AttendanceList crewId={crewId} />
}

const DAY_COUNT = 7

function AttendanceList({ crewId }: { crewId: number }) {
  const crew = useCrew(crewId)
  const myMember = useMyCrewMember(crewId)
  const places = useCrewPlaces(crewId)
  const dates = crew.data ? upcomingCarpoolDays(crew.data.departureDays, DAY_COUNT) : []
  const attendances = useAttendances(crewId, dates)

  let content
  if (crew.isError || myMember.error || places.isError) {
    content = <ErrorView error={crew.error ?? myMember.error ?? places.error} />
  } else if (crew.isPending || myMember.isPending || places.isPending) {
    content = <LoadingView />
  } else if (!myMember.data) {
    content = <EmptyView message="이 크루의 멤버가 아니에요." />
  } else {
    const member = myMember.data
    content = (
      <>
        <p className="px-1 text-sm text-gray-600">안 타는 날만 바꾸면 돼요. 바꾸면 운전자에게 바로 알려 줘요.</p>
        {dates.map((date, i) => (
          <DayCard key={date} crewId={crewId} date={date} member={member} places={places.data} query={attendances[i]} />
        ))}
      </>
    )
  }

  return (
    <Page title="출석" back>
      {content}
    </Page>
  )
}

type DayCardProps = {
  crewId: number
  date: string
  member: CrewMember
  places: CrewPlace[]
  query: UseQueryResult<Attendance[]>
}

function DayCard({ crewId, date, member, places, query }: DayCardProps) {
  const change = useChangeAttendance(crewId, member.crewMemberId)
  const mine = query.data?.find((it) => it.crewMemberId === member.crewMemberId)
  const defaultPlaceId = member.boardPlace?.placeId ?? null
  // 그날만 바꾼 탈 곳. 평소 탈 곳과 같으면 바꾸지 않은 것
  const overridePlaceId = mine?.boardPlace && mine.boardPlace.placeId !== defaultPlaceId ? mine.boardPlace.placeId : null

  const set = (attending: boolean, boardPlaceId: number | null) => change.mutate({ date, attending, boardPlaceId })

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{formatServiceDate(date)}</h2>
        {(query.isFetching || change.isPending) && <Spinner className="size-4 text-gray-400" />}
      </div>
      {query.isError ? (
        <p className="text-sm text-red-600">{errorMessage(query.error)}</p>
      ) : mine ? (
        <>
          <div role="radiogroup" aria-label={`${formatServiceDate(date)} 출석`} className="grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1">
            <Segment selected={mine.attending} disabled={change.isPending} onClick={() => set(true, overridePlaceId)}>
              타요
            </Segment>
            <Segment selected={!mine.attending} disabled={change.isPending} onClick={() => set(false, null)}>
              안 타요
            </Segment>
          </div>
          {mine.attending && (
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-gray-500">이날 탈 곳</span>
              <select
                value={overridePlaceId ?? ''}
                disabled={change.isPending}
                onChange={(e) => set(true, e.target.value ? Number(e.target.value) : null)}
                className="h-12 rounded-xl border border-gray-300 bg-white px-3 text-base outline-none focus:border-brand"
              >
                <option value="">{member.boardPlace ? `평소처럼 (${member.boardPlace.name})` : '평소 탈 곳 없음'}</option>
                {places
                  .filter((place) => place.placeId !== defaultPlaceId)
                  .map((place) => (
                    <option key={place.placeId} value={place.placeId}>
                      {place.name}
                    </option>
                  ))}
              </select>
            </label>
          )}
          {change.error && <p className="text-sm text-red-600">{errorMessage(change.error)}</p>}
        </>
      ) : (
        <div className="h-24" />
      )}
    </Card>
  )
}

function Segment({ selected, disabled, onClick, children }: { selected: boolean; disabled: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={selected ? undefined : onClick}
      className={cn(
        'h-10 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60',
        selected ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500',
      )}
    >
      {children}
    </button>
  )
}
