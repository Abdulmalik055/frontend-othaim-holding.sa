'use client'

import { useMemo } from 'react'
import { AdminInput } from '@/components/ui/admin/AdminInput'
import { AdminSelect, type SelectOption } from '@/components/ui/admin/AdminSelect'
import { SearchIcon } from '@/components/ui/shared/Icons'

type FilterOption = { label: string; value: string }

export type FilterConfig = {
  key:         string
  placeholder: string
  options:     FilterOption[]
}

type Props = {
  search:              string
  onSearchChange:      (value: string) => void
  searchPlaceholder?:  string
  filters?:            FilterConfig[]
  filterValues?:       Record<string, string>
  onFilterChange?:     (key: string, value: string) => void
  onSearch?:           () => void
  searchButtonLabel?:  string
}

export function AdminSearchBar({
  search,
  onSearchChange,
  searchPlaceholder,
  filters = [],
  filterValues = {},
  onFilterChange,
  onSearch,
  searchButtonLabel,
}: Props) {
  const mappedFilters = useMemo(
    () =>
      filters.map((filter) => ({
        ...filter,
        options: filter.options.map((option) => ({
          label: option.label,
          value: option.value,
        })) as SelectOption[],
      })),
    [filters],
  )

  return (
    <div className="flex gap-4 flex-wrap items-center">
      {/* Search input */}
      <div className="flex-1 min-w-[200px]">
        <AdminInput
          variant="filter"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && onSearch?.()}
          placeholder={searchPlaceholder}
          className="!text-[14px]"
          startIcon={<SearchIcon size={16} className="shrink-0" />}
        />
      </div>

      {/* Filter dropdowns */}
      {mappedFilters.map((filter) => (
        <div key={filter.key} className="w-[170px] flex-shrink-0">
          <AdminSelect
            variant="filter"
            options={filter.options}
            value={filter.options.find((option) => option.value === (filterValues[filter.key] ?? '')) ?? null}
            onChange={(option) => onFilterChange?.(filter.key, (option as SelectOption | null)?.value ?? '')}
            placeholder={filter.placeholder}
            isSearchable
            isClearable={false}
            classNamePrefix={`admin-search-filter-${filter.key}`}
          />
        </div>
      ))}
      {/* Optional search button */}
      {onSearch && (
        <button
          onClick={onSearch}
          className="flex items-center gap-2 bg-admin-primary text-white px-4 py-[9px] rounded-[8px] text-[14px] font-medium hover:bg-admin-primary-deep transition-colors shrink-0"
        >
          <SearchIcon size={16} className="shrink-0" />
          {searchButtonLabel}
        </button>
      )}
    </div>
  )
}
