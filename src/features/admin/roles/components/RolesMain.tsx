'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import { AdminPageHeader } from '@/components/ui/admin/AdminPageHeader'
import { AdminButton, ADMIN_HEADER_ACTION_BUTTON_CLASS } from '@/components/ui/admin/AdminButton'
import { AdminSearchBar } from '@/components/ui/admin/AdminSearchBar'
import { AdminPagination } from '@/components/ui/admin/AdminPagination'
import { useAdminRoles, type AdminRole } from '../hooks/useAdminRoles'
import { useRoleDelete } from '../hooks/useAdminRolesMutations'
import { useUsers } from '@/features/admin/users/hooks/useUsers'
import { AddRoleDialog } from './AddRoleDialog'
import { PlusIcon, EditIcon, TrashIcon } from '@/components/ui/shared/Icons'
import { Spinner } from '@/components/ui/shared/Spinner'
import { PAGINATION } from '@/lib/constants/pagination'
import { getPaginationMeta } from '@/lib/pagination'

const GROUP_COLORS = [
  { bg: '#eff6ff', icon: '#3b82f6' },
  { bg: '#fdf4ff', icon: '#a855f7' },
  { bg: '#fffbeb', icon: '#f59e0b' },
  { bg: '#ecfdf5', icon: '#10b981' },
  { bg: '#fff7ed', icon: '#f97316' },
  { bg: '#f0f9ff', icon: '#0891b2' },
]
function groupColor(index: number) { return GROUP_COLORS[index % GROUP_COLORS.length] }

const AVATAR_COLORS = ['#3459A5','#22c55e','#f59e0b','#9333ea','#ef4444','#0891b2','#d97706','#6d28d9','#059669','#c2410c']
function avatarColor(name: string) { return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length] }

