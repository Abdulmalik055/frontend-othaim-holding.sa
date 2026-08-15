import type { ReactNode } from 'react'

// ── Variants ───────────────────────────────────────────
// 'section' → standard section-card (10px radius, border #e5e7eb)
// 'cut'     → admin card with top-start corner cut (border-top-start-radius: 0)
type Variant = 'section' | 'cut'

type Props = {
  children:   ReactNode
  header?:    ReactNode
  footer?:    ReactNode
  title?:     string          // styled card-title (blue, DIN)
  variant?:   Variant
  className?: string
  noPadding?: boolean
}

export function AdminCard({ children, header, footer, title, variant = 'section', className = '', noPadding = false }: Props) {
  const base = 'bg-white border border-gray-200 shadow-[0_2px_12px_rgba(52,89,165,0.10)]'

  const radius = variant === 'cut'
    ? 'rounded-[10px] rounded-ss-none'   // top-start corner cut
    : 'rounded-[10px]'

  return (
    <div className={`${base} ${radius} ${className}`}>
      {/* card-title — blue, bold */}
      {title && (
        <div className="px-4 pt-4 pb-2">
          <h3 className="text-xl font-bold text-admin-primary">{title}</h3>
        </div>
      )}

      {/* custom header slot */}
      {!title && header && (
        <div className="px-4 py-3 border-b border-gray-200 font-bold text-gray-700">
          {header}
        </div>
      )}

      {/* body */}
      <div className={noPadding ? '' : 'p-4'}>{children}</div>

      {/* footer */}
      {footer && (
        <div className="px-4 py-3 border-t border-gray-200">
          {footer}
        </div>
      )}
    </div>
  )
}
