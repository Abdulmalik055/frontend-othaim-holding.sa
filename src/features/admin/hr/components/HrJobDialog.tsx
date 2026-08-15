'use client'

import { useState, type FormEvent } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { AdminBadge, type BadgeVariant } from '@/components/ui/admin/AdminBadge'
import { AdminButton } from '@/components/ui/admin/AdminButton'
import { AdminDialog } from '@/components/ui/admin/AdminDialog'
import { AdminInput } from '@/components/ui/admin/AdminInput'
import { AdminSelect, type SelectOption } from '@/components/ui/admin/AdminSelect'
import { AdminTextArea } from '@/components/ui/admin/AdminTextArea'
import { EditIcon, PlusIcon, TrashIcon, XIcon } from '@/components/ui/shared/Icons'
import { ApiError } from '@/lib/api-client'
import { formatDateShort } from '@/lib/dates'
import { useCareerCities } from '../hooks/useCareerCities'
import type { HrCustomField, HrCustomFieldType, HrJob, HrJobStatus } from '../hooks/useHrJobs'
import { useHrJobCreate, useHrJobDelete, useHrJobUpdate, type HrJobPayload } from '../hooks/useHrMutations'

type DialogMode = 'create' | 'view' | 'edit'
type ClosingDateMode = 'none' | 'date'

type Props = {
  mode: DialogMode
  job?: HrJob
  onClose: () => void
}

type DraftCustomField = Omit<HrCustomField, 'key'> & { localId: string }

const statusVariant: Record<HrJobStatus, BadgeVariant> = {
  draft: 'pending',
  published: 'active',
  closed: 'inactive',
}