export function RolesMain() {
  const rolesTranslations = useTranslations('admin.rolesPage')
  const adminTranslations = useTranslations('admin')
  const resources = useTranslations('admin.rolesPage.resources')
  const actions   = useTranslations('admin.rolesPage.actions')

  function permLabel(perm: string) {
    const [resource, action] = perm.split(':')
    try {
      return `${resources(resource)} — ${actions(action)}`
    } catch {
      return perm
    }
  }
  const locale = useLocale()

  const [page,     setPage]     = useState(1)
  const [inputVal, setInputVal] = useState('')
  const [search,   setSearch]   = useState('')

  const { data, isLoading } = useAdminRoles({ page, limit: PAGINATION.TABLE_LIMIT, search })
  const { data: usersResponse } = useUsers({ limit: PAGINATION.SELECT_LIMIT })
  const remove = useRoleDelete()

  const [showDialog,    setShowDialog]    = useState(false)
  const [editRole,      setEditRole]      = useState<AdminRole | undefined>()
  const [deleteConfirm, setDeleteConfirm] = useState<AdminRole | null>(null)

  const roles = data?.data ?? []
  const users = usersResponse?.data ?? []
  const total = data?.total ?? 0
  const currentPage = data?.page ?? page
  const currentLimit = data?.limit ?? PAGINATION.TABLE_LIMIT
  const { totalPages } = getPaginationMeta(total, currentPage, currentLimit)

  function openAdd()                 { setEditRole(undefined); setShowDialog(true) }
  function openEdit(role: AdminRole) { setEditRole(role);      setShowDialog(true) }
  function closeDialog()             { setShowDialog(false);   setEditRole(undefined) }

  return (
    <div>
      <AdminPageHeader
        title={rolesTranslations('pageTitle')}
        breadcrumbs={[
          { label: adminTranslations('dashboard'), href: `/${locale}/admin/dashboard` },
          { label: adminTranslations('users'),     href: `/${locale}/admin/users` },
          { label: rolesTranslations('pageTitle') },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Link
              href={`/${locale}/admin/users`}
              className="h-[38px] px-4 rounded-[9px] border border-gray-200 flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-800 hover:border-gray-300 transition-colors"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              {adminTranslations('back')}
            </Link>
            <AdminButton className={ADMIN_HEADER_ACTION_BUTTON_CLASS} onClick={openAdd}>
              <PlusIcon />
              {rolesTranslations('addGroup')}
            </AdminButton>
          </div>
        }
      />

      {/* Info banner */}
      <div className="mt-5 flex items-start gap-3 px-4 py-3 bg-admin-primary-bg border border-blue-200 rounded-[10px] text-[13px] text-blue-700">
        <InfoIcon />
        <span>{rolesTranslations('infoBanner')}</span>
      </div>

      <div className="mt-5 bg-white rounded-[10px] border border-gray-200 shadow-[0_2px_8px_rgba(52,89,165,0.05)] px-5 py-4">
        <AdminSearchBar
          search={inputVal}
          onSearchChange={setInputVal}
          searchPlaceholder={rolesTranslations('searchPlaceholder')}
          onSearch={() => {
            setSearch(inputVal)
            setPage(1)
          }}
          searchButtonLabel={rolesTranslations('searchButton')}
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" color="primary" />
        </div>
      ) : roles.length === 0 ? (
        <div className="mt-10 text-center text-gray-400 text-[14px]">{rolesTranslations('empty')}</div>
      ) : (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {roles.map((role, index) => {
            const color = groupColor(index)
            return (
              <div
                key={role.id}
                className="bg-white rounded-[16px] border border-surface-soft shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden transition-all hover:shadow-[0_6px_24px_rgba(52,89,165,0.10)] hover:-translate-y-0.5 flex flex-col"
              >
                {/* Card header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50">
                  <div
                    className="w-[50px] h-[50px] rounded-[14px] flex items-center justify-center flex-shrink-0"
                    style={{ background: color.bg }}
                  >
                    <UsersGroupIcon color={color.icon} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[16px] font-bold text-gray-900 truncate">{role.name}</p>
                    <p className="text-[12px] text-gray-400">{role.permissions.length} {rolesTranslations('permCount')}</p>
                  </div>
                </div>

                {/* Permissions */}
                <div className="px-5 py-4 flex-1">
                  <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-2">{rolesTranslations('permissions')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {role.permissions.slice(0, 6).map((perm) => (
                      <span
                        key={perm}
                        className="inline-flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-[8px] px-2.5 py-1 text-[12px] text-gray-700"
                      >
                        <CheckSmallIcon />
                        {permLabel(perm)}
                      </span>
                    ))}
                    {role.permissions.length > 6 && (
                      <span className="inline-flex items-center px-2.5 py-1 text-[12px] text-gray-400">
                        +{role.permissions.length - 6}
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-5 py-3 border-t border-surface-soft">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const allUsers = users.filter((user) => user.role === role.name)
                      const visibleUsers = allUsers.slice(0, 3)
                      const overflow = allUsers.length - 3
                      return visibleUsers.length > 0 ? (
                        <div className="flex items-center">
                          {visibleUsers.map((user, i) => (
                            <div
                              key={user.id}
                              className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[11px] font-bold text-white"
                              style={{ background: avatarColor(user.name), marginInlineStart: i > 0 ? '-8px' : '0' }}
                              title={user.name}
                            >
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                          ))}
                          {overflow > 0 && (
                            <div
                              className="w-7 h-7 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500"
                              style={{ marginInlineStart: '-8px' }}
                            >
                              +{overflow}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[12px] text-gray-400">{rolesTranslations('noMembers')}</span>
                      )
                    })()}
                  </div>
                  <div className="flex items-center gap-2">
                    <AdminButton variant="icon" size="sm" onClick={() => openEdit(role)}>
                      <EditIcon />
                      {rolesTranslations('edit')}
                    </AdminButton>
                    <AdminButton
                      variant="icon"
                      size="sm"
                      className="!text-danger-bright !border-danger-bright hover:!bg-danger-bright hover:!text-white"
                      onClick={() => setDeleteConfirm(role)}
                    >
                      <TrashIcon />
                    </AdminButton>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-between px-4 py-3 bg-white rounded-[10px] border border-gray-200 text-sm text-gray-500">
          <span>{rolesTranslations('paginationInfo', { total, current: currentPage, last: totalPages })}</span>
          <AdminPagination totalPages={totalPages} currentPage={currentPage} onPageChange={setPage} />
        </div>
      )}

      {/* Add/Edit dialog */}
      {showDialog && <AddRoleDialog role={editRole} onClose={closeDialog} />}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-[16px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] w-full max-w-[380px] p-6 text-center">
            <div className="w-14 h-14 bg-danger-bg-faint rounded-full flex items-center justify-center mx-auto mb-4">
              <TrashIcon size={26} className="text-[#ef4444]" />
            </div>
            <h3 className="text-[16px] font-bold text-gray-900 mb-2">{rolesTranslations('deleteTitle')}</h3>
            <p className="text-[13px] text-gray-500 mb-6">
              {rolesTranslations('deleteDesc', { name: deleteConfirm.name })}
            </p>
            <div className="flex gap-3">
              <AdminButton variant="light" fullWidth onClick={() => setDeleteConfirm(null)}>
                {rolesTranslations('cancel')}
              </AdminButton>
              <AdminButton
                fullWidth
                className="!bg-danger-bright hover:!bg-danger-red"
                loading={remove.isPending}
                onClick={() => remove.mutate(deleteConfirm.id, { onSuccess: () => setDeleteConfirm(null) })}
              >
                {rolesTranslations('deleteConfirm')}
              </AdminButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function InfoIcon()       { return <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg> }
function CheckSmallIcon() { return <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> }
function UsersGroupIcon({ color }: { color: string }) { return <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> }
