'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { AdminLanguageSwitcher } from '@/components/ui/admin/AdminLanguageSwitcher'
import { AdminAvatar } from '@/components/ui/admin/AdminAvatar'
import type { User } from '@/types'

type BreadcrumbItem = { label: string; href?: string }

type Props = {
  breadcrumbs?: BreadcrumbItem[]
  title?: string
  user: User
  locale: string
  onSignOut?: () => void
  onMobileMenuToggle?: () => void
  className?: string
}

export function TopBar({ breadcrumbs, title, user, locale, onSignOut, onMobileMenuToggle, className = '' }: Props) {
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const translations = useTranslations('userMenu')
  const adminTranslations = useTranslations('admin')

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  return (
    <header className={`flex items-center justify-between px-4 md:px-6 py-3 bg-white rounded-[10px] shadow-[0_2px_12px_rgba(52,89,165,0.10)] mb-6 ${className}`}>
      {/* Start: hamburger (mobile) + title or breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        {onMobileMenuToggle && (
          <button
            onClick={onMobileMenuToggle}
            className="md:hidden p-1.5 text-gray-500 hover:text-admin-primary transition-colors shrink-0"
            aria-label={adminTranslations('openMenu')}
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <nav className="flex items-center gap-1.5 text-sm">
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1
              return (
                <span key={index} className="flex items-center gap-1.5">
                  {index > 0 && (
                    <span className="text-[#adb5bd] select-none">/</span>
                  )}
                  {isLast ? (
                    <span className="font-semibold text-dim-dark truncate">{crumb.label}</span>
                  ) : crumb.href ? (
                    
                    <Link
                      href={crumb.href}
                      className="text-mid hover:text-admin-primary transition-colors truncate"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-mid truncate">{crumb.label}</span>
                  )}
                </span>
              )
            })}
          </nav>
        ) : title ? (
          <h1 className="text-[22px] font-bold text-mid truncate">{title}</h1>
        ) : null}
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-3">
        <a
          href={`/${locale}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-admin-primary text-white text-[13px] font-bold rounded-[10px] hover:bg-admin-primary-dark transition-all duration-150"
        >
          <ExternalLinkIcon />
          <span className="hidden md:block">{adminTranslations('viewLiveSite')}</span>
        </a>
        <AdminLanguageSwitcher locale={locale} />

        {/* User dropdown */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setUserMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 focus:outline-none"
            aria-label={translations('ariaLabel')}
            aria-expanded={userMenuOpen}
          >
            <AdminAvatar
              name={user.name ?? user.email ?? '?'}
            />
          </button>

          {userMenuOpen && (
            <div className="absolute top-full end-0 mt-2 w-[200px] bg-white rounded-[10px] shadow-[0_4px_16px_rgba(0,0,0,.12)] border border-separator z-50 py-1">
              {/* User info header */}
              <div className="px-4 py-2.5 border-b border-separator">
                <p className="text-sm font-semibold text-dim-dark truncate">{user.name}</p>
                <p className="text-xs text-accent truncate">{user.email}</p>
              </div>

              {/* Menu items */}
              <div className="py-1">
                <Link
                  href={`/${locale}/admin/settings`}
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-dim-dark hover:bg-admin-bg hover:text-admin-primary transition-colors"
                >
                  <CogIcon />
                  {translations('settings')}
                </Link>
              </div>

              <div className="border-t border-separator py-1">
                <button
                  onClick={() => {
                    setUserMenuOpen(false)
                    onSignOut?.()
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-danger hover:bg-danger-bg-soft transition-colors"
                >
                  <SignOutIcon />
                  {translations('signOut')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

// ─── Inline SVG Icons ────────────────────────────────────────────────────────

function CogIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function SignOutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

function ExternalLinkIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}
