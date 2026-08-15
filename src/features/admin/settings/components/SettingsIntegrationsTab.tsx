'use client'

import { useTranslations } from 'next-intl'
import { AdminButton } from '@/components/ui/admin/AdminButton'

const INTEGRATIONS = [
  { key: 'facebook',        name: 'Facebook' },
  { key: 'googleAnalytics', name: 'Google Analytics' },
  { key: 'googleTag',       name: 'Google Tag Manager' },
  { key: 'instagram',       name: 'Instagram' },
  { key: 'snapchat',        name: 'Snapchat' },
  { key: 'twitter',         name: 'X (Twitter)' },
]

export function SettingsIntegrationsTab() {
  const integrationsTranslations = useTranslations('admin.settingsPage.integrations')

  return (
    <div>
      <p className="text-[13px] text-gray-400 mb-5">{integrationsTranslations('subtitle')}</p>

      <div className="rounded-[12px] border border-surface-soft overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-start text-[12px] font-semibold text-gray-500 uppercase tracking-wide border-b-2 border-gray-200">{integrationsTranslations('colName')}</th>
              <th className="px-4 py-3 text-start text-[12px] font-semibold text-gray-500 uppercase tracking-wide border-b-2 border-gray-200">{integrationsTranslations('colId')}</th>
              <th className="px-4 py-3 text-start text-[12px] font-semibold text-gray-500 uppercase tracking-wide border-b-2 border-gray-200">{integrationsTranslations('colStatus')}</th>
              <th className="px-4 py-3 border-b-2 border-gray-200" />
            </tr>
          </thead>
          <tbody>
            {INTEGRATIONS.map((item, i) => (
              <tr key={item.key} className={`border-b border-surface-soft last:border-none ${i % 2 === 0 ? '' : 'bg-neutral-50'}`}>
                <td className="px-4 py-3 font-semibold text-gray-700">{item.name}</td>
                <td className="px-4 py-3 text-gray-400 text-[12px] font-mono">—</td>
                <td className="px-4 py-3 text-gray-400 text-[12px]">—</td>
                <td className="px-4 py-3 text-end">
                  <AdminButton variant="light" size="sm" disabled>
                    {integrationsTranslations('activate')}
                  </AdminButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-[12px] text-gray-400">{integrationsTranslations('comingSoon')}</p>
    </div>
  )
}
