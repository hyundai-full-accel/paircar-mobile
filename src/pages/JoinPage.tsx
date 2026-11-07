import { zodResolver } from '@hookform/resolvers/zod'
import { CircleCheck, LinkIcon } from 'lucide-react'
import { useState, type SelectHTMLAttributes } from 'react'
import { useForm } from 'react-hook-form'
import { useParams, useSearchParams } from 'react-router'
import { z } from 'zod'
import { ApiError } from '../api/client'
import type { CrewPlace, InvitePreview } from '../api/types'
import heroInvite from '../assets/hero-invite.jpg'
import { BottomBar } from '../components/BottomBar'
import { Button } from '../components/Button'
import { SectionCard } from '../components/Card'
import { CheckRow } from '../components/Choice'
import { Hero } from '../components/Hero'
import { InfoList, InfoRow } from '../components/InfoRow'
import { Page } from '../components/Page'
import { ErrorView, LoadingView } from '../components/StatusView'
import { TextField } from '../components/TextField'
import { useInvite, useJoinAsMember, useJoinCrew, type JoinForm } from '../hooks/useInvite'
import { errorMessage } from '../lib/errors'
import { formatClock, formatDays, formatDotDate } from '../lib/format'
import { getToken } from '../lib/token'

// 초대 링크로 들어온 사람의 크루 참여 (시안 "크루 참여 [1/3] ~ [3/3]")
// 1. 크루 소개 → 2. 이름, 평소 탈 곳 → 3. 정산 기준 동의 후 참여
// 단계는 주소의 ?step=으로 둬서 폰의 뒤로 가기가 이전 단계로 감. 입력값은 이 화면이 들고 있음
// 이미 토큰이 있는 사람(다른 크루 멤버)은 1단계에서 바로 참여
export function JoinPage() {
  const { code = '' } = useParams()
  const [isMember] = useState(() => getToken() !== null) // 참여 중 토큰이 생겨도 흐름이 바뀌지 않게 처음 값으로 고정
  const [searchParams, setSearchParams] = useSearchParams()
  const [form, setForm] = useState<JoinForm>({ nickname: '', boardPlaceId: null, alightPlaceId: null })
  const { data: invite, isPending, error, refetch } = useInvite(code)

  const requested = Number(searchParams.get('step') ?? '1')
  // 이름 없이 3단계 주소로 바로 들어오면 1단계부터
  const step = isMember || (requested === 3 && !form.nickname) || ![1, 2, 3].includes(requested) ? 1 : requested
  const goTo = (next: number) => setSearchParams({ step: String(next) })

  let content
  if (isPending) {
    content = <LoadingView />
  } else if (error) {
    content = isInvalidInvite(error) ? <InvalidInvite error={error} /> : <ErrorView error={error} onRetry={() => refetch()} />
  } else if (step === 1) {
    content = <IntroStep invite={invite} code={code} isMember={isMember} onNext={() => goTo(2)} />
  } else if (step === 2) {
    content = (
      <InfoStep
        places={invite.places}
        initial={form}
        onNext={(value) => {
          setForm(value)
          goTo(3)
        }}
      />
    )
  } else {
    content = <AgreementStep invite={invite} code={code} form={form} />
  }

  return (
    <Page
      title={
        <span className="flex items-center gap-2">
          <CircleCheck className="size-6 fill-ink text-white" />
          크루 참여 {isMember ? '' : `[${step}/3]`}
        </span>
      }
    >
      {content}
    </Page>
  )
}

function isInvalidInvite(error: Error) {
  return error instanceof ApiError && (error.code === 'INVITE_NOT_FOUND' || error.code === 'INVITE_EXPIRED')
}

function InvalidInvite({ error }: { error: Error }) {
  const expired = error instanceof ApiError && error.code === 'INVITE_EXPIRED'
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
      <LinkIcon className="size-10 text-muted" />
      <div className="flex flex-col gap-1">
        <p className="font-semibold">{expired ? '초대 링크가 만료됐어요' : '초대 링크를 찾을 수 없어요'}</p>
        <p className="text-sm text-sub">운전자에게 새 초대 링크를 받아 주세요.</p>
      </div>
    </div>
  )
}

