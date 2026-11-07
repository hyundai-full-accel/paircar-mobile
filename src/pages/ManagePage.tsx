import { CalendarDays, ChevronRight, Copy, MapPin, UserPlus } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import type { Crew, CrewMember } from '../api/types'
import { crewSections } from '../app/sections'
import heroCrew from '../assets/hero-crew.jpg'
import { Button } from '../components/Button'
import { SectionCard } from '../components/Card'
import { Chip } from '../components/Chip'
import { Hero, HeroDivider } from '../components/Hero'
import { InfoList, InfoRow } from '../components/InfoRow'
import { Modal } from '../components/Modal'
import { HeaderButton, Page } from '../components/Page'
import { EmptyView, ErrorView, LoadingView } from '../components/StatusView'
import { Timeline, type TimelineItem } from '../components/Timeline'
import { useCrewView } from '../hooks/useCrew'
import { useCreateInvite } from '../hooks/useInvite'
import { cn } from '../lib/cn'
import { errorMessage } from '../lib/errors'
import { formatClock, formatDays, formatDotDate, formatMonthDay } from '../lib/format'
import { NotFoundPage } from './NotFoundPage'

// 내 크루 관리 (시안 M-09): 크루 일정, 내 경로, 크루 정보, 크루 멤버, 초대
export function ManagePage() {
  const crewId = Number(useParams().crewId)
  if (!Number.isInteger(crewId)) return <NotFoundPage />
  return <Manage crewId={crewId} />
}

function Manage({ crewId }: { crewId: number }) {
  const view = useCrewView(crewId)
  const [inviting, setInviting] = useState(false)
  const invite = useCreateInvite(crewId)
  // 열 때마다 새 링크를 만듦 (7일 유효)
  const openInvite = () => {
    setInviting(true)
    invite.mutate()
  }

  let content
  if (view.error) {
    content = <ErrorView error={view.error} onRetry={view.refetch} />
  } else if (view.isPending || !view.crew || !view.members) {
    content = <LoadingView />
  } else if (!view.myMember) {
    content = <EmptyView message="이 크루의 멤버가 아니에요." />
  } else {
    content = (
      <>
        <CrewHero crew={view.crew} members={view.members} />
        <RouteCard crew={view.crew} me={view.myMember} />
        <CrewInfoCard crew={view.crew} members={view.members} />
        <MemberCard members={view.members} me={view.myMember} />
        <SettingsCard crewId={crewId} />
      </>
    )
  }

  return (
    <Page
      title="내 크루 관리"
      sections={crewSections(crewId)}
      action={
        <HeaderButton label="크루 초대하기" onClick={openInvite}>
          <UserPlus className="size-5 text-ink" />
        </HeaderButton>
      }
    >
      {content}
      <InviteModal invite={invite} open={inviting} onClose={() => setInviting(false)} />
    </Page>
  )
}

// 크루 이름, 시작일, 출발 시각, 요일 (도착 예정 시각은 서버에 아직 없음)
function CrewHero({ crew, members }: { crew: Crew; members: CrewMember[] }) {
  const startedAt = members.map((it) => it.joinedAt).sort()[0]
  return (
    <Hero image={heroCrew}>
      {startedAt && <p className="text-sm text-sub">{formatDotDate(startedAt)} ~</p>}
      <p className="mt-3 text-[17px] font-bold">{crew.name}</p>
      <HeroDivider />
      <p className="text-[34px] leading-none font-bold tabular-nums">{crew.departureTime ?? '—:—'}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {crew.departureDays.length > 0 && <Chip>{formatDays(crew.departureDays)}</Chip>}
        {crew.departureTime && <Chip>{formatClock(crew.departureTime)} 출발</Chip>}
        {!crew.departureTime && crew.departureDays.length === 0 && <Chip>일정 미정</Chip>}
      </div>
    </Hero>
  )
}

// 경로 상세: 출발 → 내가 타는 곳 → 내리는 곳 (각 지점 예상 시각은 서버에 아직 없어 출발 시각만)
function RouteCard({ crew, me }: { crew: Crew; me: CrewMember }) {
  const items: TimelineItem[] = []
  if (crew.originPlace) items.push({ time: crew.departureTime ?? undefined, text: crew.originPlace.name })
  items.push({ text: me.boardPlace ? `${me.boardPlace.name}에서 탑승` : '탈 곳을 정해 주세요' })
  const alight = me.alightPlace ?? crew.destinationPlace
  if (alight) items.push({ text: `${alight.name}에서 하차` })

  return (
    <SectionCard title="경로 상세" to={`/crews/${crew.crewId}/my-places`}>
      <Timeline items={items} />
    </SectionCard>
  )
}

