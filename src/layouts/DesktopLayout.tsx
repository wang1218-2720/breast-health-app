import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import LaibaoAssistant from '../components/LaibaoAssistant'

export default function DesktopLayout() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#FDF2F4] relative">
      <Sidebar />
      <main className="flex-1 overflow-auto min-w-0 pb-20 md:pb-0 pt-safe max-w-[100vw] scroll-smooth">
        <Outlet />
      </main>
      {/* 右侧奶宝 AI 小助手（桌面端显示，移动端可保留或在小屏隐藏） */}
      <LaibaoAssistant />
    </div>
  )
}
