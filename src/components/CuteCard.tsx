import type { ReactNode } from 'react'

interface CuteCardProps {
  title?: string
  icon?: ReactNode | string
  children: ReactNode
  className?: string
  onClick?: () => void
  badge?: string
  badgeColor?: string
  onViewAll?: () => void
  showViewAll?: boolean
  subtitle?: string
}

const CuteCard = ({
  title,
  icon,
  children,
  className = '',
  onClick,
  badge,
  badgeColor = 'bg-pink-500',
  onViewAll,
  showViewAll = false,
  subtitle,
}: CuteCardProps) => {
  return (
    <div
      className={`relative bg-white/90 bg-cover bg-center bg-no-repeat rounded-2xl md:rounded-3xl p-4 md:p-5 shadow-md md:shadow-lg shadow-pink-100/30 border border-[#FFE8F0] hover:shadow-xl transition-all select-none ${
        onClick ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98] min-h-[44px]' : ''
      } ${className}`}
      onClick={onClick}
      style={{ backgroundImage: "url('/dashboard-card-bg.png')" }}
    >
      {badge && (
        <div
          className={`absolute -top-2 -right-2 ${badgeColor} text-white text-xs px-3 py-1 rounded-full transform rotate-3 font-medium shadow-sm z-10`}
        >
          {badge}
        </div>
      )}

      {(title || icon) && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0">
            {icon &&
              (typeof icon === 'string' ? (
                <span className="text-xl md:text-2xl shrink-0">{icon}</span>
              ) : (
                icon
              ))}
            <div className="min-w-0">
              {title && <h3 className="text-sm md:text-base font-medium text-gray-700">{title}</h3>}
              {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
            </div>
          </div>
          {showViewAll && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onViewAll?.()
              }}
              className="text-xs text-[#F472B6] flex items-center gap-1 hover:gap-2 transition-all min-h-[44px] min-w-[44px] justify-end active:opacity-80"
            >
              查看全部 <span className="text-lg leading-3">›</span>
            </button>
          )}
        </div>
      )}

      <div className="relative">{children}</div>
    </div>
  )
}

export default CuteCard

