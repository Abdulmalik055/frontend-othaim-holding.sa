'use client'

import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/useAuthStore'
import { signIn, getSession, authClient } from '@/lib/auth-client'
import { signOutWithApi } from '@/lib/sign-out'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const otp = (authClient as any).emailOtp

export function useAuth() {
  const router = useRouter()
  const { user, isAuthenticated, setUser, clearAuth } = useAuthStore()

  async function login(email: string, password: string, rememberMe?: boolean) {
    const result = await signIn.email({ email, password, rememberMe })
    if (result.error) throw new Error(result.error.message ?? 'Login failed')
    // Fetch fresh session to get complete user data including role
    const sessionResult = await getSession()
    const user = sessionResult.data?.user ?? result.data?.user
    if (user) {
      setUser(user as Parameters<typeof setUser>[0])
    }
    return result
  }

  async function loginWithGoogle(locale: string) {
    await signIn.social({
      provider: 'google',
      callbackURL: `/${locale}/admin/dashboard`,
    })
  }

  async function logout(locale: string) {
    try {
      await signOutWithApi()
    } finally {
      clearAuth()
      router.replace(`/${locale}/auth/login`)
      router.refresh()
    }
  }

  async function sendVerificationOTP(email: string) {
    const result = await otp.sendVerificationOtp({ email, type: 'email-verification' })
    if (result?.error) throw new Error(result.error.message ?? 'Failed to send OTP')
    return result
  }

  async function verifyEmail(email: string, code: string) {
    const result = await otp.verifyEmail({ email, otp: code })
    if (result?.error) throw new Error(result.error.message ?? 'Invalid OTP')
    return result
  }

  async function sendResetPasswordOTP(email: string) {
    const result = await otp.sendVerificationOtp({ email, type: 'forget-password' })
    if (result?.error) throw new Error(result.error.message ?? 'Failed to send OTP')
    return result
  }

  async function resetPasswordWithOTP(email: string, otpCode: string, newPassword: string) {
    const result = await otp.resetPassword({ email, otp: otpCode, password: newPassword })
    if (result?.error) throw new Error(result.error.message ?? 'Failed to reset password')
    return result
  }

  function getRedirectDestination(locale: string): string {
    return `/${locale}/admin/dashboard`
  }

  return {
    user,
    isAuthenticated,
    login,
    loginWithGoogle,
    logout,
    sendVerificationOTP,
    verifyEmail,
    sendResetPasswordOTP,
    resetPasswordWithOTP,
    getRedirectDestination,
  }
}
