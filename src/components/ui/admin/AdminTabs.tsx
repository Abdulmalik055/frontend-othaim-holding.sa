'use client'

import * as RadixTabs from '@radix-ui/react-tabs'
import { useLocale } from 'next-intl'
import type { ReactNode } from 'react'

// Admin has three tab styles:
// 'config'   → large (20px), 5px bottom border, blue active  (.config-tab.nav-tabs)
// 'language' → smaller pill-like  (.language-tab)
// 'pill'     → white card container, filled blue active tab (used in detail pages)

type Variant = 'config' | 'language' | 'pill'

type TabItem = {
  id:      string
  label:   string
  icon?:   ReactNode
  content: ReactNode
}

type Props = {
  tabs:          TabItem[]
  defaultValue?: string
  value?:        string
  onChange?:     (id: string) => void
  variant?:      Variant
  dir?:          'rtl' | 'ltr'
  listAction?:   ReactNode
}

export function AdminTabs({ tabs, defaultValue, value, onChange, variant = 'config', dir, listAction }: Props) {
  const locale = useLocale()
  const resolvedDir = dir ?? (locale === 'ar' ? 'rtl' : 'ltr')
  const listClass =
    variant === 'config'
      ? 'flex border-b border-gray-200 gap-0'
      : variant === 'pill'
      ? 'flex w-fit gap-1 bg-white rounded-[14px] shadow-[0_2px_12px_rgba(52,89,165,0.10)] p-[6px] flex-wrap'
      : 'flex gap-1 bg-gray-100 p-1 rounded-[8px]'

  const triggerClass =
    variant === 'config'
      ? [
          'inline-flex items-center gap-2 px-4 py-4 text-[20px] font-bold cursor-pointer outline-none',
          'border-b-[5px] border-transparent text-mid transition-all duration-[350ms]',
          'mx-8 first:ms-0 [dir=ltr]:first:ms-0',
          'data-[state=active]:border-admin-primary data-[state=active]:text-admin-primary',
          'hover:text-admin-primary hover:border-admin-primary',
        ].join(' ')
      : variant === 'pill'
      ? [
          'inline-flex items-center gap-[7px] h-[38px] px-5 rounded-[10px] text-[13px] cursor-pointer outline-none',
          'text-gray-500 transition-all whitespace-nowrap',
          'data-[state=active]:bg-admin-primary data-[state=active]:text-white data-[state=active]:shadow-[0_4px_12px_rgba(52,89,165,0.25)] data-[state=active]:font-semibold',
          'hover:bg-surface-soft hover:text-gray-700 data-[state=active]:hover:bg-admin-primary',
        ].join(' ')
      : [
          'inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold cursor-pointer outline-none rounded-[6px]',
          'text-gray-500 transition-colors',
          'data-[state=active]:bg-white data-[state=active]:text-admin-primary data-[state=active]:shadow-sm',
          'hover:text-admin-primary',
        ].join(' ')

  return (
    <RadixTabs.Root
      defaultValue={defaultValue ?? tabs[0]?.id}
      value={value}
      onValueChange={onChange}
      dir={resolvedDir}
    >
      {variant === 'pill' && listAction ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <RadixTabs.List className={listClass}>
            {tabs.map(tab => (
              <RadixTabs.Trigger key={tab.id} value={tab.id} className={triggerClass}>
                {tab.icon}
                {tab.label}
              </RadixTabs.Trigger>
            ))}
          </RadixTabs.List>
          <div className="shrink-0">{listAction}</div>
        </div>
      ) : (
        <RadixTabs.List className={listClass}>
          {tabs.map(tab => (
            <RadixTabs.Trigger key={tab.id} value={tab.id} className={triggerClass}>
              {tab.icon}
              {tab.label}
            </RadixTabs.Trigger>
          ))}
        </RadixTabs.List>
      )}

      {tabs.map(tab => (
        <RadixTabs.Content key={tab.id} value={tab.id} className="pt-4 outline-none">
          {tab.content}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  )
}
