import type { ReactNode } from 'react'

type Props = {
  label: string
  value: string | number
  trend?: {
    direction: 'up' | 'down'
    percent: number
    label?: string
  }
  icon?: ReactNode
  iconColor?: 'blue' | 'green' | 'yellow' | 'purple' | 'gray'
  className?: string
}

const iconColors = {
  blue:   'bg-admin-primary-tint text-admin-primary',
  green:  'bg-success-bg-alt text-success-green',
  yellow: 'bg-warning-bg text-warning-alt',
  purple: 'bg-purple-50 text-purple',
  gray:   'bg-surface text-secondary',
} satisfies Record<NonNullable<Props['iconColor']>, string>

export function AdminStatCard({ label, value, trend, icon, iconColor = 'blue', className = '' }: Props) {
  return (
    <div
      className={[
        'bg-white rounded-[14px] shadow-[0_2px_12px_rgba(52,89,165,0.10)]',
        'p-5 flex items-center gap-4',
        className,
      ].filter(Boolean).join(' ')}
    >
      {icon && (
        <div className={[
          'w-[54px] h-[54px] rounded-[12px] flex items-center justify-center text-[22px] shrink-0',
          iconColors[iconColor],
        ].join(' ')}>
          {icon}
        </div>
      )}
      <div>
        <p className="text-[13px] text-gray-400 mb-0.5">{label}</p>
        <p className="text-[26px] font-bold text-gray-800 leading-none">{value}</p>
        {trend && (
          <p className={[
            'text-[12px] mt-1 flex items-center gap-0.5',
            trend.direction === 'up' ? 'text-success-green' : 'text-danger-bright',
          ].join(' ')}>
            {trend.direction === 'up' ? (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
            )}
            {trend.percent}%{trend.label ? ` ${trend.label}` : ''}
          </p>
        )}
      </div>
    </div>
  )
}
