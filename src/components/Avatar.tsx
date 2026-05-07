interface AvatarProps {
  name: string
  size?: 'sm' | 'md'
}

export function Avatar({ name, size = 'sm' }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const sizeClasses = size === 'sm' ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-xs'

  return (
    <div
      className={`${sizeClasses} rounded-full bg-gray-300 text-gray-700 flex items-center justify-center font-medium shrink-0`}
    >
      {initials}
    </div>
  )
}
