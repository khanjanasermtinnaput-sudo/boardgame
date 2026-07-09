import clsx from 'clsx'
import { tokenColorHex } from '@/lib/tokenColors'

interface AvatarProps {
  name: string
  color?: string
  size?: 'sm' | 'md' | 'lg'
  imageUrl?: string | null
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-16 w-16 text-lg',
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return (parts[0] ?? '?').slice(0, 2).toUpperCase()
  return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase()
}

export function Avatar({ name, color = 'emerald', size = 'md', imageUrl }: AvatarProps) {
  const swatch = tokenColorHex(color)

  if (imageUrl) {
    return <img src={imageUrl} alt={name} className={clsx('rounded-full object-cover', sizeClasses[size])} />
  }

  return (
    <div
      className={clsx('flex items-center justify-center rounded-full font-semibold text-black', sizeClasses[size])}
      style={{ backgroundColor: swatch }}
      aria-label={name}
    >
      {initials(name)}
    </div>
  )
}
