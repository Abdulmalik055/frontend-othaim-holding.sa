import type { ComponentProps } from 'react'

type Variant = 'primary' | 'secondary' | 'success' | 'warning' | 'light' | 'icon' | 'filter'
type Size = 'sm' | 'md' | 'lg'

type Props = ComponentProps<'button'> & {
  variant?: Variant
  size?: Size
  startIcon?: React.ReactNode
  endIcon?: React.ReactNode
  fullWidth?: boolean
  loading?: boolean
}

export const ADMIN_HEADER_ACTION_BUTTON_CLASS = '!h-[38px] !w-[138px] !rounded-[10px] !px-3 !text-[13px]'

const variants = {
  primary:   'bg-admin-primary text-white hover:bg-admin-primary-dark hover:shadow-[0_4px_12px_rgba(52,89,165,0.25)]',
  secondary: 'bg-secondary text-white hover:bg-[#545b62]',
  success:   'bg-success text-white hover:bg-success-dark',
  warning:   'bg-warning text-gray-800 hover:bg-[#e0a800]',
  light:     'bg-gray-50 text-[#212529] border border-[#dee2e6] hover:bg-gray-200',
  icon:      'bg-white text-gray-500 border border-gray-200 hover:bg-admin-primary hover:text-white hover:border-admin-primary',
  filter:    'bg-white text-admin-primary shadow-[0_1px_4px_rgba(0,0,0,0.08)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.12)]',
} satisfies Record<Variant, string>

const sizes = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-[42px] px-5 text-sm',
  lg: 'h-[46px] px-6 text-[15px]',
} satisfies Record<Size, string>

export function AdminButton({
  variant = 'primary', size = 'md',
  startIcon, endIcon, fullWidth, loading, disabled,
  className = '', children, ...props
}: Props) {
  return (
    <button
      className={[
        'inline-flex items-center justify-center gap-2',
        'font-bold whitespace-nowrap rounded-[10px] transition-all duration-150 cursor-pointer',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant], sizes[size],
        fullWidth && 'w-full',
        className,
      ].filter(Boolean).join(' ')}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />}
      {!loading && startIcon}
      {children}
      {!loading && endIcon}
    </button>
  )
}
