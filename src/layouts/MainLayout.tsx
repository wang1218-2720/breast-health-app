import { Outlet, NavLink } from 'react-router-dom'
import LaibaoAssistant from '../components/LaibaoAssistant'

const navItems = [
  { to: '/app/dashboard', label: '首页', icon: '🏠' },
  { to: '/app/daily-log', label: '记录', icon: '📝' },
  { to: '/app/reports', label: '报告', icon: '📊' },
  { to: '/app/profile', label: '我的', icon: '👤' },
]

const MainLayout = () => {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-gray-50 flex flex-col relative">
      <main className="flex-1 overflow-auto pb-20 pb-safe">
        <Outlet />
      </main>

      {/* 底部导航栏 - 移动端适配 */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 pb-safe">
        <div className="flex justify-around items-center py-2 px-2 max-w-lg mx-auto">
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/app/dashboard'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center min-w-[64px] py-2 px-3 rounded-lg transition-colors ${
                  isActive
                    ? 'text-pink-500 font-medium'
                    : 'text-gray-400 hover:text-gray-600'
                }`
              }
            >
              <span className="text-lg leading-none mb-1">{icon}</span>
              <span className="text-xs">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
      {/* 右侧莱宝 AI 小助手（桌面端） */}
      <LaibaoAssistant />
    </div>
  )
}

export default MainLayout
