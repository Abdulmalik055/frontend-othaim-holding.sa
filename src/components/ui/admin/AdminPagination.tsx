'use client'

// Admin pagination: 36×36 buttons, border #e5e7eb, active #3459A5, hover #eff6ff

type Props = {
  totalPages:     number
  currentPage:    number
  onPageChange:   (page: number) => void
  siblingsCount?: number
}

function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

export function AdminPagination({ totalPages, currentPage, onPageChange, siblingsCount = 1 }: Props) {
  if (totalPages <= 1) return null

  const leftSibling  = Math.max(currentPage - siblingsCount, 1)
  const rightSibling = Math.min(currentPage + siblingsCount, totalPages)

  const showLeftDots  = leftSibling > 2
  const showRightDots = rightSibling < totalPages - 1

  const pages: (number | '...')[] = [
    1,
    ...(showLeftDots ? ['...' as const] : range(2, leftSibling - 1)),
    ...range(leftSibling, rightSibling),
    ...(showRightDots ? ['...' as const] : range(rightSibling + 1, totalPages - 1)),
    totalPages,
  ].filter((item, index, arr) => arr.indexOf(item) === index)

  const btn = (label: string | number, page: number, disabled = false, active = false) => (
    <button
      key={`${label}-${page}`}
      onClick={() => !disabled && onPageChange(page)}
      disabled={disabled}
      className={[
        'w-9 h-9 flex items-center justify-center rounded-[8px] border text-sm font-bold',
        'transition-colors mx-0.5',
        disabled ? 'opacity-40 cursor-not-allowed border-gray-200 text-gray-400'
          : active  ? 'bg-admin-primary border-admin-primary text-white'
          : 'border-gray-200 text-admin-primary hover:bg-admin-primary-bg hover:border-admin-primary',
      ].join(' ')}
    >
      {label}
    </button>
  )

  return (
    <div className="flex items-center">
      {btn('«', 1, currentPage === 1)}
      {btn('‹', currentPage - 1, currentPage === 1)}
      {pages.map((pageItem, i) =>
        pageItem === '...'
          ? <span key={`dots-${i}`} className="w-9 h-9 flex items-center justify-center text-gray-400">…</span>
          : btn(pageItem, pageItem, false, pageItem === currentPage)
      )}
      {btn('›', currentPage + 1, currentPage === totalPages)}
      {btn('»', totalPages, currentPage === totalPages)}
    </div>
  )
}
