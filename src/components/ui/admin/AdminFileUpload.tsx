'use client'

import { useRef, useState } from 'react'

type Props = {
  accept?:    string
  multiple?:  boolean
  maxSize?:   number
  label?:     string
  error?:     string
  hint?:      string
  required?:  boolean
  onChange?:  (files: File[]) => void
  disabled?:  boolean
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function AdminFileUpload({ accept, multiple, maxSize, label, error, hint, required, onChange, disabled }: Props) {
  const inputRef  = useRef<HTMLInputElement>(null)
  const [files, setFiles]       = useState<File[]>([])
  const [dragging, setDragging] = useState(false)
  const [sizeError, setSizeError] = useState('')

  function handleFiles(incoming: FileList | null) {
    if (!incoming) return
    const arr = Array.from(incoming)
    if (maxSize) {
      const over = arr.find((file) => file.size > maxSize)
      if (over) { setSizeError(`File exceeds ${formatSize(maxSize)}`); return }
    }
    setSizeError('')
    const next = multiple ? [...files, ...arr] : arr
    setFiles(next)
    onChange?.(next)
  }

  function remove(fileIndex: number) {
    const next = files.filter((_, idx) => idx !== fileIndex)
    setFiles(next)
    onChange?.(next)
  }

  const displayError = error || sizeError

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <span className="text-[13px] font-bold text-muted">
          {label}
          {required && <span className="text-danger ms-0.5">*</span>}
        </span>
      )}

      {/* Dropzone — admin style: #F4F4FF bg, blue dashed border */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={e => e.key === 'Enter' && !disabled && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); if (!disabled) setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); if (!disabled) handleFiles(e.dataTransfer.files) }}
        className={[
          'flex flex-col items-center justify-center gap-3 min-h-[150px]',
          'border border-dashed rounded-[9px] cursor-pointer transition-all',
          'shadow-[0_0_3px_rgba(0,0,0,0.42)]',
          dragging     ? 'border-blue-400 bg-[#e8f4ff]' : 'border-blue-400 bg-[#F4F4FF]',
          displayError ? '!border-danger !bg-white'   : '',
          disabled     ? 'opacity-60 cursor-not-allowed' : '',
        ].filter(Boolean).join(' ')}
      >
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#4579E5" strokeWidth="1.5">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <p className="text-[15px] font-bold text-[#4579E5]">
          {dragging ? 'Drop files here' : 'Drop files or browse'}
        </p>
        {(accept || maxSize) && (
          <p className="text-xs text-gray-400">
            {[accept && `Types: ${accept}`, maxSize && `Max: ${formatSize(maxSize)}`].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />

      {files.length > 0 && (
        <ul className="flex flex-col gap-1 mt-1">
          {files.map((file, fileIndex) => (
            <li key={fileIndex} className="flex items-center gap-2 px-3 py-2 bg-surface rounded-[8px] text-sm border border-line-mid">
              <span className="text-gray-700 truncate flex-1">{file.name}</span>
              <span className="text-gray-400 text-xs">{formatSize(file.size)}</span>
              <button type="button" onClick={() => remove(fileIndex)} className="text-gray-400 hover:text-danger">✕</button>
            </li>
          ))}
        </ul>
      )}

      {displayError && <p className="text-xs text-danger">{displayError}</p>}
      {!displayError && hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  )
}
