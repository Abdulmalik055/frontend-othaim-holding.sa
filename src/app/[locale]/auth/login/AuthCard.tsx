'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { LoginForm } from '@/features/auth/components/LoginForm'
import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm'
import { ChangePasswordForm } from '@/features/auth/components/ChangePasswordForm'

type Panel = 'login' | 'forgot' | 'change-password'

type Props = {
  locale: string
}

export function AuthCard({ locale }: Props) {
  const searchParams = useSearchParams()
  const [panel, setPanel] = useState<Panel>(
    searchParams.get('mustChange') === 'true' ? 'change-password' : 'login'
  )

  return (
    <div className="flex flex-col">
      {/* Panel content */}
      <div className="p-7">
        {panel === 'login' && (
          <LoginForm
            locale={locale}
            onForgot={() => setPanel('forgot')}
            onMustChange={() => setPanel('change-password')}
          />
        )}
        {panel === 'forgot' && (
          <ForgotPasswordForm
            onBack={() => setPanel('login')}
          />
        )}
        {panel === 'change-password' && (
          <ChangePasswordForm
            locale={locale}
            onBack={() => setPanel('login')}
          />
        )}
      </div>
    </div>
  )
}
