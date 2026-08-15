import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { AuthCard } from './AuthCard'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const translations = await getTranslations({ locale, namespace: 'auth' })
  return { title: translations('login') }
}

export default async function LoginPage({ params }: Props) {
  const { locale } = await params

  return (
    <AuthLayout>
      <AuthCard locale={locale} />
    </AuthLayout>
  )
}
