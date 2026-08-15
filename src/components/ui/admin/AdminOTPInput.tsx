'use client'

import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react'

// ── Types ──────────────────────────────────────────────
type Props = {
  length?:   number
  value:     string
  onChange:  (value: string) => void
  error?:    boolean
  disabled?: boolean
}

// ── Helpers ────────────────────────────────────────────
const toLatinDigit = (str: string) =>
  str.replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))

// ── Styles ─────────────────────────────────────────────
const baseCell = [
  'w-12 h-14 text-xl font-bold text-center',
  'border rounded-[10px] bg-white outline-none',
  'transition-all duration-200 caret-admin-primary',
  'focus:border-admin-primary focus:shadow-[0_0_0_3px_rgba(52,89,165,0.15)]',
].join(' ')

function cellClass(digit: string, error?: boolean) {
  if (error)  return `${baseCell} border-danger bg-danger-bg-soft`
  if (digit)  return `${baseCell} border-admin-primary`
  return              `${baseCell} border-line-mid`
}

// ── Component ──────────────────────────────────────────
export function AdminOTPInput({ length = 4, value, onChange, error, disabled }: Props) {
  const digits = Array.from({ length }, (_, i) => value[i] ?? '')
  const refs   = useRef<(HTMLInputElement | null)[]>([])
  const focus  = (digitIndex: number) => refs.current[Math.max(0, Math.min(digitIndex, length - 1))]?.focus()

  const handleChange = (digitIndex: number, char: string) => {
    const digit = toLatinDigit(char).replace(/\D/g, '').slice(-1)
    onChange(digits.map((current, idx) => (idx === digitIndex ? digit : current)).join(''))
    if (digit) focus(digitIndex + 1)
  }

  const handleKeyDown = (digitIndex: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace'  && !digits[digitIndex]) focus(digitIndex - 1)
    if (e.key === 'ArrowLeft')                         focus(digitIndex - 1)
    if (e.key === 'ArrowRight')                        focus(digitIndex + 1)
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    onChange(pasted.padEnd(length, '').slice(0, length))
    focus(Math.min(pasted.length, length - 1))
  }

  return (
    <div className="flex gap-2 justify-center" style={{ direction: 'ltr' }}>
      {digits.map((digit, digitIndex) => (
        <input
          key={digitIndex}
          ref={el => { refs.current[digitIndex] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          disabled={disabled}
          className={`${cellClass(digit, error)} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onChange={e => handleChange(digitIndex, e.target.value)}
          onKeyDown={e => handleKeyDown(digitIndex, e)}
          onPaste={handlePaste}
          onFocus={e => e.target.select()}
        />
      ))}
    </div>
  )
}
