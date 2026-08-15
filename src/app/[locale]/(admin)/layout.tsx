import { AdminLayoutClient } from '@/components/layout/AdminLayoutClient'

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function AdminGroupLayout({ children, params }: Props) {
  const { locale } = await params

  return (
    <div className="admin-surface">
      <AdminLayoutClient locale={locale}>
        {children}
      </AdminLayoutClient>
    </div>
  )
}
