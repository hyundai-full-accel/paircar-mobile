import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../lib/cn'
import { Spinner } from './Spinner'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const variants: Record<Variant, string> = {
  primary: 'bg-ink-strong text-white active:bg-ink',
  secondary: 'bg-surface text-ink active:bg-line',
  ghost: 'bg-transparent text-sub active:bg-surface',
  danger: 'bg-red-50 text-red-600 active:bg-red-100',
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  loading?: boolean
  block?: boolean // 가로 꽉 채움
}

// 폰에서 누르기 쉽게 높이 52px
export function Button({ variant = 'primary', loading = false, block = false, disabled, className, children, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={cn(
        'inline-flex h-13 items-center justify-center gap-2 rounded-xl px-5 text-base font-semibold transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-40',
        variants[variant],
        block && 'w-full',
        className,
      )}
      {...props}
    >
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  )
}
