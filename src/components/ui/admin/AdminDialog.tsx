'use client'

import type { ComponentProps, ReactNode } from 'react'
import { XIcon } from '@/components/ui/shared/Icons'

type Size = 'sm' | 'md' | 'lg' | 'xl'

const sizeClass: Record<Size, string> = {
  sm: 'max-w-[400px]',
  md: 'max-w-[480px]',
  lg: 'max-w-[640px]',
  xl: 'max-w-[920px]',
}

type Props = {
  title:     ReactNode
  onClose:   () => void
  children:  ReactNode
  footer?:   ReactNode
  size?:     Size
  /**
   * When provided, the body+footer are wrapped in a <form> so pressing Enter
   * inside a field submits. The close button (header) stays outside the form
   * so it never triggers submit. Most form-based dialogs should use this.
   */
  onSubmit?: ComponentProps<'form'>['onSubmit']
}

export function AdminDialog({ title, onClose, children, footer, size = 'md', onSubmit }: Props) {
  const body = (
    <div className="px-7 py-6 overflow-y-auto flex-1">
      {children}
    </div>
  )

  const footerNode = footer && (
    <div className="flex items-center justify-between gap-3 px-7 py-4 border-t border-surface-soft flex-shrink-0 flex-wrap">
      {footer}
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-[20px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] w-full ${sizeClass[size]} max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-7 py-5 border-b border-surface-soft flex-shrink-0">
          {typeof title === 'string' ? (
            <h3 className="text-[16px] font-bold text-gray-900">{title}</h3>
          ) : (
            <div className="flex-1 min-w-0">{title}</div>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors cursor-pointer border-0 bg-transparent"
            aria-label="Close"
          >
            <XIcon />
          </button>
        </div>
        {onSubmit ? (
          <form onSubmit={onSubmit} className="flex flex-col flex-1 overflow-hidden">
            {body}
            {footerNode}
          </form>
        ) : (
          <>
            {body}
            {footerNode}
          </>
        )}
      </div>
    </div>
  )
}
