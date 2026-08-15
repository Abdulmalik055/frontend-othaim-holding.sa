'use client'

import { useState, type ReactNode } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { AdminBadge, type BadgeVariant } from '@/components/ui/admin/AdminBadge'
import { AdminButton, ADMIN_HEADER_ACTION_BUTTON_CLASS } from '@/components/ui/admin/AdminButton'
import { AdminPageHeader } from '@/components/ui/admin/AdminPageHeader'
import { AdminPagination } from '@/components/ui/admin/AdminPagination'
import { AdminSearchBar } from '@/components/ui/admin/AdminSearchBar'
import type { SelectOption } from '@/components/ui/admin/AdminSelect'
import { AdminTabs } from '@/components/ui/admin/AdminTabs'
import { EditIcon, EyeIcon, PlusIcon } from '@/components/ui/shared/Icons'
import { PAGINATION } from '@/lib/constants/pagination'
import { formatDateShort } from '@/lib/dates'
import { getPaginationMeta } from '@/lib/pagination'
import { useCareerCities } from '../hooks/useCareerCities'
import { useHrCandidates, type HrCandidate, type HrCandidateStatus } from '../hooks/useHrCandidates'
import { useHrJobs, type HrJob, type HrJobStatus } from '../hooks/useHrJobs'
import { HrCandidateDialog } from './HrCandidateDialog'
import { HrJobDialog } from './HrJobDialog'

type JobDialogState =
  | { mode: 'create' }
  | { mode: 'view' | 'edit'; job: HrJob }

type SummaryTone = 'blue' | 'green' | 'yellow' | 'purple'

const jobStatusVariant: Record<HrJobStatus, BadgeVariant> = {
  draft: 'pending',
  published: 'active',
  closed: 'inactive',
}

const candidateStatusVariant: Record<HrCandidateStatus, BadgeVariant> = {
  new: 'unread',
  under_review: 'pending',
  accepted: 'active',
  rejected: 'rejected',
}

const summaryToneClasses = {
  blue: 'bg-admin-primary-bg text-admin-primary border-blue-100',
  green: 'bg-success-bg-alt text-success-green border-green-100',
  yellow: 'bg-warning-bg text-warning-alt border-yellow-100',
  purple: 'bg-purple-50 text-purple border-purple-100',
} satisfies Record<SummaryTone, string>

