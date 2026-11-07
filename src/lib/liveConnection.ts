import { API_BASE_URL, api, ApiError, unwrap } from '../api/client'
import { LIVE_EVENT_TYPES, type LiveEvent } from '../api/live'
import { clearToken } from './token'

export type LiveStatus = 'idle' | 'connecting' | 'open' | 'reconnecting'

type Handlers = {
  onEvent: (event: LiveEvent) => void
  onStatus: (status: LiveStatus) => void
  // 연결될 때마다. 끊긴 사이에 놓친 변화를 맞추라고 알림 (resumed: 이전에 연결된 적이 있음)
  onConnected: (resumed: boolean) => void
}

const MAX_BACKOFF_MS = 30_000

// SSE 연결 하나. 서버 순서: 토큰으로 60초짜리 일회용 티켓 발급 → 티켓으로 구독
// 티켓은 한 번만 쓰므로 EventSource의 자동 재연결 대신 직접 새 티켓으로 다시 붙음
export class LiveConnection {
  private source: EventSource | null = null
  private retryTimer: ReturnType<typeof setTimeout> | null = null
  private attempt = 0
  private connectedBefore = false
  private running = false
  private generation = 0 // stop 뒤 start가 빨리 오면 앞 연결 시도를 버리기 위한 번호
  private readonly handlers: Handlers

  constructor(handlers: Handlers) {
    this.handlers = handlers
  }

  start() {
    if (this.running) return
    this.running = true
    void this.connect()
  }

  stop() {
    this.running = false
    this.generation++
    this.clearRetry()
    this.source?.close()
    this.source = null
    this.handlers.onStatus('idle')
  }

  private async connect() {
    const generation = this.generation
    this.handlers.onStatus(this.connectedBefore ? 'reconnecting' : 'connecting')
    let ticket: string
    try {
      ticket = (await unwrap(api.POST('/api/live/tickets'))).ticket
    } catch (e) {
      if (e instanceof ApiError && e.code === 'UNAUTHORIZED') {
        clearToken() // 토큰이 죽었으면 다시 붙어도 소용없음. 화면은 초대 링크 안내로 바뀜
        this.stop()
        return
      }
      this.scheduleRetry()
      return
    }
    if (!this.running || generation !== this.generation) return

    const source = new EventSource(`${API_BASE_URL}/api/live/events?ticket=${encodeURIComponent(ticket)}`)
    this.source = source
    source.addEventListener('connected', () => {
      this.attempt = 0
      this.handlers.onStatus('open')
      this.handlers.onConnected(this.connectedBefore)
      this.connectedBefore = true
    })
    for (const type of LIVE_EVENT_TYPES) {
      source.addEventListener(type, (message) => {
        try {
          this.handlers.onEvent(JSON.parse((message as MessageEvent<string>).data) as LiveEvent)
        } catch {
          // 형식이 맞지 않는 이벤트는 버림
        }
      })
    }
    source.onerror = () => {
      source.close()
      if (this.source === source) this.source = null
      this.scheduleRetry()
    }
  }

  // 1, 2, 4, 8 ... 최대 30초 뒤 새 티켓으로 다시 붙음
  private scheduleRetry() {
    if (!this.running) return
    this.handlers.onStatus('reconnecting')
    this.clearRetry()
    const delay = Math.min(1000 * 2 ** this.attempt, MAX_BACKOFF_MS)
    this.attempt++
    this.retryTimer = setTimeout(() => void this.connect(), delay)
  }

  private clearRetry() {
    if (this.retryTimer) clearTimeout(this.retryTimer)
    this.retryTimer = null
  }
}
