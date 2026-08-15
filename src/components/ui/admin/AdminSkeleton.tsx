import type { CSSProperties } from 'react'

type AdminSkeletonType = 'text' | 'card' | 'table' | 'avatar' | 'custom'

type Props = {
  type?: AdminSkeletonType
  lines?: number
  rows?: number
  width?: string
  height?: string
  rounded?: string
  className?: string
}

function Pulse({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return <div className={`bg-line animate-pulse rounded ${className}`} style={style} />
}

export function AdminSkeleton({
  type = 'text',
  lines = 3,
  rows = 5,
  width,
  height,
  rounded,
  className = '',
}: Props) {
  const style: CSSProperties = { width, height }

  if (type === 'avatar') {
    return <Pulse className={`w-10 h-10 rounded-full ${className}`} />
  }

  if (type === 'text') {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <Pulse key={i} className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`} />
        ))}
      </div>
    )
  }

  if (type === 'card') {
    return (
      <div className={`rounded-[10px] border border-line p-4 flex flex-col gap-3 ${className}`}>
        <Pulse className="h-5 w-2/3" />
        <Pulse className="h-4 w-full" />
        <Pulse className="h-4 w-full" />
        <Pulse className="h-4 w-3/4" />
      </div>
    )
  }

  if (type === 'table') {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        <Pulse className="h-10 w-full rounded-[8px]" />
        {Array.from({ length: rows }).map((_, i) => (
          <Pulse key={i} className="h-12 w-full rounded-[8px]" />
        ))}
      </div>
    )
  }

  return <Pulse className={`${rounded ?? 'rounded'} ${className}`} style={style} />
}
