import { zodResolver } from '@hookform/resolvers/zod'
import { LinkIcon, Users } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useParams } from 'react-router'
import { z } from 'zod'
import { ApiError } from '../api/client'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Page } from '../components/Page'
import { ErrorView, LoadingView } from '../components/StatusView'
import { TextField } from '../components/TextField'
import { useInvite, useJoinAsMember, useJoinAsNewMember } from '../hooks/useInvite'
import { useToken } from '../hooks/useToken'
import { errorMessage } from '../lib/errors'
import { formatMonthDay } from '../lib/format'

// 초대 링크, QR로 들어오는 화면
// 처음 온 사람은 닉네임만 넣으면 참여(토큰 발급), 이미 토큰이 있는 사람은 버튼 하나로 참여
export function JoinPage() {
  const { code = '' } = useParams()
  const token = useToken()
  const { data: invite, isPending, error, refetch } = useInvite(code)

  return (
    <Page title="크루 참여">
      {isPending ? (
        <LoadingView />
      ) : error ? (
        isInvalidInvite(error) ? <InvalidInvite error={error} /> : <ErrorView error={error} onRetry={() => refetch()} />
      ) : (
        <>
          <Card className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-brand-soft text-brand">
              <Users className="size-7" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm text-gray-500">카풀 크루에 초대받았어요</p>
              <p className="text-xl font-bold">{invite.crewName}</p>
            </div>
            <p className="text-xs text-gray-400">{formatMonthDay(invite.expiresAt)}까지 유효한 초대예요</p>
          </Card>
          {token ? <JoinAsMember code={code} crewId={invite.crewId} /> : <JoinAsNewMember code={code} />}
        </>
      )}
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
      <LinkIcon className="size-10 text-gray-300" />
      <div className="flex flex-col gap-1">
        <p className="font-semibold">{expired ? '초대 링크가 만료됐어요' : '초대 링크를 찾을 수 없어요'}</p>
        <p className="text-sm text-gray-500">운전자에게 새 초대 링크를 받아 주세요.</p>
      </div>
    </div>
  )
}

const nicknameSchema = z.object({
  nickname: z.string().trim().min(1, '닉네임을 입력해 주세요.').max(30, '30자까지 쓸 수 있어요.'),
})

type NicknameForm = z.infer<typeof nicknameSchema>

function JoinAsNewMember({ code }: { code: string }) {
  const join = useJoinAsNewMember(code)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<NicknameForm>({ resolver: zodResolver(nicknameSchema) })

  const onSubmit = handleSubmit(({ nickname }) =>
    join.mutate(nickname, {
      onError: (e) => {
        const fieldError = e instanceof ApiError ? e.fieldErrors.find((it) => it.field === 'nickname') : undefined
        if (fieldError) setError('nickname', { message: fieldError.reason })
      },
    }),
  )

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <TextField
        label="닉네임"
        placeholder="예: 수아"
        autoComplete="nickname"
        maxLength={30}
        hint="크루 안에서 보이는 이름이에요."
        error={errors.nickname?.message}
        {...register('nickname')}
      />
      {join.error && !errors.nickname && <p className="text-sm text-red-600">{errorMessage(join.error)}</p>}
      <Button type="submit" block loading={join.isPending}>
        참여하기
      </Button>
    </form>
  )
}

function JoinAsMember({ code, crewId }: { code: string; crewId: number }) {
  const join = useJoinAsMember(code, crewId)

  return (
    <div className="flex flex-col gap-3">
      <p className="text-center text-sm text-gray-500">이 기기로 이미 페어카를 쓰고 있어요. 같은 이름으로 참여해요.</p>
      {join.error && <p className="text-center text-sm text-red-600">{errorMessage(join.error)}</p>}
      <Button block loading={join.isPending} onClick={() => join.mutate()}>
        참여하기
      </Button>
    </div>
  )
}
