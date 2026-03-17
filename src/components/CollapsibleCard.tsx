import { useState } from 'react'
import type { ReactNode } from 'react'

interface CollapsibleCardProps {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}

export default function CollapsibleCard({ title, children, defaultOpen = true }: CollapsibleCardProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section
      className="bg-white/90 bg-cover bg-center bg-no-repeat rounded-xl md:rounded-2xl shadow-md md:shadow-lg shadow-pink-100/50 border border-[#FCE7E9] overflow-hidden"
      style={{ backgroundImage: "url('/dashboard-card-bg.png')" }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-3 md:px-4 md:py-3 text-left hover:bg-[#FDF2F4]/50 active:bg-[#FCE7E9]/60 transition-colors min-h-[44px] select-none"
      >
        <h2 className="text-sm md:text-base font-semibold text-gray-700">{title}</h2>
        <span
          className="text-gray-500 transition-transform shrink-0"
          aria-hidden
        >
          {open ? '▼' : '▶'}
        </span>
      </button>
      {open && <div className="px-3 pb-3 pt-0 md:px-4 md:pb-4">{children}</div>}
    </section>
  )
}
