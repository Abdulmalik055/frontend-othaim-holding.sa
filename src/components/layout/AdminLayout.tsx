'use client'

import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { AdminSidebar } from './AdminSidebar'
import { TopBar } from './TopBar'
import { useUIStore } from '@/stores/useUIStore'
import type { User } from '@/types'

type BreadcrumbItem = { label: string; href?: string }

type Props = {
  children: React.ReactNode
  user: User
  locale: string
  breadcrumbs?: BreadcrumbItem[]
  title?: string
  permissions?: string[]
  onSignOut?: () => void
  supportNewCount?: number
}

export function AdminLayout({
  children,
  user,
  locale,
  breadcrumbs,
  title,
  permissions = [],
  onSignOut,
  supportNewCount = 0,
}: Props) {
  const { sidebarCollapsed, toggleSidebar, isMobileSidebarOpen, toggleMobileSidebar, setMobileSidebarOpen } = useUIStore()
  const pathname = usePathname()
  const translations = useTranslations('admin')
  const activePath = pathname.replace(`/${locale}/admin/`, '').split('/')[0] || 'dashboard'

  const pageTitle = title ?? translations(activePath as Parameters<typeof translations>[0])

  return (
    <div className="flex min-h-screen bg-[#f4f7fc]" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {/* ── Desktop Sidebar — sticky, full height ── */}
      <div className="hidden md:sticky md:top-0 md:flex md:h-screen md:flex-shrink-0 overflow-y-auto">
        <AdminSidebar
          activePath={activePath}
          locale={locale}
          collapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
          permissions={permissions}
          supportNewCount={supportNewCount}
        />
      </div>

      {/* ── Mobile Sidebar Drawer ── */}
      {isMobileSidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
            aria-hidden="true"
          />
          {/* Drawer */}
          <div className="fixed inset-y-0 start-0 z-50 md:hidden overflow-y-auto">
            <AdminSidebar
              activePath={activePath}
              locale={locale}
              collapsed={false}
              onClose={() => setMobileSidebarOpen(false)}
              permissions={permissions}
              supportNewCount={supportNewCount}
            />
          </div>
        </>
      )}

      {/* ── Main content column ── */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        <div className="p-4">
          <TopBar
            user={user}
            locale={locale}
            breadcrumbs={breadcrumbs}
            title={pageTitle}
            onSignOut={onSignOut}
            onMobileMenuToggle={toggleMobileSidebar}
          />
          <main>
            <div className="max-w-[1200px] mx-auto flex flex-col gap-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