function CrewInfoCard({ crew, members }: { crew: Crew; members: CrewMember[] }) {
  const unset = <span className="text-muted">정해지지 않음</span>
  const drivers = members.filter((it) => it.driver).map((it) => it.nickname)
  return (
    <SectionCard title="크루 정보">
      <InfoList>
        <InfoRow label="운전자">{drivers.length > 0 ? drivers.join(', ') : unset}</InfoRow>
        <InfoRow label="운행 요일">{crew.departureDays.length > 0 ? `${formatDays(crew.departureDays)} (기본)` : unset}</InfoRow>
        <InfoRow label="출발 예정">{crew.departureTime ? formatClock(crew.departureTime) : unset}</InfoRow>
        <InfoRow label="함께하는 인원">{members.length}명</InfoRow>
        <InfoRow label="출발지">{crew.originPlace?.name ?? unset}</InfoRow>
        <InfoRow label="도착지">{crew.destinationPlace?.name ?? unset}</InfoRow>
      </InfoList>
    </SectionCard>
  )
}

function MemberCard({ members, me }: { members: CrewMember[]; me: CrewMember }) {
  return (
    <SectionCard title="크루 멤버">
      <ul className="flex flex-col gap-4">
        {members.map((member) => (
          <li key={member.crewMemberId} className="flex items-center gap-3 text-[15px]">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-semibold text-sub">
              {member.nickname.slice(0, 1)}
            </span>
            <span className="flex-1 font-medium">
              {member.nickname}
              {member.crewMemberId === me.crewMemberId && <span className="ml-1.5 text-xs text-brand">나</span>}
            </span>
            <span className="text-sub">{member.driver ? '운전자' : '동승자'}</span>
          </li>
        ))}
      </ul>
    </SectionCard>
  )
}

// 시안에 없는 화면(평소 탈 곳, 여러 날 출석)으로 가는 입구
function SettingsCard({ crewId }: { crewId: number }) {
  return (
    <SectionCard title="내 설정">
      <div className="flex flex-col">
        <SettingLink to={`/crews/${crewId}/my-places`} icon={<MapPin className="size-5" />}>
          평소 탈 곳, 내릴 곳
        </SettingLink>
        <SettingLink to={`/crews/${crewId}/attendance`} icon={<CalendarDays className="size-5" />}>
          다가오는 카풀 출석
        </SettingLink>
      </div>
    </SectionCard>
  )
}

function SettingLink({ to, icon, children }: { to: string; icon: ReactNode; children: ReactNode }) {
  return (
    <Link to={to} className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-3 text-[15px] active:bg-surface">
      <span className="text-sub">{icon}</span>
      <span className="flex-1">{children}</span>
      <ChevronRight className="size-5 text-muted" />
    </Link>
  )
}

// 크루 초대하기 (시안 "https://crew.car/... 복사")
function InviteModal({ invite: create, open, onClose }: { invite: ReturnType<typeof useCreateInvite>; open: boolean; onClose: () => void }) {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const invite = create.data
  const copied = invite !== undefined && copiedUrl === invite.inviteUrl

  const copy = async () => {
    if (!invite) return
    try {
      await navigator.clipboard.writeText(invite.inviteUrl)
      setCopiedUrl(invite.inviteUrl)
    } catch {
      setCopiedUrl(null)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="크루 초대하기">
      <div className="flex h-13 items-center gap-2 rounded-xl bg-surface px-4">
        <span className={cn('flex-1 truncate text-[15px]', !invite && 'text-muted')}>
          {invite?.inviteUrl ?? (create.isError ? '링크를 만들지 못했어요' : '링크를 만드는 중…')}
        </span>
        <button type="button" aria-label="링크 복사" disabled={!invite} onClick={copy} className="text-sub disabled:opacity-40">
          <Copy className="size-5" />
        </button>
      </div>
      <p className="text-sm text-sub">
        {invite ? `초대 링크는 ${formatMonthDay(invite.expiresAt)}에 만료돼요.` : '초대 링크는 7일 동안 쓸 수 있어요.'}
        {copied && ' 복사했어요.'}
      </p>
      {create.isError && <p className="text-sm text-red-600">{errorMessage(create.error)}</p>}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={onClose}>
          취소
        </Button>
        <Button disabled={!invite} onClick={copy}>
          {copied ? '복사됨' : '복사'}
        </Button>
      </div>
    </Modal>
  )
}
