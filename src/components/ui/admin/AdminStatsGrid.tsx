'use client'

import type { ReactNode } from 'react'
import { AdminStatCard } from '@/components/ui/admin/AdminStatCard'
import { AdminSkeleton } from '@/components/ui/admin/AdminSkeleton'

export type StatItem = {
  label: string
  value: number | string
  icon: ReactNode
  iconColor: 'blue' | 'green' | 'yellow' | 'purple' | 'gray'
}

type Props = {
  stats:    StatItem[]
  loading?: boolean
  columns?: 2 | 3 | 4
}

const colClass: Record<NonNullable<Props['columns']>, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 xl:grid-cols-3',
  4: 'sm:grid-cols-2 xl:grid-cols-4',
}

export function AdminStatsGrid({ stats, loading, columns = 4 }: Props) {
  if (loading) {
    return (
      <div className={`grid grid-cols-1 ${colClass[columns]} gap-5`}>
        {Array.from({ length: columns }).map((_, i) => (
          <AdminSkeleton key={i} type="card" className="h-[96px]" />
        ))}
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-1 ${colClass[columns]} gap-5`}>
      {stats.map((item) => (
        <AdminStatCard
          key={item.label}
          label={item.label}
          value={item.value}
          icon={item.icon}
          iconColor={item.iconColor}
        />
      ))}
    </div>
  )
}
