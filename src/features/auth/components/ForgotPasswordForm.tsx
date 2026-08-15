'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { AdminInput } from '@/components/ui/admin/AdminInput'
import { AdminButton } from '@/components/ui/admin/AdminButton'
import { AdminOTPInput } from '@/components/ui/admin/AdminOTPInput'
import { AdminCountdownTimer } from '@/components/ui/admin/AdminCountdownTimer'
import { forgotPasswordSchema, resetPasswordSchema, type ForgotPasswordFormData, type ResetPasswordFormData } from '../schemas/auth.schema'
import { useAuth } from '../hooks/useAuth'

type Props = {
  onBack: () => void
}

type Step = 'email' | 'otp' | 'success'

const EmailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
)

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

const SendIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M22 2 11 13" />
    <path d="M22 2 15 22 11 13 2 9l20-7z" />
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

export function ForgotPasswordForm({ onBack }: Props) {
  const translations = useTranslations('auth')
  const commonValidationT = useTranslations('validation')
  const { sendResetPasswordOTP, resetPasswordWithOTP } = useAuth()

  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState(false)
  const [resendKey, setResendKey] = useState(0)
  const [canResend, setCanResend] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const autoConvertMessages = {
    emailEnglishOnlyDual: commonValidationT('emailEnglishOnlyDual'),
    emailInvalidFormatDual: commonValidationT('emailInvalidFormatDual'),
  }

  const emailForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const passwordForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  async function onEmailSubmit(data: ForgotPasswordFormData, event?: React.BaseSyntheticEvent) {
    const formElement = event?.currentTarget as HTMLFormElement | undefined
    const autoInvalidInput = formElement?.querySelector<HTMLInputElement>('[data-auto-convert-invalid="true"]')
    if (autoInvalidInput) {
      const reason = autoInvalidInput.dataset.autoConvertInvalidReason
      if (reason === 'emailInvalidFormatDual') {
        setServerError(commonValidationT('emailInvalidFormatDual'))
      } else {
        setServerError(commonValidationT('emailEnglishOnlyDual'))
      }
      return
    }

    setServerError(null)
    try {
      await sendResetPasswordOTP(data.email)
      setEmail(data.email)
      setStep('otp')
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  async function onOtpSubmit(data: ResetPasswordFormData) {
    if (otp.length < 4) { setOtpError(true); return }
    setOtpError(false)
    setServerError(null)
    try {
      await resetPasswordWithOTP(email, otp, data.password)
      setStep('success')
    } catch (err) {
      setOtpError(true)
      setOtp('')
      setServerError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  async function handleResend() {
    setCanResend(false)
    setResendKey((prev) => prev + 1)
    setOtp('')
    setOtpError(false)
    try {
      await sendResetPasswordOTP(email)
    } catch {
      // silently fail
    }
  }

  if (step === 'success') {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="text-[52px]">✅</div>
        <div className="text-[20px] font-black text-ink">{translations('resetPasswordSuccessTitle')}</div>
        <p className="text-[13px] text-accent leading-relaxed max-w-[280px]">
          {translations('resetPasswordSuccessSub')}
        </p>
        <p className="text-[13px] text-accent">
          {translations('redirectingIn')}{' '}
          <AdminCountdownTimer seconds={3} onComplete={onBack} className="text-admin-primary" />{' '}
          {translations('seconds')}
        </p>
        <AdminButton fullWidth startIcon={<BackIcon />} onClick={onBack}>
          {translations('backToLogin')}
        </AdminButton>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Back button */}
      <button
        type="button"
        onClick={step === 'otp' ? () => setStep('email') : onBack}
        className="flex items-center gap-2 text-[13px] text-admin-primary font-semibold hover:underline w-fit"
      >
        <BackIcon />
        {translations('backToLogin')}
      </button>

      {/* Brand */}
      <div className="flex flex-col items-center gap-2 pb-1">
        <div className="w-12 h-12 rounded-[14px] flex items-center justify-center bg-admin-primary">
          <LockIcon />
        </div>
        <div className="text-center">
          <div className="text-[20px] font-black text-ink">{translations('forgotTitle')}</div>
          <div className="text-[13px] text-accent mt-0.5">
            {step === 'email' ? translations('forgotSub') : translations('resetPasswordSub')}
          </div>
        </div>
      </div>

      {step === 'email' && (
        <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="flex flex-col gap-5">
          <AdminInput
            type="email"
            label={translations('email')}
            placeholder={translations('emailPlaceholder')}
            startIcon={<EmailIcon />}
            hint={translations('forgotHint')}
            autoConvertMessages={autoConvertMessages}
            error={emailForm.formState.errors.email?.message}
            {...emailForm.register('email')}
          />

          {serverError && (
            <p className="text-[13px] text-danger text-center -mt-2">{serverError}</p>
          )}

          <AdminButton type="submit" fullWidth loading={emailForm.formState.isSubmitting} startIcon={<SendIcon />}>
            {translations('sendResetLink')}
          </AdminButton>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={passwordForm.handleSubmit(onOtpSubmit)} className="flex flex-col gap-5">
          {/* Email badge */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface rounded-[8px] text-[13px] text-admin-primary font-semibold">
              <EmailIcon />
              {email}
            </div>
          </div>

          {/* OTP */}
          <div className="flex flex-col gap-2">
            <span className="text-center text-[13px] text-accent">{translations('enterOtp')}</span>
            <AdminOTPInput length={4} value={otp} onChange={setOtp} error={otpError} disabled={passwordForm.formState.isSubmitting} />
            {otpError && (
              <div className="flex items-center justify-center gap-1.5 text-[13px] text-danger">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {translations('otpError')}
              </div>
            )}
          </div>

          {/* New password */}
          <AdminInput
            type="password"
            label={translations('newPassword')}
            placeholder={translations('passwordMinPlaceholder')}
            startIcon={<LockIcon />}
            error={passwordForm.formState.errors.password?.message}
            {...passwordForm.register('password')}
          />

          {/* Confirm password */}
          <AdminInput
            type="password"
            label={translations('confirmPassword')}
            placeholder={translations('passwordPlaceholder')}
            startIcon={<LockIcon />}
            error={passwordForm.formState.errors.confirmPassword?.message}
            {...passwordForm.register('confirmPassword')}
          />

          {serverError && (
            <p className="text-[13px] text-danger text-center -mt-2">{serverError}</p>
          )}

          <AdminButton type="submit" fullWidth loading={passwordForm.formState.isSubmitting} startIcon={<ConfirmIcon />}>
            {translations('resetPasswordBtn')}
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
        </form>
      )}
    </div>
  )
}
