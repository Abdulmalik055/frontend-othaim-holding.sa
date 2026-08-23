import type { AdminPermission } from '@/types'

export type AdminNavPath = 'dashboard' | 'cms' | 'hr' | 'support' | 'users' | 'settings'

export type AdminNavLabelKey = 'dashboard' | 'content' | 'hr' | 'support' | 'users' | 'settings'

export type AdminNavItem = {
  permission: AdminPermission
  labelKey: AdminNavLabelKey
  path: AdminNavPath
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { permission: 'dashboard:view', labelKey: 'dashboard', path: 'dashboard' },
  { permission: 'cms:view',       labelKey: 'content',   path: 'cms' },
  { permission: 'support:view',   labelKey: 'support',   path: 'support' },
  { permission: 'users:view',     labelKey: 'users',     path: 'users' },
  { permission: 'settings:view',  labelKey: 'settings',  path: 'settings' },
]

export const ADMIN_USERS_PERMISSION: AdminPermission = 'users:view'

export function hasAdminPermission(
  permissions: readonly string[] | null | undefined,
  permission: AdminPermission,
): boolean {
  return Array.isArray(permissions) && permissions.includes(permission)
}

export function canAccessAdminPath(
  permissions: readonly string[] | null | undefined,
  path: AdminNavPath,
): boolean {
  const item = ADMIN_NAV_ITEMS.find((navItem) => navItem.path === path)
  return item ? hasAdminPermission(permissions, item.permission) : false
}
