import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { VerifyEmailForm } from '@/features/auth/components/VerifyEmailForm'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ email?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const translations = await getTranslations({ locale, namespace: 'auth' })
  return { title: translations('verifyTitle') }
}

export default async function VerifyEmailPage({ params, searchParams }: Props) {
  const { locale } = await params
  const { email = '' } = await searchParams

  return (
    <AuthLayout>
      <div className="p-7">
        <VerifyEmailForm locale={locale} email={email} />
      </div>
    </AuthLayout>
  )
}