// 1/3 크루 소개
function IntroStep({ invite, code, isMember, onNext }: { invite: InvitePreview; code: string; isMember: boolean; onNext: () => void }) {
  return (
    <>
      <Hero image={heroInvite} className="mx-0 min-h-[300px] rounded-3xl">
        <p className="text-sm text-sub">{formatDotDate(new Date())}</p>
        <h2 className="mt-3 text-[22px] leading-snug font-bold">
          ‘{invite.crewName}’ 크루에
          <br />
          초대되었어요.
        </h2>
        <ul className="mt-auto flex list-inside list-disc flex-col gap-0.5 pt-28 text-xs text-sub">
          <li>차량의 남은 도착 시간 바로 확인</li>
          <li>차에 탑승 시 기록 자동 저장</li>
          <li>월 말, 실비 정산 영수증 확인</li>
        </ul>
      </Hero>
      <CrewInfoCard invite={invite} />
      <BottomBar>
        {isMember ? (
          <JoinAsMemberButton code={code} crewId={invite.crewId} />
        ) : (
          <Button block onClick={onNext}>
            크루 참여하기
          </Button>
        )}
      </BottomBar>
    </>
  )
}

function CrewInfoCard({ invite }: { invite: InvitePreview }) {
  const unset = <span className="text-muted">정해지지 않음</span>
  return (
    <SectionCard title="크루 정보">
      <InfoList>
        <InfoRow label="운전자">{invite.driverNicknames.length > 0 ? invite.driverNicknames.join(', ') : unset}</InfoRow>
        <InfoRow label="운행 요일">{invite.departureDays.length > 0 ? `${formatDays(invite.departureDays)} (기본)` : unset}</InfoRow>
        <InfoRow label="출발 예정">{invite.departureTime ? formatClock(invite.departureTime) : unset}</InfoRow>
        <InfoRow label="함께하는 인원">{invite.memberCount}명</InfoRow>
        <InfoRow label="출발지">{invite.originPlace?.name ?? unset}</InfoRow>
        <InfoRow label="도착지">{invite.destinationPlace?.name ?? unset}</InfoRow>
      </InfoList>
    </SectionCard>
  )
}

function JoinAsMemberButton({ code, crewId }: { code: string; crewId: number }) {
  const join = useJoinAsMember(code, crewId)
  return (
    <div className="flex flex-col gap-2">
      {join.error && <p className="text-center text-sm text-red-600">{errorMessage(join.error)}</p>}
      <Button block loading={join.isPending} onClick={() => join.mutate()}>
        크루 참여하기
      </Button>
    </div>
  )
}

const infoSchema = z
  .object({
    nickname: z.string().trim().min(1, '이름을 입력해 주세요.').max(30, '30자까지 쓸 수 있어요.'),
    boardPlaceId: z.number().nullable(),
    alightPlaceId: z.number().nullable(),
  })
  .refine((it) => it.boardPlaceId === null || it.boardPlaceId !== it.alightPlaceId, {
    message: '탈 곳과 내릴 곳이 같아요.',
    path: ['alightPlaceId'],
  })

// 빈 선택("")은 null, 나머지는 장소 ID 숫자로
const placeIdValue = { setValueAs: (v: string | number | null) => (v === '' || v === null ? null : Number(v)) }

