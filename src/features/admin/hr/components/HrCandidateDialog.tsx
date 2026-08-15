'use client'

import { useMemo } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { AdminBadge, type BadgeVariant } from '@/components/ui/admin/AdminBadge'
import { AdminButton } from '@/components/ui/admin/AdminButton'
import { AdminDialog } from '@/components/ui/admin/AdminDialog'
import { DownloadIcon } from '@/components/ui/shared/Icons'
import { formatDateShort } from '@/lib/dates'
import { useHrCandidate, type HrCandidate, type HrCandidateStatus } from '../hooks/useHrCandidates'
import { useHrCandidateStatusUpdate } from '../hooks/useHrMutations'

type Props = {
  candidate: HrCandidate
  onClose: () => void
}

const statusVariant: Record<HrCandidateStatus, BadgeVariant> = {
  new: 'unread',
  under_review: 'pending',
  accepted: 'active',
  rejected: 'rejected',
}

export function HrCandidateDialog({ candidate, onClose }: Props) {
  const locale = useLocale() as 'ar' | 'en'
  const translations = useTranslations('admin.hrPage')
  const { data, isLoading } = useHrCandidate(candidate.id)
  const updateStatus = useHrCandidateStatusUpdate()
  const displayCandidate = data ?? candidate
  const cvUrl = displayCandidate.cvFile ? `/uploads/careers/cv/${displayCandidate.cvFile}` : null
  const jobTitle = locale === 'ar' ? displayCandidate.job?.titleAr : displayCandidate.job?.titleEn
  const jobCity = locale === 'ar' ? displayCandidate.job?.city?.nameAr : displayCandidate.job?.city?.nameEn
  const candidateCity = locale === 'ar' ? displayCandidate.city?.nameAr : displayCandidate.city?.nameEn
  const nationality = locale === 'ar' ? displayCandidate.nationality?.nameAr : displayCandidate.nationality?.nameEn

  const customAnswerRows = useMemo(() => {
    const answers = displayCandidate.customAnswers ?? {}
    const fields = displayCandidate.job?.customFields ?? []
    const labels = new Map(fields.map((field) => [field.key, locale === 'ar' ? field.labelAr : field.labelEn]))

    return Object.entries(answers).map(([key, value]) => ({
      key,
      label: labels.get(key) ?? key,
      value: typeof value === 'boolean' ? (value ? translations('yes') : translations('no')) : String(value ?? '-'),
    }))
  }, [displayCandidate.customAnswers, displayCandidate.job?.customFields, locale, translations])

  async function changeStatus(status: HrCandidateStatus) {
    await updateStatus.mutateAsync({ id: displayCandidate.id, status })
  }

  return (
    <AdminDialog
      title={translations('candidateDetails')}
      onClose={onClose}
      size="lg"
      footer={
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <p className="shrink-0 text-[11px] font-bold text-gray-400">{translations('applicationStatus')}</p>
            <div className="flex flex-wrap items-center gap-2">
              {(['new', 'under_review', 'accepted', 'rejected'] as HrCandidateStatus[]).map((status) => (
                <button
                  key={status}
                  type="button"
                  disabled={displayCandidate.status === status || updateStatus.isPending}
                  onClick={() => changeStatus(status)}
                  className={`rounded-full border px-3 py-1.5 text-[12px] font-bold transition-colors disabled:cursor-default disabled:opacity-70 ${
                    displayCandidate.status === status
                      ? 'border-admin-primary bg-admin-primary text-white'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-admin-primary hover:text-admin-primary'
                  }`}
                >
                  {translations(`candidateStatus_${status}`)}
                </button>
              ))}
            </div>
          </div>
          <AdminButton type="button" variant="light" onClick={onClose}>{translations('close')}</AdminButton>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="rounded-[18px] border border-gray-200 bg-white p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-[19px] font-black text-gray-900">{displayCandidate.fullName}</p>
              <p className="mt-2 text-[13px] font-medium text-gray-400" dir="ltr">{displayCandidate.email}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <AdminBadge variant={statusVariant[displayCandidate.status]}>{translations(`candidateStatus_${displayCandidate.status}`)}</AdminBadge>
              {cvUrl && (
                <a
                  href={cvUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-fit items-center gap-2 rounded-[9px] border border-blue-100 bg-admin-primary-bg px-3 py-2 text-[12px] font-bold text-admin-primary hover:bg-white"
                >
                  <DownloadIcon />
                  {translations('downloadCv')}
                </a>
              )}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 border-t border-gray-100 pt-4 md:grid-cols-3">
            <InlineFact label={translations('job')} value={jobTitle} loading={isLoading} />
            <InlineFact label={translations('city')} value={jobCity} loading={isLoading} />
            <InlineFact label={translations('appliedAt')} value={formatDateShort(displayCandidate.createdAt, locale)} />
          </div>
        </div>

        <div className="rounded-[14px] border border-gray-200 bg-white p-4">
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
            <InfoRow label={translations('nationality')} value={nationality} />
            <InfoRow label={translations('candidateCity')} value={candidateCity} />
            <InfoRow label={translations('phoneNumber')} value={displayCandidate.phoneNumber} dir="ltr" />
            <InfoRow label={translations('gender')} value={displayCandidate.gender ? translations(`gender_${displayCandidate.gender}` as Parameters<typeof translations>[0]) : '-'} />
          </div>
        </div>

        <div className="rounded-[14px] border border-gray-200 p-4">
          <p className="mb-2 text-[12px] font-bold text-gray-400">{translations('coverLetter')}</p>
          <p className="min-h-12 whitespace-pre-wrap text-[13px] leading-6 text-gray-700">{displayCandidate.coverLetter || '-'}</p>
        </div>

        <div className="rounded-[14px] border border-gray-200 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-[13px] font-black text-gray-900">{translations('customAnswers')}</p>
          </div>

          {customAnswerRows.length === 0 ? (
            <p className="rounded-[10px] bg-gray-50 px-4 py-4 text-center text-[13px] text-gray-400">{translations('noCustomAnswers')}</p>
          ) : (
            <div className="flex flex-col gap-3">
              {customAnswerRows.map((answer) => (
                <div key={answer.key} className="rounded-[12px] border border-gray-100 bg-gray-50 px-4 py-3">
                  <p className="whitespace-pre-wrap break-words text-[12px] font-bold leading-6 text-gray-400">{answer.label}</p>
                  <p className="mt-2 whitespace-pre-wrap break-words text-[14px] font-black leading-7 text-gray-900">{answer.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminDialog>
  )
}

function InlineFact({ label, value, loading }: { label: string; value?: string | number | null; loading?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-bold text-gray-400">{label}</p>
      {loading ? (
        <div className="mt-2 h-4 w-20 animate-pulse rounded bg-gray-100" />
      ) : (
        <p className="mt-1 truncate text-[14px] font-black text-gray-900">{value || '-'}</p>
      )}
    </div>
  )
}

function InfoRow({ label, value, dir }: { label: string; value?: string | number | null; dir?: 'rtl' | 'ltr' }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-bold text-gray-400">{label}</p>
      <p className="mt-1 text-[14px] font-semibold text-gray-800" dir={dir}>{value || '-'}</p>
    </div>
  )
}
