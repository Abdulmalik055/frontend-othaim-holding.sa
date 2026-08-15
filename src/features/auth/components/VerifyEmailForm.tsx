'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { AdminOTPInput } from '@/components/ui/admin/AdminOTPInput'
import { AdminCountdownTimer } from '@/components/ui/admin/AdminCountdownTimer'
import { AdminButton } from '@/components/ui/admin/AdminButton'
import { AdminInput } from '@/components/ui/admin/AdminInput'
import { useAuth } from '../hooks/useAuth'
import { getSession } from '@/lib/auth-client'
import { apiClient } from '@/lib/api-client'
import { changePasswordSchema, type ChangePasswordFormData } from '../schemas/auth.schema'
import { resolvePreferredLanguageFromUser, setLanguagePreferenceCookie, type AppLanguage } from '@/lib/language-preference'
import type { AdminPermissionsResponse } from '@/types'

type Step = 'otp' | 'change-password' | 'success'

type Props = {
  locale: string
  email: string
}

const ConfirmIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const AccountIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

export function VerifyEmailForm({ locale, email }: Props) {
  const translations = useTranslations('auth')
  const router = useRouter()
  const { verifyEmail, sendVerificationOTP, getRedirectDestination } = useAuth()
  const fallbackLocale: AppLanguage = locale === 'en' ? 'en' : 'ar'

  const [step, setStep] = useState<Step>('otp')
  const [mustChange, setMustChange] = useState(false)
  const [destination, setDestination] = useState('')
  const [preferredLocale, setPreferredLocale] = useState<AppLanguage>(fallbackLocale)

  // OTP step state
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)
  const [resendKey, setResendKey] = useState(0)
  const [canResend, setCanResend] = useState(false)

  // Change password step state
  const [changeServerError, setChangeServerError] = useState<string | null>(null)
  const changeForm = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  })

  // ── Step 1: OTP ──────────────────────────────────────────────────────────────

  async function handleOtpSubmit() {
    if (otp.length < 4) { setOtpError(true); return }
    setOtpError(false)
    setOtpLoading(true)
    try {
      await verifyEmail(email, otp)
      const sessionResult = await getSession()
      const sessionUser = sessionResult.data?.user
      const resolvedLocale = resolvePreferredLanguageFromUser(sessionUser, fallbackLocale)
      setLanguagePreferenceCookie(resolvedLocale)
      setPreferredLocale(resolvedLocale)
      const isMustChange = !!(sessionUser as Record<string, unknown> | undefined)?.mustChangePassword
      setMustChange(isMustChange)
      if (isMustChange) {
        setStep('change-password')
      } else {
        try {
          const permissionResult = await apiClient.get<AdminPermissionsResponse>('/api/admin/auth/permissions')
          const destination = permissionResult.data.isAdmin
            ? getRedirectDestination(resolvedLocale)
            : `/${resolvedLocale}/auth/login`
          setDestination(destination)
        } catch {
          setDestination(`/${resolvedLocale}/admin/dashboard`)
        }
        setStep('success')
      }
    } catch {
      setOtpError(true)
      setOtp('')
    } finally {
      setOtpLoading(false)
    }
  }

  async function handleResend() {
    setCanResend(false)
    setResendKey((prev) => prev + 1)
    setOtp('')
    setOtpError(false)
    try {
      await sendVerificationOTP(email)
    } catch {
      // silently fail
    }
  }

  // ── Step 2: Change password ───────────────────────────────────────────────────

  async function handleChangePassword(data: ChangePasswordFormData) {
    setChangeServerError(null)
    try {
      await apiClient.post('/api/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.password,
        revokeOtherSessions: true,
      })
      await apiClient.post('/api/auth/acknowledge-password-change')
      setLanguagePreferenceCookie(preferredLocale)
      setDestination(`/${preferredLocale}/auth/login`)
      setStep('success')
    } catch (err) {
      setChangeServerError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  // ── Step 3: Success ───────────────────────────────────────────────────────────

  if (step === 'success') {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="text-[52px]">✅</div>
        <div className="text-[20px] font-black text-ink">
          {mustChange ? translations('verifyAndChangeSuccessTitle') : translations('verifySuccessTitle')}
        </div>
        <p className="text-[13px] text-accent leading-relaxed max-w-[280px]">
          {mustChange ? translations('verifyAndChangeSuccessSub') : translations('verifySuccessSub')}
        </p>
        <p className="text-[13px] text-accent">
          {translations('redirectingIn')}{' '}
          <AdminCountdownTimer
            seconds={3}
            onComplete={() => router.push(destination)}
            className="text-admin-primary"
          />{' '}
          {translations('seconds')}
        </p>
        <AdminButton fullWidth startIcon={<AccountIcon />} onClick={() => router.push(destination)}>
          {mustChange ? translations('verifyAndChangeSuccessBtn') : translations('goToAccount')}
        </AdminButton>
      </div>
    )
  }

  // ── Step 2: Change password form ──────────────────────────────────────────────

  if (step === 'change-password') {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex flex-col items-center gap-2 pb-1">
          <div className="w-12 h-12 rounded-[14px] flex items-center justify-center bg-admin-primary">
            <LockIcon />
          </div>
          <div className="text-center">
            <div className="text-[20px] font-black text-ink">{translations('changePasswordTitle')}</div>
            <div className="text-[13px] text-accent mt-0.5">{translations('changePasswordSub')}</div>
          </div>
        </div>

        <form onSubmit={changeForm.handleSubmit(handleChangePassword)} className="flex flex-col gap-5">
          <AdminInput
            type="password"
            label={translations('currentPassword')}
            placeholder={translations('passwordPlaceholder')}
            startIcon={<LockIcon />}
            error={changeForm.formState.errors.currentPassword?.message}
            {...changeForm.register('currentPassword')}
          />
          <AdminInput
            type="password"
            label={translations('newPassword')}
            placeholder={translations('passwordMinPlaceholder')}
            startIcon={<LockIcon />}
            error={changeForm.formState.errors.password?.message}
            {...changeForm.register('password')}
          />
          <AdminInput
            type="password"
            label={translations('confirmPassword')}
            placeholder={translations('passwordPlaceholder')}
            startIcon={<LockIcon />}
            error={changeForm.formState.errors.confirmPassword?.message}
            {...changeForm.register('confirmPassword')}
          />

          {changeServerError && (
            <p className="text-[13px] text-danger text-center -mt-2">{changeServerError}</p>
          )}

          <AdminButton type="submit" fullWidth loading={changeForm.formState.isSubmitting} startIcon={<ConfirmIcon />}>
            {translations('resetPasswordBtn')}
          </AdminButton>
        </form>
      </div>
    )
  }

  // ── Step 1: OTP form ──────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      {/* Icon */}
      <div className="flex justify-center">
        <div className="relative">
          <div className="w-16 h-16 rounded-[18px] bg-admin-primary flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8">
              <rect x="2" y="4" width="20" height="16" rx="2.5" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>
          <div className="absolute -bottom-1 -end-1 w-6 h-6 rounded-full bg-success flex items-center justify-center">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#fff" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="text-center">
        <div className="text-[20px] font-black text-ink">{translations('verifyTitle')}</div>
        <div className="text-[13px] text-accent mt-1">{translations('verifySub')}</div>
        <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-surface rounded-[8px] text-[13px] text-admin-primary font-semibold">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
          {email}
        </div>
      </div>

      {/* OTP */}
      <div className="flex flex-col gap-2">
        <span className="text-center text-[13px] text-accent">{translations('enterOtp')}</span>
        <AdminOTPInput length={4} value={otp} onChange={setOtp} error={otpError} disabled={otpLoading} />
        {otpError && (
          <div className="flex items-center justify-center gap-1.5 text-[13px] text-danger">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {translations('otpError')}
          </div>
        )}
      </div>

      {/* Submit */}
      <AdminButton fullWidth loading={otpLoading} startIcon={<ConfirmIcon />} onClick={handleOtpSubmit}>
        {translations('confirmAndCreate')}
      </AdminButton>

      {/* Resend row */}
      <div className="flex items-center justify-center gap-2 text-[13px] text-accent">
        <span>{translations('noCodeSent')}</span>
        <button
          type="button"
          disabled={!canResend}
          onClick={handleResend}
          className="font-bold text-admin-primary hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {translations('resendCode')}
        </button>
        {!canResend && (
          <span className="text-accent">
            (<AdminCountdownTimer
              seconds={60}
              restartTrigger={resendKey}
              onComplete={() => setCanResend(true)}
            />)
          </span>
        )}
      </div>

      {/* Edit email */}
      <div className="text-center -mt-2">
        <a
          href={`/${locale}/auth/login`}
          className="text-[13px] text-accent hover:text-admin-primary hover:underline"
        >
          ← {translations('editEmail')}
        </a>
      </div>
    </div>
  )
}
