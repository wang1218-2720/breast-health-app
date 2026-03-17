export interface KnowledgeCardProps {
  icon: string
  title: string
  description: string
  research?: string
  tips?: string[]
  /** 知识科普模块专用：浅白色调、与背景产生对比的卡片样式（不贴图） */
  variant?: 'default' | 'light'
}

export default function KnowledgeCard({ icon, title, description, research, tips, variant = 'default' }: KnowledgeCardProps) {
  const isLight = variant === 'light'
  return (
    <div
      className={
        isLight
          ? 'rounded-xl p-5 shadow-lg shadow-pink-100/30 border border-[#F5E6E8] bg-cover bg-center bg-no-repeat hover:shadow-xl hover:border-[#FCE7E9] transition'
          : 'bg-white/90 bg-cover bg-center bg-no-repeat rounded-xl p-5 shadow-sm border border-[#FCE7E9] hover:shadow-md transition'
      }
      style={
        isLight
          ? {
              backgroundImage: "linear-gradient(rgba(255,255,255,0.45), rgba(255,255,255,0.45)), url('/knowledge-card-bg.png')",
            }
          : { backgroundImage: "url('/dashboard-card-bg.png')" }
      }
    >
      <div className="flex items-start gap-3">
        <span className="text-4xl flex-shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2 flex-wrap">
            {title}
            {research != null && research !== '' && (
              <span
                className="text-sm text-[#F472B6] cursor-help"
                title={research}
                aria-label="相关研究"
              >
                📄
              </span>
            )}
          </h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
          {tips != null && tips.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tips.map((tip, i) => (
                <span
                  key={i}
                  className="text-xs bg-[#FDF2F4] text-[#F472B6] px-2 py-0.5 rounded-full"
                >
                  💡 {tip}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