function toDateInput(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

function toClosingDatePayload(value: string) {
  return value ? `${value}T23:59:59.000Z` : null
}

function toDraftField(field?: Partial<HrCustomField>): DraftCustomField {
  return {
    localId: crypto.randomUUID(),
    type: field?.type ?? 'text',
    labelAr: field?.labelAr ?? '',
    labelEn: field?.labelEn ?? '',
    required: field?.required ?? false,
  }
}

export function HrJobDialog({ mode: initialMode, job, onClose }: Props) {
  const locale = useLocale() as 'ar' | 'en'
  const translations = useTranslations('admin.hrPage')
  const validationTranslations = useTranslations('validation')
  const autoConvertMessages = {
    textArabicOnlyDual: validationTranslations('textArabicOnlyDual'),
    textEnglishOnlyDual: validationTranslations('textEnglishOnlyDual'),
  }
  const [mode, setMode] = useState<DialogMode>(initialMode)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState('')

  const [titleAr, setTitleAr] = useState(job?.titleAr ?? '')
  const [titleEn, setTitleEn] = useState(job?.titleEn ?? '')
  const [descriptionAr, setDescriptionAr] = useState(job?.descriptionAr ?? '')
  const [descriptionEn, setDescriptionEn] = useState(job?.descriptionEn ?? '')
  const [selectedCityId, setSelectedCityId] = useState(job?.cityId ?? job?.city?.id ?? '')
  const [status, setStatus] = useState<HrJobStatus>(job?.status ?? 'draft')
  const [closingDateMode, setClosingDateMode] = useState<ClosingDateMode>(job?.closingDate ? 'date' : 'none')
  const [closingDate, setClosingDate] = useState(toDateInput(job?.closingDate))
  const [customFields, setCustomFields] = useState<DraftCustomField[]>(() => (job?.customFields ?? []).map(toDraftField))

  const { data: cities = [], isLoading: citiesLoading } = useCareerCities()
  const create = useHrJobCreate()
  const update = useHrJobUpdate()
  const remove = useHrJobDelete()
  const isPending = create.isPending || update.isPending || remove.isPending

  const statusOptions: SelectOption[] = [
    { value: 'draft', label: translations('jobStatus_draft') },
    { value: 'published', label: translations('jobStatus_published') },
    { value: 'closed', label: translations('jobStatus_closed') },
  ]
  const closingDateOptions: SelectOption[] = [
    { value: 'none', label: translations('closingDateMode_none') },
    { value: 'date', label: translations('closingDateMode_date') },
  ]

  const fieldTypeOptions: SelectOption[] = [
    { value: 'text', label: translations('fieldTypeText') },
    { value: 'boolean', label: translations('fieldTypeBoolean') },
  ]
  const cityOptions: SelectOption[] = cities.map((city) => ({
    value: city.id,
    label: locale === 'ar' ? city.nameAr : city.nameEn,
  }))
  const selectedCity = cities.find((city) => city.id === selectedCityId)
    ?? (job?.city?.id === selectedCityId ? job.city : null)
    ?? null

  function updateField(id: string, patch: Partial<DraftCustomField>) {
    setCustomFields((fields) => fields.map((field) => field.localId === id ? { ...field, ...patch } : field))
  }

  function validatePayload(): HrJobPayload | null {
    const trimmedFields = customFields.map((field) => ({
      type: field.type,
      labelAr: field.labelAr.trim(),
      labelEn: field.labelEn.trim(),
      required: field.required,
    }))

    if (!titleAr.trim() || !titleEn.trim() || !descriptionAr.trim() || !descriptionEn.trim() || !selectedCity) {
      setError(translations('requiredFields'))
      return null
    }

    if (closingDateMode === 'date' && !closingDate) {
      setError(translations('closingDateRequired'))
      return null
    }

    const invalidField = trimmedFields.find((field) => !field.labelAr || !field.labelEn)
    if (invalidField) {
      setError(translations('customFieldInvalid'))
      return null
    }

    return {
      titleAr: titleAr.trim(),
      titleEn: titleEn.trim(),
      descriptionAr: descriptionAr.trim(),
      descriptionEn: descriptionEn.trim(),
      cityId: selectedCity.id,
      status,
      closingDate: closingDateMode === 'date' ? toClosingDatePayload(closingDate) : null,
      customFields: trimmedFields,
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const payload = validatePayload()
    if (!payload) return

    try {
      if (mode === 'create') {
        await create.mutateAsync(payload)
      } else if (job) {
        await update.mutateAsync({ id: job.id, payload })
      }
      onClose()
    } catch (err) {
      if (err instanceof ApiError && err.status === 400 && err.message.toLowerCase().includes('duplicate')) {
        setError(translations('customFieldDuplicate'))
        return
      }
      setError(translations('submitError'))
    }
  }

  async function handleDelete() {
    if (!job) return
    setError('')
    try {
      await remove.mutateAsync(job.id)
      onClose()
    } catch {
      setError(translations('submitError'))
    }
  }

  const title = mode === 'create'
    ? translations('addJob')
    : mode === 'edit'
      ? translations('editJob')
      : translations('jobDetails')

  function renderView() {
    if (!job) return null
    return (
      <div className="flex flex-col gap-5">
        <div className="rounded-[16px] border border-gray-200 bg-gray-50 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[19px] font-black text-gray-900">{job.titleAr}</p>
              <p className="mt-1 text-[13px] font-medium text-gray-400" dir="ltr">{job.titleEn}</p>
            </div>
            <AdminBadge variant={statusVariant[job.status]}>{translations(`jobStatus_${job.status}`)}</AdminBadge>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <InfoTile label={translations('city')} value={locale === 'ar' ? job.city?.nameAr : job.city?.nameEn} />
            <InfoTile label={translations('candidatesCount')} value={job._count?.candidates ?? 0} />
            <InfoTile label={translations('closingDate')} value={job.closingDate ? formatDateShort(job.closingDate, locale) : translations('noClosingDate')} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-[14px] border border-gray-200 p-4">
            <p className="mb-2 text-[12px] font-bold text-gray-400">{translations('descriptionAr')}</p>
            <p className="whitespace-pre-wrap text-[13px] leading-6 text-gray-700">{job.descriptionAr || '-'}</p>
          </div>
          <div className="rounded-[14px] border border-gray-200 p-4" dir="ltr">
            <p className="mb-2 text-[12px] font-bold text-gray-400">{translations('descriptionEn')}</p>
            <p className="whitespace-pre-wrap text-[13px] leading-6 text-gray-700">{job.descriptionEn || '-'}</p>
          </div>
        </div>

        <div className="rounded-[14px] border border-gray-200 p-4">
          <p className="mb-3 text-[13px] font-black text-gray-900">{translations('customFields')}</p>
          {(job.customFields ?? []).length === 0 ? (
            <p className="text-[13px] text-gray-400">{translations('noCustomFields')}</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {(job.customFields ?? []).map((field) => (
                <div key={field.key} className="rounded-[12px] border border-gray-100 bg-gray-50 px-3 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-bold text-gray-800">{locale === 'ar' ? field.labelAr : field.labelEn}</span>
                    <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-gray-500">{field.type}</span>
                  </div>
                  {field.required && <p className="mt-2 text-[11px] font-bold text-danger-red">{translations('required')}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  function renderForm() {
    return (
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <AdminInput label={translations('titleAr')} required textLanguage="arabic" autoConvertMessages={autoConvertMessages} value={titleAr} onChange={(event) => setTitleAr(event.target.value)} />
          <AdminInput label={translations('titleEn')} required dir="ltr" textLanguage="english" autoConvertMessages={autoConvertMessages} value={titleEn} onChange={(event) => setTitleEn(event.target.value)} />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <AdminSelect
            label={translations('city')}
            required
            options={cityOptions}
            value={selectedCity ? { value: selectedCity.id, label: locale === 'ar' ? selectedCity.nameAr : selectedCity.nameEn } : null}
            onChange={(option) => setSelectedCityId((option as SelectOption | null)?.value ?? '')}
            placeholder={translations('cityPlaceholder')}
            isLoading={citiesLoading}
            isSearchable
            isClearable={false}
          />
          <AdminSelect
            label={translations('status')}
            required
            options={statusOptions}
            value={statusOptions.find((option) => option.value === status) ?? null}
            onChange={(option) => setStatus(((option as SelectOption | null)?.value ?? 'draft') as HrJobStatus)}
            isSearchable={false}
            isClearable={false}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <AdminSelect
            label={translations('closingDateMode')}
            options={closingDateOptions}
            value={closingDateOptions.find((option) => option.value === closingDateMode) ?? null}
            onChange={(option) => {
              const value = ((option as SelectOption | null)?.value ?? 'none') as ClosingDateMode
              setClosingDateMode(value)
              if (value === 'none') setClosingDate('')
            }}
            isSearchable={false}
            isClearable={false}
          />
          {closingDateMode === 'date' && (
            <AdminInput label={translations('closingDate')} required type="date" autoConvertMode="none" value={closingDate} onChange={(event) => setClosingDate(event.target.value)} />
          )}
        </div>

        <div className="flex flex-col gap-4">
          <AdminTextArea label={translations('descriptionAr')} required textLanguage="arabic" autoConvertMessages={autoConvertMessages} value={descriptionAr} onChange={(event) => setDescriptionAr(event.target.value)} />
          <AdminTextArea label={translations('descriptionEn')} required dir="ltr" textLanguage="english" autoConvertMessages={autoConvertMessages} value={descriptionEn} onChange={(event) => setDescriptionEn(event.target.value)} />
        </div>

        <div className="rounded-[14px] border border-gray-200 p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[13px] font-black text-gray-900">{translations('customFields')}</p>
              <p className="mt-1 text-[12px] text-gray-400">{translations('customFieldsHint')}</p>
            </div>
            <AdminButton type="button" variant="light" size="sm" onClick={() => setCustomFields((fields) => [...fields, toDraftField()])}>
              <PlusIcon />
              {translations('addCustomField')}
            </AdminButton>
          </div>

          <div className="flex flex-col gap-3">
            {customFields.length === 0 && <p className="rounded-[10px] bg-gray-50 px-4 py-4 text-center text-[13px] text-gray-400">{translations('noCustomFields')}</p>}
            {customFields.map((field, index) => (
              <div key={field.localId} className="rounded-[12px] border border-gray-100 bg-gray-50 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-[12px] font-bold text-gray-500">{translations('customField')} {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => setCustomFields((fields) => fields.filter((item) => item.localId !== field.localId))}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] border border-danger-bg-alt bg-white text-danger-red transition-colors hover:bg-danger-bg-faint"
                  >
                    <XIcon />
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <AdminInput label={translations('fieldLabelAr')} required textLanguage="arabic" autoConvertMessages={autoConvertMessages} value={field.labelAr} onChange={(event) => updateField(field.localId, { labelAr: event.target.value })} />
                  <AdminInput label={translations('fieldLabelEn')} required dir="ltr" textLanguage="english" autoConvertMessages={autoConvertMessages} value={field.labelEn} onChange={(event) => updateField(field.localId, { labelEn: event.target.value })} />
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <AdminSelect
                    label={translations('fieldType')}
                    options={fieldTypeOptions}
                    value={fieldTypeOptions.find((option) => option.value === field.type) ?? null}
                    onChange={(option) => updateField(field.localId, { type: ((option as SelectOption | null)?.value ?? 'text') as HrCustomFieldType })}
                    isSearchable={false}
                    isClearable={false}
                  />
                  <label className="flex min-h-[45px] w-full cursor-pointer items-center gap-2 rounded-[9px] border border-line-mid bg-white px-4 text-[13px] font-bold text-gray-600 md:mt-[25px]">
                    <input type="checkbox" checked={field.required} onChange={(event) => updateField(field.localId, { required: event.target.checked })} className="h-4 w-4 accent-admin-primary" />
                    {translations('required')}
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-[12px] font-semibold text-danger-red">{error}</p>}
      </div>
    )
  }

  const footer = mode === 'view' ? (
    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        {!confirmDelete ? (
          <AdminButton type="button" variant="light" className="!text-danger-red" onClick={() => setConfirmDelete(true)}>
            <TrashIcon />
            {translations('deleteJob')}
          </AdminButton>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-[12px] font-semibold text-danger-red">{translations('deleteJobWarning')}</p>
            <div className="flex gap-2">
              <AdminButton type="button" variant="primary" size="sm" className="!bg-danger-red hover:!bg-danger-deep" loading={remove.isPending} onClick={handleDelete}>
                {translations('confirmDelete')}
              </AdminButton>
              <AdminButton type="button" variant="light" size="sm" onClick={() => setConfirmDelete(false)}>
                {translations('cancel')}
              </AdminButton>
            </div>
            {error && <p className="text-[12px] text-danger-red">{error}</p>}
          </div>
        )}
      </div>
      <div className="flex items-center justify-end gap-3">
        <AdminButton type="button" variant="light" onClick={onClose}>{translations('close')}</AdminButton>
        <AdminButton type="button" onClick={() => { setMode('edit'); setConfirmDelete(false); setError('') }}>
          <EditIcon />
          {translations('editJob')}
        </AdminButton>
      </div>
    </div>
  ) : (
    <div className="flex w-full items-center justify-end gap-3">
      <AdminButton type="button" variant="light" disabled={isPending} onClick={mode === 'edit' && job ? () => { setMode('view'); setError('') } : onClose}>
        {translations('cancel')}
      </AdminButton>
      <AdminButton type="submit" loading={isPending}>
        {mode === 'create' ? translations('createJob') : translations('saveChanges')}
      </AdminButton>
    </div>
  )

  return (
    <AdminDialog title={title} onClose={onClose} onSubmit={mode === 'view' ? undefined : handleSubmit} size="lg" footer={footer}>
      {mode === 'view' ? renderView() : renderForm()}
    </AdminDialog>
  )
}

function InfoTile({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="rounded-[12px] border border-gray-100 bg-white px-3 py-3">
      <p className="text-[11px] font-bold text-gray-400">{label}</p>
      <p className="mt-1 text-[14px] font-black text-gray-900">{value || '-'}</p>
    </div>
  )
}
