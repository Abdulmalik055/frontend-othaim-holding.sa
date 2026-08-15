'use client'

import { useId, useState, type ChangeEvent, type ComponentProps } from 'react'

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
} from '../../../lib/input-auto-convert'

type Props = ComponentProps<'input'> & {
  label?: string
  hint?: string
  error?: string
  startIcon?: React.ReactNode
  endIcon?: React.ReactNode
  onEndIconClick?: () => void
  variant?: 'default' | 'filter'
  autoConvertMode?: AutoConvertMode | 'none'
  textLanguage?: AutoConvertTextLanguage
  maxDigits?: number
  autoHttps?: boolean
  hideNumberControls?: boolean
  autoConvertMessages?: Partial<Record<AutoConvertInvalidReason, string>>
}

function resolveAutoConvertMode(type?: ComponentProps<'input'>['type'], autoConvertMode?: AutoConvertMode | 'none') {
  if (autoConvertMode !== undefined) return autoConvertMode

  switch (type) {
    case 'number':
      return 'digits'
    case 'email':
      return 'email'
    case 'url':
      return 'url'
    case 'password':
      return 'none'
    default:
      return 'text'
  }
}

function normalizeByMode(
  mode: AutoConvertMode | 'none',
  value: string,
  textLanguage: AutoConvertTextLanguage,
) {
  switch (mode) {
    case 'digits':
      return normalizeDigitsOnly(value)
    case 'email':
      return normalizeEmail(value)
    case 'url':
      return normalizeUrl(value)
    case 'text':
      return normalizeTextByLanguage(value, textLanguage)
    case 'none':
    default:
      return value
  }
}

