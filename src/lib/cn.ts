import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// 조건부 className을 합치고, 겹치는 Tailwind 클래스는 뒤의 것을 남김
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
