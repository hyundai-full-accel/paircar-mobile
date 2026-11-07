import { useId, type InputHTMLAttributes } from 'react'
import { cn } from '../lib/cn'

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
  hint?: string
}

// 회색 면 입력칸 (시안 "크루에서 사용할 이름")
// react-hook-form의 register를 그대로 펼쳐 쓰면 됨: <TextField label="닉네임" {...register('nickname')} />
export function TextField({ label, error, hint, className, id, ...props }: TextFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const messageId = `${inputId}-message`
  const message = error ?? hint

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-[15px] font-semibold">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? messageId : undefined}
        className={cn(
          'h-13 rounded-xl border border-transparent bg-surface px-4 text-base outline-none transition-colors',
          'placeholder:text-muted focus:border-ink focus:bg-white',
          error && 'border-red-500 bg-white',
          className,
        )}
        {...props}
      />
      {message && (
        <p id={messageId} className={cn('text-sm', error ? 'text-red-600' : 'text-sub')}>
          {message}
        </p>
      )}
    </div>
  )
}
