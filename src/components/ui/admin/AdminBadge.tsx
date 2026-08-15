import type { ReactNode } from 'react'

// Matches admin badge-status styles:
// badge-active   → bg:#ecfdf5  color:#065f46  dot:#10b981
// badge-pending  → bg:#fffbeb  color:#92400e  dot:#f59e0b
// badge-inactive → bg:#f3f4f6  color:#6b7280  dot:#9ca3af
// badge-rejected → bg:#fef2f2  color:#991b1b  dot:#ef4444
// badge-unread   → bg:#eff6ff  color:#1d4ed8  dot:#3b82f6

export type BadgeVariant = 'active' | 'pending' | 'inactive' | 'rejected' | 'unread' | 'neutral'
type Variant = BadgeVariant

type Props = {
  variant?:   Variant
  children:   ReactNode
  dot?:       boolean
}

const styles: Record<Variant, { bg: string; text: string; dot: string }> = {
  active:   { bg: 'bg-success-badge-bg', text: 'text-success-badge-text', dot: 'bg-success-emerald' },
  pending:  { bg: 'bg-amber-50', text: 'text-amber-800', dot: 'bg-warning-alt' },
  inactive: { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' },
  rejected: { bg: 'bg-danger-bg-faint', text: 'text-danger-text-dark', dot: 'bg-danger-bright' },
  unread:   { bg: 'bg-admin-primary-bg', text: 'text-blue-700', dot: 'bg-blue-500' },
  neutral:  { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' },
}

export function AdminBadge({ variant = 'neutral', children, dot = true }: Props) {
  const { bg, text, dot: dotColor } = styles[variant]

  return (
    <span className={`inline-flex items-center gap-[5px] px-[10px] py-[4px] rounded-[20px] text-[12px] font-[500] ${bg} ${text}`}>
      {dot && <span className={`w-[6px] h-[6px] rounded-full shrink-0 ${dotColor}`} />}
      {children}
    </span>
  )
}
