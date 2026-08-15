'use client'

import { useCallback, useId, useState, type ComponentProps, type ChangeEvent, type FocusEvent } from 'react'
import {
  getAutoConvertInvalidAttemptReason,
  normalizeDigitsOnly,
  normalizeEmail,
  normalizeTextByLanguage,
  normalizeUrl,
  normalizeUrlOnBlur,
  normalizeUrlOnFocus,
  toLatinDigits,
  type AutoConvertInvalidReason,
  type AutoConvertMode,
  type AutoConvertTextLanguage,
} from '@/lib/input-auto-convert'

type Props = ComponentProps<'textarea'> & {
  label?: string
  error?: string
  hint?: string
  required?: boolean
  showCount?: boolean
  autoConvertMode?: AutoConvertMode | 'none'
  textLanguage?: AutoConvertTextLanguage
  maxDigits?: number
  autoHttps?: boolean
  autoConvertMessages?: Partial<Record<AutoConvertInvalidReason, string>>
}

export function AdminTextArea({
  label,
  error,
  hint,
  required,
  showCount,
  autoConvertMode = 'text',
  textLanguage = 'any',
  maxDigits,
  autoHttps = true,
  autoConvertMessages,
  className = '',
  value,
  defaultValue,
  onChange,
  onFocus,
  onBlur,
  ...props
}: Props) {
  const id = useId()
  const [uncontrolledValue, setUncontrolledValue] = useState(() =>
    defaultValue === undefined ? '' : String(defaultValue),
  )
  const [autoConvertErrorReason, setAutoConvertErrorReason] = useState<AutoConvertInvalidReason | null>(null)
  const isControlled = value !== undefined
  const displayValue = isControlled ? String(value) : uncontrolledValue

  const normalizeValue = useCallback(
    (rawValue: string) => {
      switch (autoConvertMode) {
        case 'digits': {
          const normalizedDigits = normalizeDigitsOnly(rawValue)
          return typeof maxDigits === 'number' ? normalizedDigits.slice(0, maxDigits) : normalizedDigits
        }
        case 'email':
          return normalizeEmail(rawValue)
        case 'url':
          return normalizeUrl(rawValue)
        case 'none':
          return rawValue
        case 'text':
        default:
          return normalizeTextByLanguage(rawValue, textLanguage)
      }
    },
    [autoConvertMode, maxDigits, textLanguage],
  )

  const getAutoConvertErrorReason = useCallback(
    (rawValue: string, normalizedValue: string) => {
      if (autoConvertMode === 'none') return null
      if (autoConvertMode === 'text' && textLanguage === 'any') return null

      if (autoConvertMode === 'digits' && typeof maxDigits === 'number') {
        const trimmedRaw = toLatinDigits(rawValue.trim())
        if (/^\d+$/.test(trimmedRaw) && normalizeDigitsOnly(rawValue).length > maxDigits) {
          return null
        }
      }

      return getAutoConvertInvalidAttemptReason(
        autoConvertMode,
        rawValue,
        normalizedValue,
        textLanguage,
      )
    },
    [autoConvertMode, maxDigits, textLanguage],
  )

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      const rawValue = event.currentTarget.value
      const normalizedValue = normalizeValue(rawValue)
      event.currentTarget.value = normalizedValue

      if (!isControlled) {
        setUncontrolledValue(normalizedValue)
      }

      setAutoConvertErrorReason(getAutoConvertErrorReason(rawValue, normalizedValue))
      onChange?.(event)
    },
    [getAutoConvertErrorReason, isControlled, normalizeValue, onChange],
  )

  const handleFocus = useCallback(
    (event: FocusEvent<HTMLTextAreaElement>) => {
      if (autoConvertMode === 'url' && autoHttps) {
        const nextValue = normalizeUrlOnFocus(event.currentTarget.value)
        if (nextValue !== event.currentTarget.value) {
          event.currentTarget.value = nextValue
          if (!isControlled) {
            setUncontrolledValue(nextValue)
          }
          onChange?.(event as unknown as ChangeEvent<HTMLTextAreaElement>)
        }
      }

      onFocus?.(event)
    },
    [autoConvertMode, autoHttps, isControlled, onChange, onFocus],
  )

  const handleBlur = useCallback(
    (event: FocusEvent<HTMLTextAreaElement>) => {
      if (autoConvertMode === 'url' && autoHttps) {
        const nextValue = normalizeUrlOnBlur(event.currentTarget.value)
        if (nextValue !== event.currentTarget.value) {
          event.currentTarget.value = nextValue
          if (!isControlled) {
            setUncontrolledValue(nextValue)
          }
          onChange?.(event as unknown as ChangeEvent<HTMLTextAreaElement>)
        }
      }

      onBlur?.(event)
    },
    [autoConvertMode, autoHttps, isControlled, onBlur, onChange],
  )

  const autoConvertErrorMessage =
    autoConvertErrorReason && autoConvertMessages?.[autoConvertErrorReason]
  const displayError = error || autoConvertErrorMessage
  const len = displayValue.length

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={id} className="text-[13px] font-bold text-muted">
          {label}
          {required && <span className="text-danger ms-0.5">*</span>}
        </label>
      )}

      <div className="relative">
        <textarea
          id={id}
          value={displayValue}
          data-auto-convert-invalid={autoConvertErrorReason ? 'true' : undefined}
          data-auto-convert-invalid-reason={autoConvertErrorReason ?? undefined}
          className={[
            'w-full px-3 py-3 border rounded-[9px] bg-white text-sm text-ink',
            'placeholder:text-line-mid transition-colors duration-200 outline-none resize-vertical',
            'min-h-[120px] leading-relaxed',
            displayError
              ? 'border-danger focus:border-danger'
              : 'border-line-mid focus:border-admin-primary focus:shadow-[0_0_0_3px_rgba(52,89,165,0.15)]',
            props.disabled ? 'bg-surface opacity-60 cursor-not-allowed resize-none' : '',
            className,
          ].filter(Boolean).join(' ')}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        {showCount && props.maxLength && (
          <span className="absolute bottom-2 end-3 text-[11px] text-muted">
            {len}/{props.maxLength}
          </span>
        )}
      </div>

      {displayError && <p className="text-xs text-danger">{displayError}</p>}
      {!displayError && hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  )
}
