'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { AdminDialog } from '@/components/ui/admin/AdminDialog'
import { AdminInput } from '@/components/ui/admin/AdminInput'
import { AdminButton } from '@/components/ui/admin/AdminButton'
import { useRoleCreate, useRoleUpdate } from '../hooks/useAdminRolesMutations'
import type { AdminRole } from '../hooks/useAdminRoles'
import { userRoleSchema } from '@/features/admin/users/schemas/user-role.schema'

// ─── All available permissions ─────────────────────────────────────────────
const PERMISSION_GROUPS: { resource: string; actions: string[] }[] = [
  { resource: 'dashboard',    actions: ['view'] },
  { resource: 'cms',          actions: ['view', 'create', 'edit', 'delete'] },
  { resource: 'hr',           actions: ['view', 'create', 'edit', 'delete'] },
  { resource: 'settings',     actions: ['view', 'edit'] },
  { resource: 'users',        actions: ['view', 'create', 'edit', 'delete'] },
  { resource: 'support',      actions: ['view', 'edit', 'delete'] },
]

type Props = {
  role?:    AdminRole
  onClose:  () => void
}

export function AddRoleDialog({ role, onClose }: Props) {
  const dialogTranslations    = useTranslations('admin.rolesPage.dialog')
  const resourceTranslations  = useTranslations('admin.rolesPage.resources')
  const actionTranslations    = useTranslations('admin.rolesPage.actions')

  const isEdit = !!role
  const create = useRoleCreate()
  const update = useRoleUpdate()

  const [name,        setName]        = useState(role?.name ?? '')
  const [permissions, setPermissions] = useState<Set<string>>(new Set(role?.permissions ?? []))
  const [error,       setError]       = useState('')

  function toggle(perm: string) {
    setPermissions((prev) => {
      const next = new Set(prev)
      if (next.has(perm)) {
        next.delete(perm)
      } else {
        next.add(perm)
      }
      return next
    })
  }

  function toggleGroup(resource: string, actions: string[]) {
    const all = actions.map((action) => `${resource}:${action}`)
    const allChecked = all.every((permission) => permissions.has(permission))
    setPermissions((prev) => {
      const next = new Set(prev)
      if (allChecked) {
        all.forEach((permission) => next.delete(permission))
      } else {
        all.forEach((permission) => next.add(permission))
      }
      return next
    })
  }

  const isPending = create.isPending || update.isPending

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    if (!name.trim())           { setError(dialogTranslations('nameRequired'));  return }
    if (permissions.size === 0) { setError(dialogTranslations('permRequired'));  return }

    try {
      const payload = { name: name.trim(), permissions: Array.from(permissions) }
      const parsed = userRoleSchema.safeParse(payload)
      if (!parsed.success) { setError(dialogTranslations('submitError')); return }
      if (isEdit && role) {
        await update.mutateAsync({ id: role.id, payload })
      } else {
        await create.mutateAsync(payload)
      }
      onClose()
    } catch {
      setError(dialogTranslations('submitError'))
    }
  }

  return (
    <AdminDialog
      title={isEdit ? dialogTranslations('editTitle') : dialogTranslations('addTitle')}
      onClose={onClose}
      onSubmit={handleSubmit}
      size="lg"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <AdminButton type="button" variant="light" onClick={onClose}>
            {dialogTranslations('cancel')}
          </AdminButton>
          <AdminButton type="submit" loading={isPending}>
            {isEdit ? dialogTranslations('saveChanges') : dialogTranslations('addConfirm')}
          </AdminButton>
        </div>
      }
    >
      <div className="mb-5">
        <AdminInput
          label={dialogTranslations('nameLabel')}
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={dialogTranslations('namePlaceholder')}
        />
      </div>

      <div>
        <p className="text-[13px] font-bold text-gray-700 mb-3">{dialogTranslations('permissionsLabel')}</p>
        <div className="flex flex-col gap-4">
          {PERMISSION_GROUPS.map(({ resource, actions }) => {
            const all         = actions.map((action) => `${resource}:${action}`)
            const allChecked  = all.every((permission) => permissions.has(permission))
            const someChecked = all.some((permission) => permissions.has(permission))

            return (
              <div key={resource} className="border border-surface-soft rounded-[10px] overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 border-b border-surface-soft">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    ref={(el) => { if (el) el.indeterminate = someChecked && !allChecked }}
                    onChange={() => toggleGroup(resource, actions)}
                    className="w-4 h-4 accent-admin-primary cursor-pointer"
                  />
                  <span className="text-[13px] font-bold text-gray-700">
                    {resourceTranslations(resource as Parameters<typeof resourceTranslations>[0])}
                  </span>
                </div>
                <div className="px-4 py-3 grid grid-cols-2 gap-2">
                  {actions.map((action) => {
                    const perm = `${resource}:${action}`
                    return (
                      <label key={perm} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={permissions.has(perm)}
                          onChange={() => toggle(perm)}
                          className="w-3.5 h-3.5 accent-admin-primary cursor-pointer"
                        />
                        <span className="text-[12px] text-gray-500">
                          {actionTranslations(action as Parameters<typeof actionTranslations>[0])}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {error && <p className="mt-4 text-xs text-danger">{error}</p>}
    </AdminDialog>
  )
}
