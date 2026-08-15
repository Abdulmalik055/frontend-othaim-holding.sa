'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'

type Variant = 'circle' | 'rect'

type Props = {
  label?:    string
  error?:    string
  hint?:     string
  required?: boolean
  maxSize?:  number
  variant?:  Variant     // circle = avatar style, rect = banner/logo
  size?:     number      // px — applies to circle diameter or rect height
  onChange?: (file: File | null) => void
  disabled?: boolean
}

function formatSize(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function AdminImageUpload({
  label, error, hint, required, maxSize,
  variant = 'circle', size = 100, onChange, disabled,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview]   = useState<string | null>(null)
  const [sizeError, setSizeError] = useState('')

  function handleFile(file: File | null) {
    if (!file) return
    if (!file.type.startsWith('image/')) { setSizeError('Images only'); return }
    if (maxSize && file.size > maxSize) { setSizeError(`Max ${formatSize(maxSize)}`); return }
    setSizeError('')
    setPreview(URL.createObjectURL(file))
    onChange?.(file)
  }

  function remove() {
    setPreview(null)
    setSizeError('')
    onChange?.(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const displayError = error || sizeError
  const isCircle = variant === 'circle'

  return (
    <div className="flex flex-col gap-2 w-full">
      {label && (
        <span className="text-[13px] font-bold text-muted">
          {label}
          {required && <span className="text-danger ms-0.5">*</span>}
        </span>
      )}

      <div className={isCircle ? 'flex items-center gap-4' : 'flex flex-col gap-2'}>
        {/* Preview / placeholder */}
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          onClick={() => !disabled && inputRef.current?.click()}
          onKeyDown={e => e.key === 'Enter' && !disabled && inputRef.current?.click()}
          style={{ width: size, height: size }}
          className={[
            'relative overflow-hidden shrink-0 cursor-pointer border border-line-mid',
            'flex items-center justify-center bg-surface transition-colors hover:border-admin-primary',
            isCircle ? 'rounded-full' : 'rounded-[9px]',
            displayError ? '!border-danger' : '',
            disabled ? 'opacity-60 cursor-not-allowed' : '',
          ].filter(Boolean).join(' ')}
        >
          {preview ? (
            <Image src={preview} alt="preview" fill className="object-cover" />
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B5B5B5" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          )}
          {/* Overlay on hover */}
          {!disabled && (
            <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
              <svg className="opacity-0 hover:opacity-100" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => !disabled && inputRef.current?.click()}
            disabled={disabled}
            className="text-xs font-bold text-admin-primary hover:underline disabled:opacity-50 text-start"
          >
            {preview ? 'Change image' : 'Upload image'}
          </button>
          {preview && (
            <button
              type="button"
              onClick={remove}
              className="text-xs font-bold text-danger hover:underline text-start"
            >
              Remove
            </button>
          )}
          {maxSize && (
            <p className="text-xs text-gray-400">Max: {formatSize(maxSize)}</p>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        disabled={disabled}
        className="hidden"
        onChange={e => handleFile(e.target.files?.[0] ?? null)}
      />

      {displayError && <p className="text-xs text-danger">{displayError}</p>}
      {!displayError && hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  )
}
