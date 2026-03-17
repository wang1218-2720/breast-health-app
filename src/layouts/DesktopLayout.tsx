import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import LaibaoAssistant from '../components/LaibaoAssistant'

export default function DesktopLayout() {
  return (
    <div className="min-h-screen flex bg-[#FDF2F4] relative">
      <Sidebar />
      <main className="flex-1 overflow-auto min-w-0">
        <Outlet />
      </main>
      {/* 右侧奶宝 AI 小助手（桌面端） */}
      <LaibaoAssistant />
    </div>
  )
}
