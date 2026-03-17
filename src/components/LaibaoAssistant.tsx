import { useState, useRef, useCallback, useEffect } from 'react'
import { type PointerEvent as ReactPointerEvent } from 'react'
import { chatWithLaibaoConversation, type LaibaoChatMessage } from '../services/deepseek'

export default function LaibaoAssistant() {
  const [messages, setMessages] = useState<LaibaoChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const dragRef = useRef({ startX: 0, startY: 0, startLeft: 0, startTop: 0, moved: false })
  const listRef = useRef<HTMLDivElement | null>(null)

  const handlePointerDown = useCallback(
    (e: ReactPointerEvent) => {
      setIsDragging(true)
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startLeft: position.x,
        startTop: position.y,
        moved: false,
      }
    },
    [position]
  )

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent) => {
      if (!isDragging) return
      const dx = e.clientX - dragRef.current.startX
      const dy = e.clientY - dragRef.current.startY
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) dragRef.current.moved = true
      setPosition({
        x: dragRef.current.startLeft + dx,
        y: dragRef.current.startTop + dy,
      })
    },
    [isDragging]
  )

  const handlePointerUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleClick = () => {
    if (dragRef.current.moved) {
      dragRef.current.moved = false
      return
    }
    // 第一次点击：打开气泡并发送欢迎语
    if (!isOpen) {
      setIsOpen(true)
      if (messages.length === 0) {
        setMessages([{ role: 'assistant', content: '我是你的AI小助手奶宝，有什么想和我说的吗？' }])
      }
      return
    }
    // 再次点击：关闭对话框（保留历史，下次打开还能看到）
    setIsOpen(false)
  }

  const style: React.CSSProperties = {
    transform: `translate(${position.x}px, ${position.y}px)`,
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    const userMsg: LaibaoChatMessage = { role: 'user', content: input.trim() }
    const history = [...messages, userMsg]
    setMessages(history)
    setInput('')
    setIsLoading(true)
    try {
      const reply = await chatWithLaibaoConversation(history)
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '奶宝这会儿有点忙，稍后再试试哦~' },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!isOpen) return
    const el = listRef.current
    if (!el) return
    // 延迟一点等内容渲染完成再滚动
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight
    })
  }, [messages, isOpen])

  return (
    <div
      className="hidden lg:flex fixed right-6 top-1/3 z-40 flex-col items-center gap-2"
      style={style}
    >
      <button
        type="button"
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="cursor-grab active:cursor-grabbing focus:outline-none select-none"
        style={{ touchAction: 'none' }}
      >
        {/* 仅 IP 形象，略微放大；立体感：多层阴影 + 轻微 3D 倾斜 */}
        <div
          className="relative transition-transform duration-200 hover:scale-115"
          style={{
            transform: 'perspective(450px) rotateY(-6deg) rotateX(3deg)',
            filter:
              'drop-shadow(0 12px 24px rgba(244,114,182,0.45)) drop-shadow(0 6px 12px rgba(0,0,0,0.12))',
          }}
        >
          <img
            src="/laibao.png"
            alt="AI小助手奶宝"
            className="h-32 w-28 object-contain pointer-events-none"
            draggable={false}
          />
        </div>
      </button>

      {isOpen && (
        <div
          className="w-[340px] rounded-2xl bg-white/95 bg-cover bg-center bg-no-repeat border border-pink-100 shadow-xl shadow-pink-100/70 px-4 py-3 text-sm text-gray-700 flex flex-col gap-3"
          style={{ backgroundImage: "url('/dashboard-card-bg.png')" }}
        >
          <div
            ref={listRef}
            className="max-h-56 overflow-y-auto space-y-2 pr-1.5"
          >
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`inline-block max-w-[85%] px-3 py-2 rounded-2xl leading-relaxed text-sm ${
                    m.role === 'user'
                      ? 'bg-pink-500 text-white rounded-br-sm'
                      : 'bg-pink-50 text-gray-700 rounded-bl-sm'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="text-xs text-pink-400 mt-1">奶宝思考中...</div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="和奶宝聊聊今天的感受…"
              className="flex-1 px-3 py-2.5 rounded-xl border border-pink-100 focus:border-pink-400 focus:ring-1 focus:ring-pink-300 outline-none text-sm"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={isLoading}
              className="px-3 py-2 rounded-xl bg-pink-500 text-white text-sm font-medium disabled:opacity-50"
            >
              发送
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
