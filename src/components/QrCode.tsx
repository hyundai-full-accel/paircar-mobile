import { QRCodeSVG } from 'qrcode.react'
import { cn } from '../lib/cn'

type QrCodeProps = {
  value: string
  className?: string
}

// 흰 바탕 QR (차량 앱 QrCode.kt와 같은 설정: 오류 정정 M, 바깥 여백은 패딩으로 둠)
// SVG라서 크기를 바꿔도 칸이 흐려지지 않음
export function QrCode({ value, className }: QrCodeProps) {
  return (
    <div className={cn('aspect-square rounded-2xl bg-white p-4', className)}>
      <QRCodeSVG value={value} level="M" marginSize={0} bgColor="#ffffff" fgColor="#000000" className="size-full" />
    </div>
  )
}