export function HrMain() {
  const locale = useLocale() as 'ar' | 'en'
  const adminTranslations = useTranslations('admin')
  const translations = useTranslations('admin.hrPage')
  const [activeTab, setActiveTab] = useState('jobs')
  const [jobDialog, setJobDialog] = useState<JobDialogState | null>(null)

  const { data: totalJobsResponse, isLoading: totalJobsLoading } = useHrJobs({ limit: PAGINATION.COUNT_ONLY_LIMIT })
  const { data: publishedJobsResponse, isLoading: publishedJobsLoading } = useHrJobs({ limit: PAGINATION.COUNT_ONLY_LIMIT, status: 'published' })
  const { data: totalCandidatesResponse, isLoading: totalCandidatesLoading } = useHrCandidates({ limit: PAGINATION.COUNT_ONLY_LIMIT })
  const { data: newCandidatesResponse, isLoading: newCandidatesLoading } = useHrCandidates({ limit: PAGINATION.COUNT_ONLY_LIMIT, status: 'new' })

  return (
    <>
      <AdminPageHeader
        title={translations('pageTitle')}
        breadcrumbs={[
          { label: adminTranslations('dashboard'), href: `/${locale}/admin/dashboard` },
          { label: translations('pageTitle') },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard tone="blue" title={translations('totalJobs')} value={totalJobsResponse?.total ?? 0} icon={<BriefcaseIcon />} loading={totalJobsLoading} />
        <SummaryCard tone="green" title={translations('publishedJobs')} value={publishedJobsResponse?.total ?? 0} icon={<CheckListIcon />} loading={publishedJobsLoading} />
        <SummaryCard tone="purple" title={translations('totalCandidates')} value={totalCandidatesResponse?.total ?? 0} icon={<UsersIcon />} loading={totalCandidatesLoading} />
        <SummaryCard tone="yellow" title={translations('newCandidates')} value={newCandidatesResponse?.total ?? 0} icon={<SparkIcon />} loading={newCandidatesLoading} />
      </div>

      <AdminTabs
        variant="pill"
        value={activeTab}
        onChange={setActiveTab}
        listAction={
          activeTab === 'jobs' ? (
            <AdminButton size="sm" className={ADMIN_HEADER_ACTION_BUTTON_CLASS} onClick={() => setJobDialog({ mode: 'create' })}>
              <PlusIcon />
              {translations('addJob')}
            </AdminButton>
          ) : undefined
        }
        tabs={[
          { id: 'jobs', label: translations('jobsTab'), icon: <BriefcaseIcon size={16} />, content: <JobsSection onOpenJobDialog={setJobDialog} /> },
          { id: 'candidates', label: translations('candidatesTab'), icon: <UsersIcon size={16} />, content: <CandidatesSection /> },
        ]}
      />

      {jobDialog && (
        <HrJobDialog
          mode={jobDialog.mode}
          job={jobDialog.mode === 'create' ? undefined : jobDialog.job}
          onClose={() => setJobDialog(null)}
        />
      )}
    </>
  )
}

type JobsSectionProps = {
  onOpenJobDialog: (dialog: JobDialogState) => void
}

function JobsSection({ onOpenJobDialog }: JobsSectionProps) {
  const locale = useLocale() as 'ar' | 'en'
  const translations = useTranslations('admin.hrPage')
  const [page, setPage] = useState(1)
  const [inputVal, setInputVal] = useState('')
  const [search, setSearch] = useState('')
  const [cityId, setCityId] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | HrJobStatus>('')

  const { data: cities = [] } = useCareerCities()
  const { data, isLoading } = useHrJobs({
    page,
    limit: PAGINATION.TABLE_LIMIT,
    search,
    cityId,
    status: statusFilter || undefined,
  })

  const jobs = data?.data ?? []
  const total = data?.total ?? 0
  const currentPage = data?.page ?? page
  const currentLimit = data?.limit ?? PAGINATION.TABLE_LIMIT
  const { totalPages } = getPaginationMeta(total, currentPage, currentLimit)

  const statusOptions = [
    { label: translations('allStatuses'), value: '' },
    { label: translations('jobStatus_draft'), value: 'draft' },
    { label: translations('jobStatus_published'), value: 'published' },
    { label: translations('jobStatus_closed'), value: 'closed' },
  ]
  const cityOptions: SelectOption[] = [
    { label: translations('allCities'), value: '' },
    ...cities.map((cityItem) => ({
      value: cityItem.id,
      label: locale === 'ar' ? cityItem.nameAr : cityItem.nameEn,
    })),
  ]

  function applySearch() {
    setSearch(inputVal)
    setPage(1)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-[10px] border border-gray-200 bg-white px-5 py-4 shadow-[0_2px_8px_rgba(52,89,165,0.05)]">
        <AdminSearchBar
          search={inputVal}
          onSearchChange={setInputVal}
          searchPlaceholder={translations('jobSearchPlaceholder')}
          filters={[
            { key: 'cityId', placeholder: translations('allCities'), options: cityOptions },
            { key: 'status', placeholder: translations('allStatuses'), options: statusOptions },
          ]}
          filterValues={{ cityId, status: statusFilter }}
          onFilterChange={(key, value) => {
            if (key === 'cityId') setCityId(value)
            if (key === 'status') setStatusFilter(value as '' | HrJobStatus)
            setPage(1)
          }}
          onSearch={applySearch}
          searchButtonLabel={translations('searchButton')}
        />
      </div>

      <div className="overflow-hidden rounded-[10px] border border-gray-200 bg-white shadow-[0_2px_12px_rgba(52,89,165,0.07)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <TableHead>{translations('job')}</TableHead>
                <TableHead>{translations('city')}</TableHead>
                <TableHead>{translations('status')}</TableHead>
                <TableHead>{translations('candidatesCount')}</TableHead>
                <TableHead>{translations('closingDate')}</TableHead>
                <TableHead>{translations('actions')}</TableHead>
              </tr>
            </thead>
            <tbody>
              {isLoading && <LoadingRow colSpan={6} />}
              {!isLoading && jobs.length === 0 && <EmptyRow colSpan={6} message={translations('emptyJobs')} />}
              {jobs.map((job) => (
                <tr key={job.id} className="border-b border-gray-100 last:border-none hover:bg-neutral-50">
                  <td className="px-4 py-4">
                    <div className={`max-w-[260px] ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                      <p className="text-[14px] font-black text-gray-900">{locale === 'ar' ? job.titleAr : job.titleEn}</p>
                      <p className="mt-1 max-w-full truncate text-[12px] text-gray-400">
                        {locale === 'ar' ? job.titleEn : job.titleAr}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-[13px] font-semibold text-gray-600">{locale === 'ar' ? job.city?.nameAr : job.city?.nameEn}</td>
                  <td className="px-4 py-4"><AdminBadge variant={jobStatusVariant[job.status]}>{translations(`jobStatus_${job.status}`)}</AdminBadge></td>
                  <td className="px-4 py-4"><span className="inline-flex min-w-10 justify-center rounded-full bg-gray-100 px-3 py-1 text-[12px] font-black text-gray-700">{job._count?.candidates ?? 0}</span></td>
                  <td className="px-4 py-4 text-[13px] text-gray-500">{job.closingDate ? formatDateShort(job.closingDate, locale) : translations('noClosingDate')}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <AdminButton variant="icon" size="sm" onClick={() => onOpenJobDialog({ mode: 'view', job })}><EyeIcon /></AdminButton>
                      <AdminButton variant="icon" size="sm" onClick={() => onOpenJobDialog({ mode: 'edit', job })}><EditIcon /></AdminButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 text-sm text-gray-500">
            <span>{translations('paginationInfo', { total, current: currentPage, last: totalPages })}</span>
            <AdminPagination totalPages={totalPages} currentPage={currentPage} onPageChange={setPage} />
          </div>
        )}
      </div>

    </div>
  )
}

function CandidatesSection() {
  const locale = useLocale() as 'ar' | 'en'
  const translations = useTranslations('admin.hrPage')
  const [page, setPage] = useState(1)
  const [inputVal, setInputVal] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | HrCandidateStatus>('')
  const [jobFilter, setJobFilter] = useState('')
  const [selectedCandidate, setSelectedCandidate] = useState<HrCandidate | null>(null)

  const { data: jobsResponse } = useHrJobs({ limit: PAGINATION.SELECT_LIMIT })
  const { data, isLoading } = useHrCandidates({
    page,
    limit: PAGINATION.TABLE_LIMIT,
    search,
    status: statusFilter || undefined,
    jobId: jobFilter || undefined,
  })

  const candidates = data?.data ?? []
  const total = data?.total ?? 0
  const currentPage = data?.page ?? page
  const currentLimit = data?.limit ?? PAGINATION.TABLE_LIMIT
  const { totalPages } = getPaginationMeta(total, currentPage, currentLimit)

  const statusOptions = [
    { label: translations('allStatuses'), value: '' },
    { label: translations('candidateStatus_new'), value: 'new' },
    { label: translations('candidateStatus_under_review'), value: 'under_review' },
    { label: translations('candidateStatus_accepted'), value: 'accepted' },
    { label: translations('candidateStatus_rejected'), value: 'rejected' },
  ]

  const jobOptions: SelectOption[] = [
    { label: translations('allJobs'), value: '' },
    ...(jobsResponse?.data ?? []).map((job) => ({
      value: job.id,
      label: locale === 'ar' ? job.titleAr : job.titleEn,
    })),
  ]

  function applySearch() {
    setSearch(inputVal)
    setPage(1)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-[10px] border border-gray-200 bg-white px-5 py-4 shadow-[0_2px_8px_rgba(52,89,165,0.05)]">
        <AdminSearchBar
          search={inputVal}
          onSearchChange={setInputVal}
          searchPlaceholder={translations('candidateSearchPlaceholder')}
          filters={[
            { key: 'status', placeholder: translations('allStatuses'), options: statusOptions },
            { key: 'job', placeholder: translations('allJobs'), options: jobOptions },
          ]}
          filterValues={{ status: statusFilter, job: jobFilter }}
          onFilterChange={(key, value) => {
            if (key === 'status') setStatusFilter(value as '' | HrCandidateStatus)
            if (key === 'job') setJobFilter(value)
            setPage(1)
          }}
          onSearch={applySearch}
          searchButtonLabel={translations('searchButton')}
        />
      </div>

      <div className="overflow-hidden rounded-[10px] border border-gray-200 bg-white shadow-[0_2px_12px_rgba(52,89,165,0.07)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <TableHead>{translations('candidate')}</TableHead>
                <TableHead>{translations('job')}</TableHead>
                <TableHead>{translations('city')}</TableHead>
                <TableHead>{translations('status')}</TableHead>
                <TableHead>{translations('appliedAt')}</TableHead>
                <TableHead>{translations('actions')}</TableHead>
              </tr>
            </thead>
            <tbody>
              {isLoading && <LoadingRow colSpan={6} />}
              {!isLoading && candidates.length === 0 && <EmptyRow colSpan={6} message={translations('emptyCandidates')} />}
              {candidates.map((candidate) => (
                <tr key={candidate.id} className="border-b border-gray-100 last:border-none hover:bg-neutral-50">
                  <td className="px-4 py-4">
                    <button type="button" onClick={() => setSelectedCandidate(candidate)} className="block max-w-[220px] text-start">
                      <p className="truncate text-[14px] font-black text-gray-900">{candidate.fullName}</p>
                      <p className="mt-1 truncate text-[12px] text-gray-400" dir="ltr">{candidate.email}</p>
                    </button>
                  </td>
                  <td className="px-4 py-4">
                    <p className="max-w-[220px] truncate text-[13px] font-semibold text-gray-700">{locale === 'ar' ? candidate.job?.titleAr : candidate.job?.titleEn}</p>
                  </td>
                  <td className="px-4 py-4 text-[13px] text-gray-500">{locale === 'ar' ? (candidate.city ?? candidate.job?.city)?.nameAr : (candidate.city ?? candidate.job?.city)?.nameEn}</td>
                  <td className="px-4 py-4"><AdminBadge variant={candidateStatusVariant[candidate.status]}>{translations(`candidateStatus_${candidate.status}`)}</AdminBadge></td>
                  <td className="px-4 py-4 text-[13px] text-gray-500">{formatDateShort(candidate.createdAt, locale)}</td>
                  <td className="px-4 py-4">
                    <AdminButton variant="icon" size="sm" onClick={() => setSelectedCandidate(candidate)}><EyeIcon /></AdminButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 text-sm text-gray-500">
            <span>{translations('paginationInfo', { total, current: currentPage, last: totalPages })}</span>
            <AdminPagination totalPages={totalPages} currentPage={currentPage} onPageChange={setPage} />
          </div>
        )}
      </div>

      {selectedCandidate && <HrCandidateDialog candidate={selectedCandidate} onClose={() => setSelectedCandidate(null)} />}
    </div>
  )
}

function SummaryCard({ title, value, icon, tone, loading }: { title: string; value: number; icon: ReactNode; tone: SummaryTone; loading?: boolean }) {
  return (
    <div className="rounded-[16px] border border-gray-200 bg-white p-5 shadow-[0_2px_12px_rgba(52,89,165,0.08)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[13px] font-semibold text-gray-400">{title}</p>
          {loading ? <div className="mt-4 h-8 w-16 animate-pulse rounded bg-gray-100" /> : <p className="mt-3 text-[32px] font-black leading-none text-gray-900">{value}</p>}
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-[14px] border ${summaryToneClasses[tone]}`}>{icon}</div>
      </div>
    </div>
  )
}

function TableHead({ children }: { children: ReactNode }) {
  return <th className="border-b-2 border-gray-200 px-4 py-3 text-start text-[12px] font-semibold uppercase tracking-wide text-gray-500">{children}</th>
}

function LoadingRow({ colSpan }: { colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-gray-400">
        <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-admin-primary border-t-transparent" />
      </td>
    </tr>
  )
}

function EmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-[13px] text-gray-400">{message}</td>
    </tr>
  )
}

function BriefcaseIcon({ size = 20 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      <path d="M2 13h20" />
    </svg>
  )
}

function UsersIcon({ size = 20 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function CheckListIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l2 2 4-4" />
      <path d="M21 12a9 9 0 1 1-3-6.7" />
    </svg>
  )
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2 3 14h8l-1 8 11-13h-8l1-7Z" />
    </svg>
  )
}
