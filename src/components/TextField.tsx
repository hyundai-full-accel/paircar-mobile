import { useId, type InputHTMLAttributes } from 'react'
import { cn } from '../lib/cn'

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
  hint?: string
}

// react-hook-form의 register를 그대로 펼쳐 쓰면 됨: <TextField label="닉네임" {...register('nickname')} />
export function TextField({ label, error, hint, className, id, ...props }: TextFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const messageId = `${inputId}-message`
  const message = error ?? hint

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? messageId : undefined}
        className={cn(
          'h-12 rounded-xl border border-gray-300 bg-white px-4 text-base outline-none transition-colors',
          'placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/20',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
          className,
        )}
        {...props}
      />
      {message && (
        <p id={messageId} className={cn('text-sm', error ? 'text-red-600' : 'text-gray-500')}>
          {message}
        </p>
      )}
    </div>
  )
}
