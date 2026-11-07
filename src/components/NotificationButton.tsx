import { useState } from 'react'
import { enablePush, isPushSupported, type PushResult } from '../lib/push'
import { errorMessage } from '../lib/errors'
import { Button } from './Button'
import { Modal } from './Modal'
import { HeaderButton } from './Page'

const RESULT_TEXT: Record<PushResult, string> = {
  subscribed: '알림을 켰어요. 앱을 닫아도 출발, 도착, 영수증 알림이 와요.',
  denied: '알림 권한이 꺼져 있어요. 브라우저 설정에서 알림을 허용해 주세요.',
  disabled: '지금은 서버에서 알림을 보낼 수 없어요.',
  unsupported: '이 브라우저는 알림을 받을 수 없어요.',
}

// 헤더 오른쪽 "알림" 버튼. 눌러서 폰 알림을 켬
// iOS는 홈 화면에 추가한 앱에서만 알림을 받을 수 있어서 그 방법을 안내함
export function NotificationButton() {
  const [open, setOpen] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const onEnable = async () => {
    setPending(true)
    try {
      setResult(RESULT_TEXT[await enablePush()])
    } catch (e) {
      setResult(errorMessage(e))
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <HeaderButton label="알림 설정" onClick={() => setOpen(true)}>
        알림
      </HeaderButton>
      <Modal open={open} onClose={() => setOpen(false)} title="폰 알림">
        <p className="text-[15px] text-sub">차가 출발하거나 곧 도착할 때, 영수증이 나왔을 때 폰으로 알려 드려요.</p>
        {!isPushSupported() && (
          <p className="rounded-xl bg-surface p-4 text-sm text-sub">
            아이폰은 Safari 공유 버튼 → <b className="text-ink">홈 화면에 추가</b> 후, 홈 화면의 페어카로 열어야 알림을 받을 수 있어요.
          </p>
        )}
        {result && <p className="text-sm font-medium">{result}</p>}
        <Button block loading={pending} disabled={!isPushSupported()} onClick={onEnable}>
          알림 켜기
        </Button>
      </Modal>
    </>
  )
}
