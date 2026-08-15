'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { AdminInput } from '@/components/ui/admin/AdminInput'
import { AdminButton } from '@/components/ui/admin/AdminButton'
import { AdminCountdownTimer } from '@/components/ui/admin/AdminCountdownTimer'
import { changePasswordSchema, type ChangePasswordFormData } from '../schemas/auth.schema'
import { useAuth } from '../hooks/useAuth'
import { apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/useAuthStore'
import { resolvePreferredLanguageFromUser, setLanguagePreferenceCookie, type AppLanguage } from '@/lib/language-preference'

type Props = {
  locale: string
  onBack: () => void
}

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

const BackIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
)

const ConfirmIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

export function ChangePasswordForm({ locale, onBack }: Props) {
  const translations = useTranslations('auth')
  const router = useRouter()
  const { getRedirectDestination } = useAuth()
  const user = useAuthStore((state) => state.user)
  const fallbackLocale: AppLanguage = locale === 'en' ? 'en' : 'ar'
  const preferredLocale = resolvePreferredLanguageFromUser(user, fallbackLocale)

  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  })

  async function onSubmit(data: ChangePasswordFormData) {
    setServerError(null)
    try {
      await apiClient.post('/api/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.password,
        revokeOtherSessions: true,
      })
      await apiClient.post('/api/auth/acknowledge-password-change')
      setSuccess(true)
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="text-[52px]">✅</div>
        <div className="text-[20px] font-black text-ink">{translations('resetPasswordSuccessTitle')}</div>
        <p className="text-[13px] text-accent leading-relaxed max-w-[280px]">
          {translations('resetPasswordSuccessSub')}
        </p>
        <p className="text-[13px] text-accent">
          {translations('redirectingIn')}{' '}
          <AdminCountdownTimer
            seconds={3}
            onComplete={() => {
              setLanguagePreferenceCookie(preferredLocale)
              router.replace(getRedirectDestination(preferredLocale))
            }}
            className="text-admin-primary"
          />{' '}
          {translations('seconds')}
        </p>
        <AdminButton
          fullWidth
          startIcon={<ConfirmIcon />}
          onClick={() => {
            setLanguagePreferenceCookie(preferredLocale)
            router.replace(getRedirectDestination(preferredLocale))
          }}
        >
          {translations('goToDashboard')}
        </AdminButton>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-[13px] text-admin-primary font-semibold hover:underline w-fit"
      >
        <BackIcon />
        {translations('backToLogin')}
      </button>

      <div className="flex flex-col items-center gap-2 pb-1">
        <div className="w-12 h-12 rounded-[14px] flex items-center justify-center bg-admin-primary">
          <LockIcon />
        </div>
        <div className="text-center">
          <div className="text-[20px] font-black text-ink">{translations('changePasswordTitle')}</div>
          <div className="text-[13px] text-accent mt-0.5">{translations('changePasswordSub')}</div>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <AdminInput
          type="password"
          label={translations('currentPassword')}
          placeholder={translations('passwordPlaceholder')}
          startIcon={<LockIcon />}
          error={form.formState.errors.currentPassword?.message}
          {...form.register('currentPassword')}
        />

        <AdminInput
          type="password"
          label={translations('newPassword')}
          placeholder={translations('passwordMinPlaceholder')}
          startIcon={<LockIcon />}
          error={form.formState.errors.password?.message}
          {...form.register('password')}
        />

        <AdminInput
          type="password"
          label={translations('confirmPassword')}
          placeholder={translations('passwordPlaceholder')}
          startIcon={<LockIcon />}
          error={form.formState.errors.confirmPassword?.message}
          {...form.register('confirmPassword')}
        />

        {serverError && (
          <p className="text-[13px] text-danger text-center -mt-2">{serverError}</p>
        )}

        <AdminButton type="submit" fullWidth loading={form.formState.isSubmitting} startIcon={<ConfirmIcon />}>
          {translations('resetPasswordBtn')}
        </AdminButton>
      </form>
    </div>
  )
}
