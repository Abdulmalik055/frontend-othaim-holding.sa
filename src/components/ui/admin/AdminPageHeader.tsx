import type { ReactNode } from 'react'
import Link from 'next/link'

export type BreadcrumbItem = {
  label: string
  href?: string
}

type Props = {
  title:        string
  breadcrumbs?: BreadcrumbItem[]
  action?:      ReactNode
}

export function AdminPageHeader({ title, breadcrumbs = [], action }: Props) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h2 className="text-[22px] font-bold text-gray-800 leading-tight">{title}</h2>
        {breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 text-[13px] mt-1">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-gray-400">›</span>}
                {crumb.href ? (
                  <Link href={crumb.href} className="text-admin-primary hover:underline">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-gray-500">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
