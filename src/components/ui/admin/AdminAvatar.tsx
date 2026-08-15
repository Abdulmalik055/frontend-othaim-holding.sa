import Image from 'next/image'

type AdminAvatarSize = 'sm' | 'md' | 'lg'

const sizes: Record<AdminAvatarSize, string> = {
  sm: 'w-[34px] h-[34px] text-[14px]',
  md: 'w-[40px] h-[40px] text-[15px]',
  lg: 'w-[48px] h-[48px] text-[18px]',
}

const pixels: Record<AdminAvatarSize, number> = {
  sm: 34,
  md: 40,
  lg: 48,
}

type Props = {
  name: string
  image?: string | null
  size?: AdminAvatarSize
  className?: string
}

export function AdminAvatar({ name, image, size = 'md', className = '' }: Props) {
  const initial = (name || '?').charAt(0).toUpperCase()
  const sizeClass = sizes[size]

  if (image) {
    return (
      <Image
        src={image}
        alt={name || 'Avatar'}
        width={pixels[size]}
        height={pixels[size]}
        className={`${sizeClass} rounded-full object-cover shrink-0 overflow-hidden ${className}`}
      />
    )
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-admin-primary text-white font-bold flex items-center justify-center shrink-0 ${className}`}
    >
      {initial}
    </div>
  )
}
