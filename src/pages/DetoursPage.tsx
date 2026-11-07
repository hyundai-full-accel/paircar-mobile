import { CircleCheck } from 'lucide-react'
import { useParams } from 'react-router'
import type { CrewMember, CrewPlace, Detour } from '../api/types'
import { Button } from '../components/Button'
import { Card, SectionCard } from '../components/Card'
import { Chip } from '../components/Chip'
import { InfoList, InfoRow } from '../components/InfoRow'
import { NotificationButton } from '../components/NotificationButton'
import { Page } from '../components/Page'
import { EmptyView, ErrorView, LoadingView } from '../components/StatusView'
import { useCrewView } from '../hooks/useCrew'
import { useCrewPlaces } from '../hooks/usePlaces'
import { useConfirmDetour, useCrewDetours } from '../hooks/useTrip'
import { cn } from '../lib/cn'
import { errorMessage } from '../lib/errors'
import { formatKm } from '../lib/format'
import { NotFoundPage } from './NotFoundPage'

// 우회 거리 확인 (시안 없음, 같은 스타일). 폰 알림 "우회 거리를 확인해 주세요"를 누르면 열림
// 운전자가 나를 태우러 더 달리는 거리. 운전자와 내가 둘 다 확인해야 정산에 들어감
export function DetoursPage() {
  const crewId = Number(useParams().crewId)
  if (!Number.isInteger(crewId)) return <NotFoundPage />
  return <Detours crewId={crewId} />
}

function Detours({ crewId }: { crewId: number }) {
  const view = useCrewView(crewId)
  const detours = useCrewDetours(crewId)
  const places = useCrewPlaces(crewId)

  let content
  if (view.error || detours.error || places.error) {
    content = <ErrorView error={view.error ?? detours.error ?? places.error} onRetry={view.refetch} />
  } else if (view.isPending || detours.isPending || places.isPending || !view.members) {
    content = <LoadingView />
  } else if (!view.myMember) {
    content = <EmptyView message="이 크루의 멤버가 아니에요." />
  } else {
    const me = view.myMember
    // 내가 동승자이거나 운전자인 것만
    const mine = detours.data.filter((it) => it.passengerId === me.crewMemberId || it.driverId === me.crewMemberId)
    content = (
      <>
        <Card className="flex flex-col gap-2 bg-surface-soft">
          <h2 className="font-bold">우회 거리가 뭔가요?</h2>
          <p className="text-sm leading-relaxed text-sub">
            운전자가 나를 태우거나 내려 주느라 원래 길보다 더 달리는 거리예요. 이 거리의 기름값은 내가 내요. 운전자와 내가 둘 다 확인한 거리만
            정산에 들어가요.
          </p>
        </Card>
        {mine.length === 0 ? (
          <EmptyView message="확인할 우회 거리가 없어요." />
        ) : (
          mine.map((detour) => (
            <DetourCard key={detour.detourId} crewId={crewId} detour={detour} me={me} members={view.members ?? []} places={places.data} />
          ))
        )}
      </>
    )
  }

  return (
    <Page title="우회 거리 확인" back action={<NotificationButton />}>
      {content}
    </Page>
  )
}

type DetourCardProps = { crewId: number; detour: Detour; me: CrewMember; members: CrewMember[]; places: CrewPlace[] }

function DetourCard({ crewId, detour, me, members, places }: DetourCardProps) {
  const confirm = useConfirmDetour(crewId)
  const nickname = (crewMemberId: number) => members.find((it) => it.crewMemberId === crewMemberId)?.nickname ?? '알 수 없음'
  const placeName = places.find((it) => it.placeId === detour.placeId)?.name ?? '알 수 없는 장소'
  const iAmDriver = detour.driverId === me.crewMemberId
  const myConfirmedAt = iAmDriver ? detour.driverConfirmedAt : detour.passengerConfirmedAt
  const otherConfirmedAt = iAmDriver ? detour.passengerConfirmedAt : detour.driverConfirmedAt

  let status = '확인이 필요해요'
  if (detour.confirmed) status = '확정됐어요'
  else if (myConfirmedAt) status = `${nickname(iAmDriver ? detour.passengerId : detour.driverId)}님 확인을 기다려요`

  return (
    <SectionCard title={placeName}>
      <div className="flex items-baseline justify-between">
        <span className="text-[30px] leading-none font-bold tabular-nums">+ {formatKm(detour.detourKm)}</span>
        <Chip className={cn(detour.confirmed ? 'bg-brand-soft text-brand' : 'bg-surface')}>{status}</Chip>
      </div>
      <InfoList>
        <InfoRow label="운전자">{nickname(detour.driverId)}</InfoRow>
        <InfoRow label="동승자">{nickname(detour.passengerId)}</InfoRow>
        <InfoRow label="운전자 확인">{detour.driverConfirmedAt ? '확인함' : '아직'}</InfoRow>
        <InfoRow label="동승자 확인">{detour.passengerConfirmedAt ? '확인함' : '아직'}</InfoRow>
      </InfoList>
      {confirm.error && <p className="text-sm text-red-600">{errorMessage(confirm.error)}</p>}
      {myConfirmedAt ? (
        <p className="flex items-center gap-1.5 text-sm text-sub">
          <CircleCheck className="size-4" />
          {otherConfirmedAt ? '둘 다 확인했어요. 이 거리로 정산해요.' : '내가 확인했어요.'}
        </p>
      ) : (
        <Button block loading={confirm.isPending} onClick={() => confirm.mutate(detour.detourId)}>
          이 거리가 맞아요
        </Button>
      )}
    </SectionCard>
  )
}
