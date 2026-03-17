import type { FC } from 'react'

export const MessageIcon: FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => (
  <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect
      x="6"
      y="8"
      width="28"
      height="20"
      rx="6"
      fill="#F472B6"
      fillOpacity="0.15"
      stroke="#F472B6"
      strokeWidth="1.8"
    />
    <circle cx="13" cy="16" r="2.5" fill="#F472B6" />
    <circle cx="20" cy="16" r="2.5" fill="#F472B6" />
    <circle cx="27" cy="16" r="2.5" fill="#F472B6" />
    <path d="M10 26L16 20H30" stroke="#F472B6" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
)

export const ShoppingIcon: FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => (
  <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M28 12H12C10.8954 12 10 12.8954 10 14V28C10 29.1046 10.8954 30 12 30H28C29.1046 30 30 29.1046 30 28V14C30 12.8954 29.1046 12 28 12Z"
      fill="#F472B6"
      fillOpacity="0.15"
      stroke="#F472B6"
      strokeWidth="1.8"
    />
    <path
      d="M24 18C24 20.2091 22.2091 22 20 22C17.7909 22 16 20.2091 16 18"
      stroke="#F472B6"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path d="M12 12L16 6H24L28 12" stroke="#F472B6" strokeWidth="1.8" />
  </svg>
)

export const CalendarIcon: FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => (
  <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect
      x="6"
      y="8"
      width="28"
      height="24"
      rx="4"
      fill="#F472B6"
      fillOpacity="0.1"
      stroke="#F472B6"
      strokeWidth="1.8"
    />
    <path d="M12 4V12" stroke="#F472B6" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M28 4V12" stroke="#F472B6" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M6 16H34" stroke="#F472B6" strokeWidth="1.8" />
    <circle cx="13" cy="22" r="2" fill="#F472B6" />
    <circle cx="20" cy="22" r="2" fill="#F472B6" />
    <circle cx="27" cy="22" r="2" fill="#F472B6" />
  </svg>
)

export const PadIcon: FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => (
  <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse
      cx="20"
      cy="20"
      rx="12"
      ry="8"
      fill="#F472B6"
      fillOpacity="0.15"
      stroke="#F472B6"
      strokeWidth="1.8"
    />
    <path d="M14 18L18 22L26 14" stroke="#F472B6" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
)

export const MOOD_ICONS: Record<string, string> = {
  开心: '😊',
  郁闷: '😔',
  大哭: '😭',
  生气: '😠',
  兴奋: '🤩',
  敏感: '😟',
  焦虑: '😰',
  放松: '😌',
  压抑: '😔',
  悲伤: '😢',
}

export const TimeDot: FC<{ active?: boolean }> = ({ active = false }) => (
  <div
    className={`w-2 h-2 rounded-full transition-all ${
      active ? 'bg-[#F472B6] scale-125' : 'bg-[#F472B6] opacity-30'
    }`}
  />
)

