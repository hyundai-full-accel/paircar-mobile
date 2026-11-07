import { ApiError } from '../api/client'

// 화면에 보여 줄 오류 문구. 서버 메시지는 이미 사용자용 한국어라 그대로 씀
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  return '알 수 없는 오류가 발생했어요.'
}
