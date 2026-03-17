import { useState } from 'react'
import { type ReactNode } from 'react'

interface CollapsibleCardProps {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}

export default function CollapsibleCard({ title, children, defaultOpen = true }: CollapsibleCardProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section
      className="bg-white/90 bg-cover bg-center bg-no-repeat rounded-2xl shadow-lg shadow-pink-100/50 border border-[#FCE7E9] overflow-hidden"
      style={{ backgroundImage: "url('/dashboard-card-bg.png')" }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#FDF2F4]/50 transition-colors"
      >
        <h2 className="text-base font-semibold text-gray-700">{title}</h2>
        <span
          className="text-gray-500 transition-transform"
          aria-hidden
        >
          {open ? '▼' : '▶'}
        </span>
      </button>
      {open && <div className="px-4 pb-4 pt-0">{children}</div>}
    </section>
  )
}
