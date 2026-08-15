'use client'

import { useState } from 'react'
import { usePathname, useParams, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { AdminPageHeader }                  from '@/components/ui/admin/AdminPageHeader'
import { AdminStatsGrid, type StatItem }    from '@/components/ui/admin/AdminStatsGrid'
import { AdminDataTable, type AdminColumn } from '@/components/ui/admin/AdminDataTable'
import { AdminSearchBar }                   from '@/components/ui/admin/AdminSearchBar'
import { AdminPagination }                  from '@/components/ui/admin/AdminPagination'
import { AdminBadge, type BadgeVariant }    from '@/components/ui/admin/AdminBadge'
import { AdminDialog }                      from '@/components/ui/admin/AdminDialog'
import { useSupportTickets, type SupportTicket, type TicketStatus } from '../hooks/useSupportTickets'
import { useSupportStats }                  from '../hooks/useSupportStats'
import { useSupportStatusUpdate, useSupportDelete } from '../hooks/useSupportMutations'
import { PAGINATION } from '@/lib/constants/pagination'
import { getPaginationMeta } from '@/lib/pagination'
import { EyeIcon, TrashIcon, XIcon, InboxIcon, MailOpenIcon, CheckCircleIcon, PaperclipIcon } from '@/components/ui/shared/Icons'

type Row = SupportTicket & Record<string, unknown>

// ── Status badge map ──────────────────────────────────────────────
const statusVariant: Record<TicketStatus, BadgeVariant> = {
  new:    'unread',
  read:   'active',
  closed: 'inactive',
}

const labelClass = 'block text-[11px] text-gray-400 uppercase tracking-[0.4px] mb-[5px]'
const valueClass = 'text-[14px] text-gray-800 font-medium'

export function SupportMain() {
  const { locale } = useParams<{ locale: string }>()
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supportTranslations = useTranslations('admin.supportPage')
  const adminTranslations   = useTranslations('admin')
  const ticketIdParam = searchParams.get('ticketId')

  // ── List state ────────────────────────────────────────────────────
  const [page,         setPage]         = useState(1)
  const [inputVal,     setInputVal]     = useState('')
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | TicketStatus>('')
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [deleteConfirm,  setDeleteConfirm]  = useState<SupportTicket | null>(null)
  const [lightboxSrc,    setLightboxSrc]    = useState<string | null>(null)

  const { data, isLoading }        = useSupportTickets({ page, limit: PAGINATION.TABLE_LIMIT, search, status: statusFilter || undefined })
  const { data: stats, isLoading: statsLoading } = useSupportStats()
  const statusUpdate               = useSupportStatusUpdate()
  const deleteMutation             = useSupportDelete()

  const rows       = (data?.data ?? []) as Row[]
  const selectedTicketFromParam = ticketIdParam
    ? data?.data.find((item) => item.id === ticketIdParam) ?? null
    : null
  const activeTicket = selectedTicket ?? selectedTicketFromParam
  const total      = data?.total ?? 0
  const currentPage = data?.page ?? page
  const currentLimit = data?.limit ?? PAGINATION.TABLE_LIMIT
  const { totalPages } = getPaginationMeta(total, currentPage, currentLimit)

  function clearTicketParam() {
    if (!ticketIdParam) return

    const nextParams = new URLSearchParams(searchParams.toString())
    nextParams.delete('ticketId')
    const query = nextParams.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  function closeSelectedTicket() {
    setSelectedTicket(null)
    clearTicketParam()
  }

  // ── Stats items ───────────────────────────────────────────────────
  const statItems: StatItem[] = [
    { label: supportTranslations('statNew'),    value: stats.newCount,    icon: <InboxIcon />,      iconColor: 'blue'   },
    { label: supportTranslations('statRead'),   value: stats.readCount,   icon: <MailOpenIcon />,   iconColor: 'green'  },
    { label: supportTranslations('statClosed'), value: stats.closedCount, icon: <CheckCircleIcon />, iconColor: 'gray'  },
  ]

  // ── Status filter options ─────────────────────────────────────────
  const statusOptions = [
    { label: supportTranslations('statusAll'),    value: '' },
    { label: supportTranslations('statusNew'),    value: 'new' },
    { label: supportTranslations('statusRead'),   value: 'read' },
    { label: supportTranslations('statusClosed'), value: 'closed' },
  ]

  // ── Table columns ─────────────────────────────────────────────────
  const columns: AdminColumn<Row>[] = [
    {
      key: 'fullName',
      label: supportTranslations('colName'),
      sortable: false,
      render: (row) => (
        <div className={`min-w-[170px] ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
          <div className="text-[13px] font-semibold text-gray-800">{row.fullName as string}</div>
          <div
            className={`mt-1 max-w-[170px] truncate text-[12px] text-gray-400 ${locale === 'ar' ? 'text-right' : 'text-left'}`}
            dir="ltr"
          >
            {row.email as string}
          </div>
        </div>
      ),
    },
    {
      key: 'companyName',
      label: supportTranslations('colCompany'),
      sortable: false,
      render: (row) => (
        <span className="text-[13px] text-gray-700">{row.companyName as string}</span>
      ),
    },
    {
      key: 'subject',
      label: supportTranslations('colSubject'),
      sortable: false,
      render: (row) => (
        <span className="text-[13px] text-gray-800 font-medium max-w-[200px] truncate block">
          {row.subject as string}
        </span>
      ),
    },
    {
      key: 'status',
      label: supportTranslations('colStatus'),
      sortable: false,
      render: (row) => {
        const status = row.status as TicketStatus
        return (
          <AdminBadge variant={statusVariant[status]}>
            {supportTranslations(`status_${status}`)}
          </AdminBadge>
        )
      },
    },
    {
      key: 'createdAt',
      label: supportTranslations('colDate'),
      sortable: false,
      render: (row) => (
        <span className="text-[13px] text-gray-500">
          {new Date(row.createdAt as string).toLocaleDateString(locale === 'ar' ? 'ar-SA-u-nu-latn' : 'en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
        </span>
      ),
    },
  ]

  return (
    <>
      {/* Header */}
      <AdminPageHeader
        title={supportTranslations('pageTitle')}
        breadcrumbs={[
          { label: adminTranslations('dashboard'), href: `/${locale}/admin/dashboard` },
          { label: supportTranslations('pageTitle') },
        ]}
      />

      {/* Stats */}
      <AdminStatsGrid stats={statItems} loading={statsLoading} columns={3} />

      {/* Filter Bar */}
      <div className="bg-white rounded-[10px] border border-gray-200 shadow-[0_2px_8px_rgba(52,89,165,0.05)] px-5 py-4">
        <AdminSearchBar
          search={inputVal}
          onSearchChange={setInputVal}
          searchPlaceholder={supportTranslations('search')}
          filters={[
            { key: 'status', placeholder: supportTranslations('statusAll'), options: statusOptions },
          ]}
          filterValues={{ status: statusFilter }}
          onFilterChange={(_key, value) => {
            setStatusFilter(value as '' | TicketStatus)
            setPage(1)
          }}
          onSearch={() => {
            setSearch(inputVal)
            setPage(1)
          }}
          searchButtonLabel={supportTranslations('searchButton')}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-[10px] border border-gray-200 shadow-[0_2px_12px_rgba(52,89,165,0.07)] overflow-hidden">
        <AdminDataTable<Row>
          columns={columns}
          data={rows}
          keyField="id"
          loading={isLoading}
          emptyMessage={supportTranslations('empty')}
          hidePagination
          flat
          actionsLabel={supportTranslations('colActions')}
          actions={(row) => (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedTicket(row as unknown as SupportTicket)}
                className="flex items-center gap-1.5 text-[13px] text-admin-primary border border-gray-200 rounded-[6px] px-3 py-1.5 hover:bg-admin-primary-bg transition-colors whitespace-nowrap cursor-pointer bg-transparent"
              >
                <EyeIcon />
                {supportTranslations('view')}
              </button>
              <button
                onClick={() => setDeleteConfirm(row as unknown as SupportTicket)}
                className="flex items-center gap-1.5 text-[13px] text-danger-red border border-danger-bg rounded-[6px] px-3 py-1.5 hover:bg-danger-bg-faint transition-colors whitespace-nowrap cursor-pointer bg-transparent"
              >
                <TrashIcon />
                {supportTranslations('delete')}
              </button>
            </div>
          )}
        />

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 text-sm text-gray-500">
            <span>{supportTranslations('paginationInfo', { total, current: currentPage, last: totalPages })}</span>
            <AdminPagination totalPages={totalPages} currentPage={currentPage} onPageChange={setPage} />
          </div>
        )}
      </div>

      {/* ── Detail Dialog ────────────────────────────────────────────── */}
      {activeTicket && (
        <AdminDialog
          onClose={closeSelectedTicket}
          size="lg"
          title={
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[10px] bg-admin-primary-bg flex items-center justify-center text-admin-primary">
                <InboxIcon />
              </div>
              <div>
                <div className="text-[15px] font-bold text-gray-800">{supportTranslations('dialogTitle')}</div>
                <AdminBadge variant={statusVariant[activeTicket.status]}>
                  {supportTranslations(`status_${activeTicket.status}`)}
                </AdminBadge>
              </div>
            </div>
          }
          footer={
            <div className="flex justify-end w-full">
              <button
                onClick={closeSelectedTicket}
                className="px-5 py-2 rounded-[8px] border border-gray-200 text-[14px] font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                {supportTranslations('close')}
              </button>
            </div>
          }
        >
          <div className="flex flex-col gap-5">

              {/* Sender info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className={labelClass}>{supportTranslations('fieldName')}</span>
                  <span className={valueClass}>{activeTicket.fullName}</span>
                </div>
                <div>
                  <span className={labelClass}>{supportTranslations('fieldEmail')}</span>
                  <span className={`${valueClass} block`} dir="ltr">{activeTicket.email}</span>
                </div>
                <div>
                  <span className={labelClass}>{supportTranslations('fieldCompany')}</span>
                  <span className={valueClass}>{activeTicket.companyName}</span>
                </div>
                <div>
                  <span className={labelClass}>{supportTranslations('fieldDate')}</span>
                  <span className={valueClass}>
                    {new Date(activeTicket.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-SA-u-nu-latn' : 'en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Subject */}
              <div>
                <span className={labelClass}>{supportTranslations('fieldSubject')}</span>
                <span className={valueClass}>{activeTicket.subject}</span>
              </div>

              {/* Message */}
              <div>
                <span className={labelClass}>{supportTranslations('fieldMessage')}</span>
                <div className="bg-gray-50 rounded-[10px] p-4 text-[14px] text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {activeTicket.message}
                </div>
              </div>

              {/* Attachments */}
              {activeTicket.attachments.length > 0 && (
                <div>
                  <span className={labelClass}>{supportTranslations('fieldAttachments')}</span>
                  <div className="flex flex-wrap gap-3">
                    {activeTicket.attachments.map((file) => {
                      const url      = `/uploads/support/${file}`
                      const isImage  = /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(file)
                      return isImage ? (
                        <button
                          key={file}
                          type="button"
                          onClick={() => setLightboxSrc(url)}
                          className="w-20 h-20 rounded-[10px] border border-gray-200 overflow-hidden flex-shrink-0 hover:opacity-80 transition-opacity cursor-pointer bg-transparent p-0"
                          title={file}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={file} className="w-full h-full object-cover" />
                        </button>
                      ) : (
                        <a
                          key={file}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-[13px] text-admin-primary hover:underline"
                        >
                          <PaperclipIcon />
                          {file}
                        </a>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Change status */}
              <div>
                <span className={labelClass}>{supportTranslations('changeStatus')}</span>
                <div className="flex items-center gap-2 flex-wrap">
                  {(['new', 'read', 'closed'] as TicketStatus[]).map((s) => (
                    <button
                      key={s}
                      disabled={activeTicket.status === s || statusUpdate.isPending}
                      onClick={async () => {
                        await statusUpdate.mutateAsync({ id: activeTicket.id, status: s })
                        setSelectedTicket({ ...activeTicket, status: s })
                      }}
                      className={`px-4 py-1.5 rounded-full text-[12px] font-medium border transition-colors cursor-pointer disabled:cursor-default ${
                        activeTicket.status === s
                          ? 'bg-admin-primary text-white border-admin-primary'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-admin-primary hover:text-admin-primary'
                      }`}
                    >
                      {supportTranslations(`status_${s}`)}
                    </button>
                  ))}
                </div>
              </div>

          </div>
        </AdminDialog>
      )}

      {/* ── Delete Confirm Dialog ────────────────────────────────────── */}
      {deleteConfirm && (
        <AdminDialog
          title={supportTranslations('deleteConfirmTitle')}
          onClose={() => setDeleteConfirm(null)}
          size="sm"
          footer={
            <div className="flex items-center justify-end gap-3 w-full">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-5 py-2 rounded-[8px] border border-gray-200 text-[14px] font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                {supportTranslations('cancel')}
              </button>
              <button
                disabled={deleteMutation.isPending}
                onClick={async () => {
                  await deleteMutation.mutateAsync(deleteConfirm.id)
                  setDeleteConfirm(null)
                  if (selectedTicket?.id === deleteConfirm.id) setSelectedTicket(null)
                }}
                className="px-5 py-2 rounded-[8px] bg-danger-red text-white text-[14px] font-medium hover:bg-danger-deep transition-colors cursor-pointer disabled:opacity-50"
              >
                {deleteMutation.isPending ? '...' : supportTranslations('confirmDelete')}
              </button>
            </div>
          }
        >
          <div className="text-[14px] text-gray-500">{supportTranslations('deleteConfirmText')}</div>
        </AdminDialog>
      )}

      {/* ── Lightbox ─────────────────────────────────────────────────── */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80"
          onClick={() => setLightboxSrc(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxSrc(null)}
            className="absolute top-4 end-4 w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors cursor-pointer"
          >
            <XIcon />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxSrc}
            alt=""
            className="max-w-[90vw] max-h-[90vh] rounded-[12px] object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
