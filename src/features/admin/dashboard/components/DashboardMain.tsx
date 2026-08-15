'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { AdminBadge, type BadgeVariant } from '@/components/ui/admin/AdminBadge'
import { getCmsPageSectionsCount, useCmsPages } from '@/features/admin/cms/hooks/useCmsPages'
import { useSupportTickets, type TicketStatus } from '@/features/admin/support/hooks/useSupportTickets'
import { useSupportStats } from '@/features/admin/support/hooks/useSupportStats'
import { useUsers } from '@/features/admin/users/hooks/useUsers'
import { useAdminRoles } from '@/features/admin/roles/hooks/useAdminRoles'
import { useHrCandidates } from '@/features/admin/hr/hooks/useHrCandidates'
import { useHrJobs } from '@/features/admin/hr/hooks/useHrJobs'
import { useAuthStore } from '@/stores/useAuthStore'
import {
  ADMIN_USERS_PERMISSION,
  ADMIN_NAV_ITEMS,
  canAccessAdminPath,
  hasAdminPermission,
  type AdminNavPath,
} from '@/components/layout/admin-navigation'
import { PAGINATION } from '@/lib/constants/pagination'
import { formatDateShort } from '@/lib/dates'

const statusVariant: Record<TicketStatus, BadgeVariant> = {
  new:    'unread',
  read:   'active',
  closed: 'inactive',
}

const avatarColors = ['#3459A5', '#22c55e', '#f59e0b', '#9333ea', '#ef4444', '#0891b2', '#d97706', '#6d28d9']

function avatarColor(name: string) {
  const charCode = name.trim().charCodeAt(0)
  return avatarColors[(Number.isFinite(charCode) ? charCode : 0) % avatarColors.length]
}

function FileIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function SupportIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function BriefcaseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      <path d="M2 13h20" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.8 1.8 0 0 0 .36 1.98l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.8 1.8 0 0 0 15 19.4a1.8 1.8 0 0 0-1 .6 1.8 1.8 0 0 0-.4 1.2V21a2 2 0 1 1-4 0v-.09A1.8 1.8 0 0 0 9 19.4a1.8 1.8 0 0 0-1.98.36l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.8 1.8 0 0 0 4.6 15a1.8 1.8 0 0 0-.6-1 1.8 1.8 0 0 0-1.2-.4H3a2 2 0 1 1 0-4h.09A1.8 1.8 0 0 0 4.6 9a1.8 1.8 0 0 0-.36-1.98l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.8 1.8 0 0 0 9 4.6a1.8 1.8 0 0 0 1-.6 1.8 1.8 0 0 0 .4-1.2V3a2 2 0 1 1 4 0v.09A1.8 1.8 0 0 0 15 4.6a1.8 1.8 0 0 0 1.98-.36l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.8 1.8 0 0 0 19.4 9a1.8 1.8 0 0 0 .6 1 1.8 1.8 0 0 0 1.2.4H21a2 2 0 1 1 0 4h-.09A1.8 1.8 0 0 0 19.4 15Z" />
    </svg>
  )
}

function GroupsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 11a4 4 0 1 0-8 0" />
      <path d="M3 21a7 7 0 0 1 14 0" />
      <path d="M18 8.5a3 3 0 0 1 0 5" />
      <path d="M20 21a5 5 0 0 0-3-4.6" />
    </svg>
  )
}

type QuickLink = {
  href: string
  label: string
  description: string
  icon: ReactNode
  tone: SummaryTone
}

type SummaryTone = 'blue' | 'green' | 'yellow' | 'purple' | 'gray'

type SummaryMetric = {
  label: string
  value: number | string
}

type SummaryCardProps = {
  title: string
  primaryLabel: string
  primaryValue: number | string
  icon: ReactNode
  tone: SummaryTone
  metrics: SummaryMetric[]
  loading?: boolean
}

type DashboardPreviewCardProps = {
  title: string
  href: string
  viewAllLabel: string
  children: ReactNode
}

const summaryToneClasses = {
  blue:   'bg-admin-primary-tint text-admin-primary border-blue-100',
  green:  'bg-success-bg-alt text-success-green border-green-100',
  yellow: 'bg-warning-bg text-warning-alt border-yellow-100',
  purple: 'bg-purple-50 text-purple border-purple-100',
  gray:   'bg-surface text-secondary border-gray-100',
} satisfies Record<SummaryTone, string>