export function AdminInput({
  label, hint, error,
  startIcon, endIcon, onEndIconClick,
  variant = 'default',
  required,
  type,
  dir,
  autoConvertMode,
  textLanguage = 'any',
  maxDigits,
  autoHttps = true,
  hideNumberControls = false,
  autoConvertMessages,
  onChange,
  onFocus,
  onBlur,
  className = '',
  ...props
}: Props) {
  const id = useId()
  const [autoConvertErrorReason, setAutoConvertErrorReason] = useState<AutoConvertInvalidReason | null>(null)

  const base =
    variant === 'filter'
      ? 'h-[42px] border border-gray-200 rounded-[10px]'
      : 'min-h-[45px] border border-line-mid rounded-[9px]'

  const resolvedAutoConvertMode = resolveAutoConvertMode(type, autoConvertMode)
  const renderedType = resolvedAutoConvertMode === 'digits' ? 'text' : type
  const shouldHideNumberControls = hideNumberControls && type === 'number'
  const inputPaddingClass = startIcon && endIcon
    ? 'ps-10 pe-10'
    : startIcon
      ? 'ps-10 pe-4'
      : endIcon
        ? 'ps-4 pe-10'
        : 'px-4'
  const autoConvertErrorMessage =
    autoConvertErrorReason && autoConvertMessages?.[autoConvertErrorReason]
  const displayError = error || autoConvertErrorMessage

  const handleChange: NonNullable<Props['onChange']> = (event) => {
    const inputValue = event.currentTarget.value
    const normalizedValue =
      resolvedAutoConvertMode === 'digits' && typeof maxDigits === 'number'
        ? normalizeDigitsOnly(inputValue).slice(0, maxDigits)
        : normalizeByMode(resolvedAutoConvertMode, inputValue, textLanguage)

    if (normalizedValue !== inputValue) {
      event.currentTarget.value = normalizedValue
    }

    const shouldSkipError =
      resolvedAutoConvertMode === 'digits' &&
      typeof maxDigits === 'number' &&
      (() => {
        const trimmedRaw = toLatinDigits(inputValue.trim())
        return /^\d+$/.test(trimmedRaw) && normalizeDigitsOnly(inputValue).length > maxDigits
      })()

    const invalidReason =
      shouldSkipError || resolvedAutoConvertMode === 'none'
        ? null
        : getAutoConvertInvalidAttemptReason(
            resolvedAutoConvertMode,
            inputValue,
            normalizedValue,
            textLanguage,
          )

    // For email/url fields, show format errors only on blur to reduce typing friction.
    const deferredInvalidReason =
      ((resolvedAutoConvertMode === 'email' && invalidReason === 'emailInvalidFormatDual') ||
        (resolvedAutoConvertMode === 'url' && invalidReason === 'urlInvalidFormatDual'))
        ? null
        : invalidReason

    setAutoConvertErrorReason(deferredInvalidReason)
    onChange?.(event)
  }

  const handleFocus: NonNullable<Props['onFocus']> = (event) => {
    if (resolvedAutoConvertMode === 'url' && autoHttps) {
      const normalizedValue = normalizeUrlOnFocus(event.currentTarget.value)
      if (normalizedValue !== event.currentTarget.value) {
        event.currentTarget.value = normalizedValue
        onChange?.(event as unknown as ChangeEvent<HTMLInputElement>)
      }
    }

    onFocus?.(event)
  }

  const handleBlur: NonNullable<Props['onBlur']> = (event) => {
    if (resolvedAutoConvertMode === 'url' && autoHttps) {
      const normalizedValue = normalizeUrlOnBlur(event.currentTarget.value)
      if (normalizedValue !== event.currentTarget.value) {
        event.currentTarget.value = normalizedValue
        onChange?.(event as unknown as ChangeEvent<HTMLInputElement>)
      }
    }

    if (resolvedAutoConvertMode === 'text' && textLanguage !== 'any') {
      const rawValue = event.currentTarget.value
      const normalizedValue = normalizeTextByLanguage(rawValue, textLanguage)
      const invalidReason = getAutoConvertInvalidAttemptReason(
        'text',
        rawValue,
        normalizedValue,
        textLanguage,
      )
      setAutoConvertErrorReason(invalidReason)
    }

    if (resolvedAutoConvertMode === 'digits') {
      const rawValue = event.currentTarget.value
      const normalizedValue =
        typeof maxDigits === 'number'
          ? normalizeDigitsOnly(rawValue).slice(0, maxDigits)
          : normalizeDigitsOnly(rawValue)
      const invalidReason = getAutoConvertInvalidAttemptReason('digits', rawValue, normalizedValue)
      setAutoConvertErrorReason(invalidReason)
    }

    if (resolvedAutoConvertMode === 'email') {
      const rawValue = event.currentTarget.value
      const normalizedValue = normalizeEmail(rawValue)
      const invalidReason = getAutoConvertInvalidAttemptReason('email', rawValue, normalizedValue)
      setAutoConvertErrorReason(invalidReason)
    }

    if (resolvedAutoConvertMode === 'url') {
      const rawValue = event.currentTarget.value
      const normalizedValue = normalizeUrl(rawValue)
      const invalidReason = getAutoConvertInvalidAttemptReason('url', rawValue, normalizedValue)
      setAutoConvertErrorReason(invalidReason)
    }

    onBlur?.(event)
  }

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={id} className="text-[13px] font-bold text-primary">
          {label}
          {required && <span className="text-danger ms-0.5">*</span>}
        </label>
      )}

      <div className="relative" dir={dir}>
        {startIcon && (
          <span className="absolute start-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none w-5 h-5 flex items-center justify-center">
            {startIcon}
          </span>
        )}

        <input
          id={id}
          required={required}
          type={renderedType}
          dir={dir}
          data-auto-convert-invalid={autoConvertErrorReason ? 'true' : undefined}
          data-auto-convert-invalid-reason={autoConvertErrorReason ?? undefined}
          inputMode={props.inputMode ?? (resolvedAutoConvertMode === 'digits' ? 'numeric' : undefined)}
          pattern={props.pattern ?? (resolvedAutoConvertMode === 'digits' ? '[0-9]*' : undefined)}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={[
            'w-full text-sm text-ink font-[inherit] bg-white outline-none',
            'transition-colors duration-200',
            'placeholder:text-line-mid',
            'focus:border-admin-primary focus:shadow-[0_0_0_3px_rgba(52,89,165,0.15)]',
            'disabled:bg-gray-50 disabled:text-accent disabled:cursor-not-allowed',
            'read-only:bg-gray-50 read-only:text-accent read-only:cursor-default',
            shouldHideNumberControls
              ? '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0'
              : '',
            displayError ? 'border-danger focus:border-danger focus:shadow-[0_0_0_3px_rgba(220,53,69,0.15)]' : '',
            base,
            inputPaddingClass,
            className,
          ].filter(Boolean).join(' ')}
          {...props}
        />

        {endIcon && (
          onEndIconClick ? (
            <button
              type="button"
              onClick={onEndIconClick}
              className="absolute end-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors w-5 h-5 flex items-center justify-center"
              tabIndex={-1}
            >
              {endIcon}
            </button>
          ) : (
            <span className="absolute end-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none w-5 h-5 flex items-center justify-center">
              {endIcon}
            </span>
          )
        )}
      </div>

      {displayError && <p className="text-xs text-danger">{displayError}</p>}
      {!displayError && hint && <p className="text-xs text-accent">{hint}</p>}
    </div>
  )
}