// 2/3 참여 정보 등록: 크루에서 쓸 이름, 평소 탈 곳·내릴 곳 (크루 장소에서 고름)
function InfoStep({ places, initial, onNext }: { places: CrewPlace[]; initial: JoinForm; onNext: (value: JoinForm) => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<JoinForm>({ resolver: zodResolver(infoSchema), defaultValues: initial })

  return (
    <form onSubmit={handleSubmit(onNext)} className="flex flex-col gap-7 pt-2" noValidate>
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold">참여 정보 등록</h2>
        <p className="text-sm text-sub">크루와 연결할 이름, 승하차 지점을 확인해요.</p>
      </div>
      <TextField
        label="크루에서 사용할 이름"
        placeholder="예: 차수아"
        autoComplete="nickname"
        maxLength={30}
        error={errors.nickname?.message}
        {...register('nickname')}
      />
      <div className="flex flex-col gap-2">
        <span className="text-[15px] font-semibold">승하차 지점</span>
        {places.length === 0 ? (
          <p className="rounded-xl bg-surface p-4 text-sm text-sub">크루에 아직 장소가 없어요. 참여한 뒤 내 크루 관리에서 정할 수 있어요.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <PlaceSelect label="탈 곳" places={places} {...register('boardPlaceId', placeIdValue)} />
            <PlaceSelect label="내릴 곳" places={places} {...register('alightPlaceId', placeIdValue)} />
          </div>
        )}
        {errors.alightPlaceId && <p className="text-sm text-red-600">{errors.alightPlaceId.message}</p>}
        <p className="pt-2 text-sm leading-relaxed text-sub">
          등록한 승하차 지점은 운전자와 공유돼요.
          <br />
          오늘만 변경할 때는 오늘의 카풀에서 수정해요.
        </p>
      </div>
      <BottomBar>
        <Button type="submit" block>
          이 정보로 계속
        </Button>
      </BottomBar>
    </form>
  )
}

type PlaceSelectProps = SelectHTMLAttributes<HTMLSelectElement> & { label: string; places: CrewPlace[] }

function PlaceSelect({ label, places, ...props }: PlaceSelectProps) {
  return (
    <select
      aria-label={label}
      className="h-13 w-full rounded-xl bg-surface px-3 text-[15px] outline-none focus:ring-2 focus:ring-ink"
      {...props}
    >
      <option value="">{label} 선택</option>
      {places.map((place) => (
        <option key={place.placeId} value={place.placeId}>
          {place.name}
        </option>
      ))}
    </select>
  )
}

const SETTLEMENT_TEXT = {
  FAIR: '함께 탄 구간만 탄 사람 수로 나눠요',
  EQUAL: '운행 전체 비용을 탄 사람 수로 똑같이 나눠요',
  FIXED_MONTHLY: '매달 정한 금액을 내요',
} as const

// 3/3 경로, 정산 기준 동의 (경로 비교 지도는 아직 없음)
function AgreementStep({ invite, code, form }: { invite: InvitePreview; code: string; form: JoinForm }) {
  const [agreed, setAgreed] = useState(false)
  const join = useJoinCrew(code)

  return (
    <div className="flex flex-col gap-7 pt-2">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold">경로, 정산 기준 동의</h2>
        <p className="text-sm text-sub">함께 타는 비용을 어떻게 나누는지 확인해요.</p>
      </div>
      <SectionCard title="정산 기준">
        <InfoList>
          <InfoRow label="나누는 방법">{SETTLEMENT_TEXT[invite.settlementMode]}</InfoRow>
          <InfoRow label="인원">{invite.includeDriver ? '운전자도 1명으로 셈' : '동승자끼리만 나눔'}</InfoRow>
          <InfoRow label="유류비">차량 실제 연비 × 월평균 유가</InfoRow>
          <InfoRow label="우회 거리">운전자와 내가 둘 다 확인한 거리만</InfoRow>
          <InfoRow label="영수증">매달 1일, 지난달 금액</InfoRow>
        </InfoList>
      </SectionCard>
      <div className="flex flex-col gap-2 rounded-2xl bg-surface-soft p-5">
        <CheckRow checked={agreed} onChange={setAgreed}>
          우회 거리 실비 정산 기준에 동의해요
        </CheckRow>
        <p className="pl-9 text-sm text-sub">실제 금액은 탑승일, 주행거리, 연비, 통행료에 따라 월말에 산출돼요.</p>
      </div>
      {join.error && <p className="text-sm text-red-600">{errorMessage(join.error)}</p>}
      <BottomBar>
        <Button block disabled={!agreed} loading={join.isPending} onClick={() => join.mutate(form)}>
          동의하고 참여하기
        </Button>
      </BottomBar>
    </div>
  )
}
