type SpinnerProps = {
  size?: 'xs' | 'sm' | 'md' | 'lg'
  color?: 'white' | 'primary'
  className?: string
}

const sizeMap: Record<NonNullable<SpinnerProps['size']>, string> = {
  xs: 'w-3 h-3',
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-8 h-8',
}

const colorMap: Record<NonNullable<SpinnerProps['color']>, string> = {
  white:   'border-white',
  primary: 'border-admin-primary',
}

export function Spinner({ size = 'md', color = 'white', className }: SpinnerProps) {
  const classes = [
    'border-2 border-t-transparent rounded-full animate-spin inline-block',
    sizeMap[size],
    colorMap[color],
    className,
  ].filter(Boolean).join(' ')
  return <span className={classes} />
}
