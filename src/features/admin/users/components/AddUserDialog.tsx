'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { AdminDialog } from '@/components/ui/admin/AdminDialog'
import { AdminInput } from '@/components/ui/admin/AdminInput'
import { AdminSelect, type SelectOption } from '@/components/ui/admin/AdminSelect'
import { AdminButton } from '@/components/ui/admin/AdminButton'
import {
  getAutoConvertInvalidAttemptReason,
  normalizeEmail,
} from '@/lib/input-auto-convert'
import {
  collectAutoConvertInvalidIssues,
  formatAutoConvertIssueList,
} from '@/lib/auto-convert-feedback'
import { useAdminRoles } from '@/features/admin/roles/hooks/useAdminRoles'
import { PAGINATION } from '@/lib/constants/pagination'
import {
  useUserCreate,
  useUserUpdate,
  useUserChangeRole,
  type UserUpdatePayload,
} from '../hooks/useUserMutations'
import type { AdminUser } from '../hooks/useUsers'
import { userCreateSchema, userUpdateSchema } from '../schemas/user.schema'

type Props = {
  user?: AdminUser
  onClose: () => void
}

export function AddUserDialog({ user, onClose }: Props) {
  const usersTranslations = useTranslations('admin.usersPage.list')
  const validationTranslations = useTranslations('validation')
  const isEdit = !!user
  const autoConvertMessages = {
    numbersOnlyDual: validationTranslations('numbersOnlyDual'),
    emailEnglishOnlyDual: validationTranslations('emailEnglishOnlyDual'),
    emailInvalidFormatDual: validationTranslations('emailInvalidFormatDual'),
    urlEnglishOnlyDual: validationTranslations('urlEnglishOnlyDual'),
    urlInvalidFormatDual: validationTranslations('urlInvalidFormatDual'),
  }

  const { data: rolesResponse } = useAdminRoles({ limit: PAGINATION.SELECT_LIMIT })
  const create     = useUserCreate()
  const update     = useUserUpdate()
  const changeRole = useUserChangeRole()

  const [name,          setName]          = useState(user?.name  ?? '')
  const [email,         setEmail]         = useState(user?.email ?? '')
  const [password,      setPassword]      = useState('')
  const [showPassword,  setShowPassword]  = useState(false)
  const [role,     setRole]     = useState<SelectOption | null>(
    user ? { value: user.role, label: user.role } : null
  )
  const [error, setError] = useState('')
  const [emailFieldError, setEmailFieldError] = useState('')
  const [submitValidationErrors, setSubmitValidationErrors] = useState<string[]>([])

  const roleOptions: SelectOption[] = (rolesResponse?.data ?? []).map((role) => ({ value: role.name, label: role.name }))

  const isPending = create.isPending || update.isPending || changeRole.isPending

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setEmailFieldError('')
    setSubmitValidationErrors([])
    if (!role) { setError(usersTranslations('roleRequired')); return }

    const autoConvertIssues = collectAutoConvertInvalidIssues(e.currentTarget)
    const normalizedEmail = normalizeEmail(email)
    const emailInvalidReason = normalizedEmail
      ? getAutoConvertInvalidAttemptReason('email', email, normalizedEmail)
      : null
    setEmailFieldError(emailInvalidReason ? validationTranslations(emailInvalidReason) : '')

    const allReasons = Array.from(
      new Set([
        ...(emailInvalidReason ? [emailInvalidReason] : []),
        ...autoConvertIssues.reasons,
      ]),
    )
    if (allReasons.length > 0) {
      setSubmitValidationErrors(
        formatAutoConvertIssueList(allReasons, validationTranslations),
      )
      autoConvertIssues.firstInvalidField?.focus()
      return
    }

    try {
      if (isEdit && user) {
        const nameChanged  = name  !== user.name  || email !== user.email
        const roleChanged  = role.value !== user.role

        const draft: UserUpdatePayload = { name, email }
        if (password) draft.password = password
        const updateParsed = userUpdateSchema.safeParse(draft)
        if (!updateParsed.success) { setError(usersTranslations('submitError')); return }
        if (nameChanged || password) await update.mutateAsync({ id: user.id, payload: draft })
        if (roleChanged) await changeRole.mutateAsync({ id: user.id, role: role.value })
      } else {
        const createParsed = userCreateSchema.safeParse({ name, email, role: role.value, password })
        if (!createParsed.success) { setError(usersTranslations('submitError')); return }
        await create.mutateAsync({ name, email, role: role.value, password })
      }
      onClose()
    } catch {
      setError(usersTranslations('submitError'))
    }
  }

  return (
    <AdminDialog
      title={isEdit ? usersTranslations('editUser') : usersTranslations('addUser')}
      onClose={onClose}
      onSubmit={handleSubmit}
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <AdminButton type="button" variant="light" onClick={onClose}>
            {usersTranslations('cancel')}
          </AdminButton>
          <AdminButton type="submit" loading={isPending}>
            {isEdit ? usersTranslations('saveChanges') : usersTranslations('addConfirm')}
          </AdminButton>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <AdminInput
          label={usersTranslations('nameLabel')}
          required
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setSubmitValidationErrors([])
          }}
          placeholder={usersTranslations('namePlaceholder')}
        />
        <AdminInput
          label={usersTranslations('emailLabel')}
          type="email"
          autoConvertMessages={autoConvertMessages}
          error={emailFieldError || undefined}
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setEmailFieldError('')
            setSubmitValidationErrors([])
          }}
          placeholder={usersTranslations('emailPlaceholder')}
          dir="ltr"
        />
        <AdminInput
          label={usersTranslations('passwordLabel')}
          type={showPassword ? 'text' : 'password'}
          required={!isEdit}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            setSubmitValidationErrors([])
          }}
          placeholder={isEdit ? usersTranslations('passwordEditPlaceholder') : usersTranslations('passwordPlaceholder')}
          endIcon={
            showPassword ? (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )
          }
          onEndIconClick={() => setShowPassword((v) => !v)}
        />
        <AdminSelect
          label={usersTranslations('roleLabel')}
          required
          options={roleOptions}
          value={role}
          onChange={(value) => {
            setRole(value as SelectOption)
            setSubmitValidationErrors([])
          }}
          placeholder={usersTranslations('rolePlaceholder')}
        />
        {error && <p className="text-xs text-danger">{error}</p>}
        {submitValidationErrors.length > 0 && (
          <div className="rounded-[8px] border border-danger-bg-alt bg-danger-bg-faint px-3 py-2">
            <p className="text-[12px] font-semibold text-danger-red">
              {validationTranslations('checkFieldsBeforeSave')}
            </p>
            <ul className="mt-1 list-disc ps-5 text-[12px] text-danger-red space-y-0.5">
              {submitValidationErrors.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </AdminDialog>
  )
}
