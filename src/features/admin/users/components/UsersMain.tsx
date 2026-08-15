'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { AdminPageHeader } from '@/components/ui/admin/AdminPageHeader'
import { AdminButton, ADMIN_HEADER_ACTION_BUTTON_CLASS } from '@/components/ui/admin/AdminButton'
import { AdminBadge } from '@/components/ui/admin/AdminBadge'
import { AdminSearchBar } from '@/components/ui/admin/AdminSearchBar'
import { AdminPagination } from '@/components/ui/admin/AdminPagination'
import { PlusIcon, EditIcon, CheckIcon, TrashIcon, LayersIcon } from '@/components/ui/shared/Icons'
import { formatDateShort } from '@/lib/dates'
import { useUsers, type AdminUser } from '../hooks/useUsers'
import { useUserBan, useUserUnban, useUserDelete } from '../hooks/useUserMutations'
import { AddUserDialog } from './AddUserDialog'
import { PAGINATION } from '@/lib/constants/pagination'
import { getPaginationMeta } from '@/lib/pagination'

const AVATAR_COLORS = ['#3459A5','#22c55e','#f59e0b','#9333ea','#ef4444','#0891b2','#d97706','#6d28d9','#059669','#c2410c']
function avatarColor(name: string) {
  const charCode = name.trim().charCodeAt(0)
  return AVATAR_COLORS[(Number.isFinite(charCode) ? charCode : 0) % AVATAR_COLORS.length]
}