function DashboardSummaryCard({ title, primaryLabel, primaryValue, icon, tone, metrics, loading }: SummaryCardProps) {
  if (loading) {
    return (
      <div className="min-h-[178px] rounded-[18px] border border-gray-200 bg-white p-5 shadow-[0_2px_12px_rgba(52,89,165,0.08)]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="h-4 w-28 animate-pulse rounded bg-gray-100" />
            <div className="mt-5 h-8 w-16 animate-pulse rounded bg-gray-100" />
            <div className="mt-2 h-3 w-20 animate-pulse rounded bg-gray-100" />
          </div>
          <div className="h-12 w-12 animate-pulse rounded-[14px] bg-gray-100" />
        </div>
        <div className="mt-6 grid grid-cols-2 gap-2">
          <div className="h-12 animate-pulse rounded-[12px] bg-gray-100" />
          <div className="h-12 animate-pulse rounded-[12px] bg-gray-100" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[178px] rounded-[18px] border border-gray-200 bg-white p-5 shadow-[0_2px_12px_rgba(52,89,165,0.08)] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(52,89,165,0.12)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[13px] font-semibold text-gray-400">{title}</p>
          <div className="mt-4">
            <span className="text-[34px] font-black leading-none text-gray-900">{primaryValue}</span>
            <p className="mt-2 text-[13px] font-semibold text-gray-400">{primaryLabel}</p>
          </div>
        </div>
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] border ${summaryToneClasses[tone]}`}>
          {icon}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-[12px] border border-gray-100 bg-gray-50 px-3 py-2">
            <p className="text-[11px] font-medium text-gray-400">{metric.label}</p>
            <p className="mt-1 text-[18px] font-black leading-none text-gray-800">{metric.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function DashboardPreviewCard({ title, href, viewAllLabel, children }: DashboardPreviewCardProps) {
  return (
    <section className="overflow-hidden rounded-[18px] border border-gray-200 bg-white shadow-[0_2px_12px_rgba(52,89,165,0.08)]">
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <h2 className="text-[15px] font-bold text-gray-900">{title}</h2>
        <Link
          href={href}
          className="rounded-full border border-blue-100 bg-admin-primary-bg px-3 py-1.5 text-[11px] font-bold text-admin-primary transition-colors hover:bg-white"
        >
          {viewAllLabel}
        </Link>
      </div>
      {children}
    </section>
  )
}

function DashboardPreviewSkeleton() {
  return (
    <>
      {Array.from({ length: PAGINATION.DASHBOARD_PREVIEW_LIMIT }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center justify-between gap-4 px-5 py-4">
          <div className="min-w-0 flex-1">
            <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
            <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-gray-100" />
          </div>
          <div className="h-6 w-20 shrink-0 animate-pulse rounded-full bg-gray-100" />
        </div>
      ))}
    </>
  )
}

export function DashboardMain() {
  const { locale } = useParams<{ locale: string }>()
  const currentLocale = locale === 'ar' ? 'ar' : 'en'
  const adminTranslations = useTranslations('admin')
  const supportTranslations = useTranslations('admin.supportPage')
  const cmsTableTranslations = useTranslations('admin.cmsPage.table')
  const hrTranslations = useTranslations('admin.hrPage')
  const rolesTranslations = useTranslations('admin.rolesPage')
  const usersTranslations = useTranslations('admin.usersPage.list')
  const permissions = useAuthStore((state) => state.permissions ?? [])

  const canViewCms = canAccessAdminPath(permissions, 'cms')
  const canViewHr = canAccessAdminPath(permissions, 'hr')
  const canViewSupport = canAccessAdminPath(permissions, 'support')
  const canViewUsers = hasAdminPermission(permissions, ADMIN_USERS_PERMISSION)

  const { data: pagesResponse, isLoading: cmsLoading } = useCmsPages({ enabled: canViewCms, limit: PAGINATION.SELECT_LIMIT })
  const { data: activePagesResponse, isLoading: activeCmsLoading } = useCmsPages({ enabled: canViewCms, limit: PAGINATION.COUNT_ONLY_LIMIT, isActive: true })
  const { data: jobsResponse, isLoading: jobsLoading } = useHrJobs({ enabled: canViewHr, limit: PAGINATION.COUNT_ONLY_LIMIT })
  const { data: publishedJobsResponse, isLoading: publishedJobsLoading } = useHrJobs({ enabled: canViewHr, limit: PAGINATION.COUNT_ONLY_LIMIT, status: 'published' })
  const { data: candidatesResponse, isLoading: candidatesLoading } = useHrCandidates({ enabled: canViewHr, limit: PAGINATION.COUNT_ONLY_LIMIT })
  const { data: supportStats, isLoading: supportLoading } = useSupportStats({ enabled: canViewSupport })
  const { data: ticketsResponse, isLoading: ticketsLoading } = useSupportTickets({ enabled: canViewSupport, limit: PAGINATION.DASHBOARD_PREVIEW_LIMIT })
  const { data: usersResponse, isLoading: usersLoading } = useUsers({ enabled: canViewUsers, limit: PAGINATION.SELECT_LIMIT })
  const { data: rolesResponse, isLoading: rolesLoading } = useAdminRoles({ enabled: canViewUsers, limit: PAGINATION.COUNT_ONLY_LIMIT })

  const pages = pagesResponse?.data ?? []
  const users = usersResponse?.data ?? []
  const tickets = ticketsResponse?.data ?? []
  const dashboardUsers = users.slice(0, PAGINATION.DASHBOARD_PREVIEW_LIMIT)
  const totalPages = pagesResponse?.total ?? 0
  const activePages = activePagesResponse?.total ?? 0
  const totalSections = pages.reduce((sum, page) => sum + getCmsPageSectionsCount(page), 0)
  const totalRoles = rolesResponse?.total ?? 0
  const usersTotal = usersResponse?.total ?? 0
  const usersBanned = users.filter((user) => user.banned).length
  const totalJobs = jobsResponse?.total ?? 0
  const publishedJobs = publishedJobsResponse?.total ?? 0
  const totalCandidates = candidatesResponse?.total ?? 0

  const quickActionMeta = {
    cms: {
      description: adminTranslations('quickActionCms'),
      icon: <FileIcon />,
      tone: 'blue',
    },
    hr: {
      description: adminTranslations('quickActionHr'),
      icon: <BriefcaseIcon />,
      tone: 'yellow',
    },
    support: {
      description: adminTranslations('quickActionSupport'),
      icon: <SupportIcon />,
      tone: 'green',
    },
    users: {
      description: adminTranslations('quickActionUsers'),
      icon: <UsersIcon />,
      tone: 'purple',
    },
    settings: {
      description: adminTranslations('quickActionSettings'),
      icon: <SettingsIcon />,
      tone: 'gray',
    },
  } satisfies Record<Exclude<AdminNavPath, 'dashboard'>, Omit<QuickLink, 'href' | 'label'>>

  const quickLinks: Array<QuickLink & { visible: boolean }> = [
    ...ADMIN_NAV_ITEMS
      .filter((item) => item.path !== 'dashboard')
      .map((item) => ({
        href: `/${locale}/admin/${item.path}`,
        label: adminTranslations(item.labelKey as Parameters<typeof adminTranslations>[0]),
        ...quickActionMeta[item.path as Exclude<AdminNavPath, 'dashboard'>],
        visible: hasAdminPermission(permissions, item.permission),
      })),
    {
      href: `/${locale}/admin/users/roles`,
      label: adminTranslations('groups'),
      description: adminTranslations('quickActionGroups'),
      icon: <GroupsIcon />,
      tone: 'yellow',
      visible: canViewUsers,
    },
  ]

  const visibleQuickLinks = quickLinks.filter((item) => item.visible)

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-4">
        {canViewCms && (
          <DashboardSummaryCard
            title={adminTranslations('pages')}
            primaryLabel={adminTranslations('totalPages')}
            primaryValue={totalPages}
            icon={<FileIcon />}
            tone="blue"
            loading={cmsLoading || activeCmsLoading}
            metrics={[
              { label: cmsTableTranslations('statusActive'), value: activePages },
              { label: cmsTableTranslations('colSections'), value: totalSections },
            ]}
          />
        )}

        {canViewHr && (
          <DashboardSummaryCard
            title={hrTranslations('pageTitle')}
            primaryLabel={hrTranslations('totalJobs')}
            primaryValue={totalJobs}
            icon={<BriefcaseIcon />}
            tone="yellow"
            loading={jobsLoading || publishedJobsLoading || candidatesLoading}
            metrics={[
              { label: hrTranslations('publishedJobs'), value: publishedJobs },
              { label: hrTranslations('totalCandidates'), value: totalCandidates },
            ]}
          />
        )}

        {canViewSupport && (
          <DashboardSummaryCard
            title={supportTranslations('pageTitle')}
            primaryLabel={adminTranslations('totalNewTickets')}
            primaryValue={supportStats.newCount}
            icon={<SupportIcon />}
            tone="green"
            loading={supportLoading}
            metrics={[
              { label: supportTranslations('statRead'), value: supportStats.readCount },
              { label: supportTranslations('statClosed'), value: supportStats.closedCount },
            ]}
          />
        )}

        {canViewUsers && (
          <DashboardSummaryCard
            title={usersTranslations('pageTitle')}
            primaryLabel={adminTranslations('totalUsers')}
            primaryValue={usersTotal}
            icon={<UsersIcon />}
            tone="purple"
            loading={usersLoading || rolesLoading}
            metrics={[
              { label: usersTranslations('banned'), value: usersBanned },
              { label: rolesTranslations('pageTitle'), value: totalRoles },
            ]}
          />
        )}
      </div>

      <section className="overflow-hidden rounded-[18px] border border-gray-200 bg-white shadow-[0_2px_12px_rgba(52,89,165,0.08)]">
        <div className="flex flex-col gap-3 border-b border-gray-100 bg-gradient-to-l from-admin-primary-bg via-white to-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[15px] font-bold text-gray-900">{adminTranslations('quickActions')}</h2>
          </div>
          <span className="inline-flex w-fit items-center rounded-full border border-blue-100 bg-white px-3 py-1 text-[11px] font-bold text-admin-primary">
            {visibleQuickLinks.length}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 xl:grid-cols-6">
          {visibleQuickLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group relative min-h-[118px] overflow-hidden rounded-[16px] border border-gray-100 bg-white p-4 text-start transition-all hover:-translate-y-0.5 hover:border-blue-100 hover:bg-gray-50 hover:shadow-[0_10px_24px_rgba(52,89,165,0.10)]"
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-[13px] border transition-transform group-hover:scale-105 ${summaryToneClasses[item.tone]}`}>
                {item.icon}
              </div>
              <div className="mt-4 pe-10">
                <p className="text-[14px] font-black text-gray-900">{item.label}</p>
                <p className="mt-1 text-[12px] font-medium leading-5 text-gray-400">{item.description}</p>
              </div>
              <span className="absolute end-4 top-4 rounded-full border border-gray-100 bg-white px-2 py-1 text-[10px] font-bold text-admin-primary opacity-0 transition-opacity group-hover:opacity-100">
                {adminTranslations('open')}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {(canViewSupport || canViewUsers) && (
        <div className={`grid grid-cols-1 gap-5 ${canViewSupport && canViewUsers ? 'xl:grid-cols-2' : ''}`}>
          {canViewSupport && (
            <DashboardPreviewCard
              title={adminTranslations('latestTickets')}
              href={`/${locale}/admin/support`}
              viewAllLabel={adminTranslations('viewAll')}
            >
              <div className="divide-y divide-gray-100">
                {ticketsLoading ? (
                  <DashboardPreviewSkeleton />
                ) : tickets.length === 0 ? (
                  <div className="px-5 py-10 text-center text-[13px] text-gray-400">
                    {supportTranslations('empty')}
                  </div>
                ) : (
                  tickets.map((ticket) => (
                    <Link
                      key={ticket.id}
                      href={`/${locale}/admin/support?ticketId=${ticket.id}`}
                      className="group flex items-start justify-between gap-4 px-5 py-4 text-start transition-colors hover:bg-gray-50"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-center gap-2">
                          <p className="truncate text-[14px] font-black text-gray-900">{ticket.subject}</p>
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-admin-primary opacity-0 transition-opacity group-hover:opacity-100" />
                        </div>
                        <p className="mt-1 truncate text-[12px] font-medium text-gray-400">
                          {ticket.fullName} · <span dir="ltr">{ticket.email}</span>
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <AdminBadge variant={statusVariant[ticket.status]}>
                          {supportTranslations(`status_${ticket.status}`)}
                        </AdminBadge>
                        <span className="text-[11px] font-semibold text-gray-400">
                          {formatDateShort(ticket.createdAt, currentLocale)}
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </DashboardPreviewCard>
          )}

          {canViewUsers && (
            <DashboardPreviewCard
              title={adminTranslations('latestUsers')}
              href={`/${locale}/admin/users`}
              viewAllLabel={adminTranslations('viewAll')}
            >
              <div className="divide-y divide-gray-100">
                {usersLoading ? (
                  <DashboardPreviewSkeleton />
                ) : dashboardUsers.length === 0 ? (
                  <div className="px-5 py-10 text-center text-[13px] text-gray-400">
                    {usersTranslations('empty')}
                  </div>
                ) : (
                  dashboardUsers.map((user) => (
                    <Link
                      key={user.id}
                      href={`/${locale}/admin/users?editUserId=${user.id}`}
                      className="group flex items-center justify-between gap-4 px-5 py-4 text-start transition-colors hover:bg-gray-50"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] text-[14px] font-bold text-white"
                          style={{ background: `linear-gradient(135deg, ${avatarColor(user.name)}, ${avatarColor(user.name)}cc)` }}
                        >
                          {user.name.trim().charAt(0) || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-black text-gray-900">{user.name}</p>
                          <p className="mt-1 truncate text-[12px] font-medium text-gray-400" dir="ltr">{user.email}</p>
                          <p className="mt-1 truncate text-[11px] font-semibold text-gray-400">
                            {usersTranslations('colRole')}: {user.role}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <AdminBadge variant={user.banned ? 'rejected' : 'active'}>
                          {user.banned ? usersTranslations('banned') : usersTranslations('active')}
                        </AdminBadge>
                        <span className="text-[11px] font-semibold text-gray-400">
                          {formatDateShort(user.createdAt, currentLocale)}
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </DashboardPreviewCard>
          )}
        </div>
      )}
    </div>
  )
}
