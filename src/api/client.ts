import createClient, { type Middleware } from 'openapi-fetch'
import { getToken } from '../lib/token'
import type { components, paths } from './schema'

type ErrorBody = components['schemas']['ErrorBody']
type FieldError = components['schemas']['FieldErrorBody']

// 서버 응답 봉투 { success, data, error }
type Envelope<T> = {
  success: boolean
  data?: T | null
  error?: ErrorBody | null
}

// 서버(또는 nginx)가 준 오류. 화면은 code로 분기하고 message는 그대로 보여 줘도 됨
export class ApiError extends Error {
  readonly code: string
  readonly status: number
  readonly fieldErrors: FieldError[]

  constructor(code: string, message: string, status: number, fieldErrors: FieldError[] = []) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

const auth: Middleware = {
  onRequest({ request }) {
    const token = getToken()
    if (token) request.headers.set('Authorization', `Bearer ${token}`)
    return request
  },
}

// 서버 주소. 웹과 서버를 따로 배포하므로 배포 때는 VITE_API_BASE_URL로 넣음
// 비어 있으면 같은 출처의 /api를 부름 (개발 때 Vite 프록시가 로컬 서버로 넘김)
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

export const api = createClient<paths>({ baseUrl: API_BASE_URL })
api.use(auth)

/**
 * openapi-fetch 결과에서 봉투를 벗겨 data만 돌려줌. 실패하면 ApiError를 던짐
 *
 * const crews = await unwrap(api.GET('/api/crews/me'))
 */
export async function unwrap<T>(
  request: Promise<{ data?: Envelope<T>; error?: unknown; response: Response }>,
): Promise<T> {
  let result: Awaited<typeof request>
  try {
    result = await request
  } catch {
    throw new ApiError('NETWORK_ERROR', '서버에 연결할 수 없어요. 잠시 뒤 다시 시도해 주세요.', 0)
  }
  const { data, error, response } = result
  if (response.ok && data?.success) return data.data as T

  const body = (data ?? error) as Envelope<T> | undefined
  const err = body?.error
  throw new ApiError(
    err?.code ?? 'UNKNOWN_ERROR',
    err?.message ?? '알 수 없는 오류가 발생했어요.',
    response.status,
    err?.fieldErrors,
  )
}