export function UsersMain() {
  const locale = useLocale() as 'ar' | 'en'
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const usersTranslations  = useTranslations('admin.usersPage.list')
  const adminTranslations = useTranslations('admin')
  const editUserIdParam = searchParams.get('editUserId')

  const [page,         setPage]         = useState(1)
  const [inputVal,     setInputVal]     = useState('')
  const [search,       setSearch]       = useState('')

  const { data, isLoading } = useUsers({ page, limit: PAGINATION.TABLE_LIMIT, search })
  const ban    = useUserBan()
  const unban  = useUserUnban()
  const remove = useUserDelete()

  const [showDialog,    setShowDialog]    = useState(false)
  const [editUser,      setEditUser]      = useState<AdminUser | undefined>()
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const users = data?.data ?? []
  const editUserFromParam = editUserIdParam
    ? users.find((user) => user.id === editUserIdParam)
    : undefined
  const activeEditUser = editUser ?? editUserFromParam
  const total = data?.total ?? 0
  const currentPage = data?.page ?? page
  const currentLimit = data?.limit ?? PAGINATION.TABLE_LIMIT
  const { totalPages } = getPaginationMeta(total, currentPage, currentLimit)

  function openAdd()                { setEditUser(undefined); setShowDialog(true) }
  function openEdit(user: AdminUser) { setEditUser(user);      setShowDialog(true) }
  function closeDialog() {
    setShowDialog(false)
    setEditUser(undefined)
    clearEditUserParam()
  }

  function clearEditUserParam() {
    if (!editUserIdParam) return

    const nextParams = new URLSearchParams(searchParams.toString())
    nextParams.delete('editUserId')
    const query = nextParams.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  return (
    <>
      <AdminPageHeader
        title={usersTranslations('pageTitle')}
        breadcrumbs={[
          { label: adminTranslations('dashboard'), href: `/${locale}/admin/dashboard` },
          { label: usersTranslations('pageTitle') },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Link href={`/${locale}/admin/users/roles`}>
              <AdminButton variant="light" size="sm" className={ADMIN_HEADER_ACTION_BUTTON_CLASS}>
                <LayersIcon />
                {usersTranslations('rolesBtn')}
              </AdminButton>
            </Link>
            <AdminButton size="sm" className={ADMIN_HEADER_ACTION_BUTTON_CLASS} onClick={openAdd}>
              <PlusIcon />
              {usersTranslations('addUser')}
            </AdminButton>
          </div>
        }
      />

      <div className="bg-white rounded-[10px] border border-gray-200 shadow-[0_2px_8px_rgba(52,89,165,0.05)] px-5 py-4">
        <AdminSearchBar
          search={inputVal}
          onSearchChange={setInputVal}
          searchPlaceholder={usersTranslations('searchPlaceholder')}
          onSearch={() => {
            setSearch(inputVal)
            setPage(1)
          }}
          searchButtonLabel={usersTranslations('searchButton')}
        />
      </div>

      <div className="bg-white rounded-[10px] border border-gray-200 shadow-[0_2px_12px_rgba(52,89,165,0.07)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-start text-[12px] font-semibold text-gray-500 uppercase tracking-wide border-b-2 border-gray-200">#</th>
                <th className="px-4 py-3 text-start text-[12px] font-semibold text-gray-500 uppercase tracking-wide border-b-2 border-gray-200">{usersTranslations('colUser')}</th>
                <th className="px-4 py-3 text-start text-[12px] font-semibold text-gray-500 uppercase tracking-wide border-b-2 border-gray-200">{usersTranslations('colRole')}</th>
                <th className="px-4 py-3 text-start text-[12px] font-semibold text-gray-500 uppercase tracking-wide border-b-2 border-gray-200">{usersTranslations('colDate')}</th>
                <th className="px-4 py-3 text-start text-[12px] font-semibold text-gray-500 uppercase tracking-wide border-b-2 border-gray-200">{usersTranslations('colStatus')}</th>
                <th className="px-4 py-3 border-b-2 border-gray-200" />
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                    <div className="flex justify-center">
                      <div className="animate-spin h-6 w-6 border-2 border-admin-primary border-t-transparent rounded-full" />
                    </div>
                  </td>
                </tr>
              )}
              {!isLoading && users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400 text-[13px]">
                    {usersTranslations('empty')}
                  </td>
                </tr>
              )}
              {users.map((user, index) => (
                <tr key={user.id} className="border-b border-surface-soft last:border-none hover:bg-neutral-50 transition-colors">
                  <td className="px-4 py-3 text-[13px] text-gray-400">{(currentPage - 1) * currentLimit + index + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-[12px] flex items-center justify-center text-white text-[15px] font-bold flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${avatarColor(user.name)}, ${avatarColor(user.name)}cc)` }}
                      >
                        {user.name.trim().charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="text-[14px] font-bold text-gray-900 leading-tight">{user.name}</p>
                        <p className="text-[12px] text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[8px] bg-admin-primary-bg text-admin-primary text-[12px] font-semibold">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-gray-400">
                    {formatDateShort(user.createdAt, locale)}
                  </td>
                  <td className="px-4 py-3">
                    <AdminBadge variant={user.banned ? 'rejected' : 'active'}>
                      {user.banned ? usersTranslations('banned') : usersTranslations('active')}
                    </AdminBadge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <AdminButton variant="icon" size="sm" onClick={() => openEdit(user)}>
                        <EditIcon />
                      </AdminButton>
                      {user.banned ? (
                        <AdminButton
                          variant="icon"
                          size="sm"
                          className="!text-success-emerald !border-success-emerald hover:!bg-success-emerald hover:!text-white"
                          loading={unban.isPending}
                          onClick={() => unban.mutate(user.id)}
                        >
                          <CheckIcon />
                        </AdminButton>
                      ) : (
                        <AdminButton
                          variant="icon"
                          size="sm"
                          className="!text-danger-bright !border-danger-bright hover:!bg-danger-bright hover:!text-white"
                          loading={ban.isPending}
                          onClick={() => ban.mutate(user.id)}
                        >
                          <BanIcon />
                        </AdminButton>
                      )}
                      <AdminButton
                        variant="icon"
                        size="sm"
                        className="!text-danger-bright !border-danger-bright hover:!bg-danger-bright hover:!text-white"
                        onClick={() => setDeleteConfirm(user.id)}
                      >
                        <TrashIcon />
                      </AdminButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 text-sm text-gray-500">
              <span>{usersTranslations('paginationInfo', { total, current: currentPage, last: totalPages })}</span>
              <AdminPagination totalPages={totalPages} currentPage={currentPage} onPageChange={setPage} />
            </div>
          )}
      </div>

      {(showDialog || editUserFromParam) && (
        <AddUserDialog user={activeEditUser} onClose={closeDialog} />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-[16px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] w-full max-w-[380px] p-6 text-center">
            <div className="w-14 h-14 bg-danger-bg-faint rounded-full flex items-center justify-center mx-auto mb-4">
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4h6v2" />
              </svg>
            </div>
            <h3 className="text-[16px] font-bold text-gray-900 mb-2">{usersTranslations('deleteTitle')}</h3>
            <p className="text-[13px] text-gray-500 mb-6">{usersTranslations('deleteDesc')}</p>
            <div className="flex gap-3">
              <AdminButton variant="light" fullWidth onClick={() => setDeleteConfirm(null)}>
                {usersTranslations('cancel')}
              </AdminButton>
              <AdminButton
                variant="primary"
                fullWidth
                className="!bg-danger-bright hover:!bg-danger-red"
                loading={remove.isPending}
                onClick={() => remove.mutate(deleteConfirm, { onSuccess: () => setDeleteConfirm(null) })}
              >
                {usersTranslations('deleteConfirm')}
              </AdminButton>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function BanIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
    </svg>
  )
}
