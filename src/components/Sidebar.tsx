import { NavLink, Link } from 'react-router-dom'
import { useUser } from '../context/UserContext'

const NAV_ITEMS = [
  { to: '/app/dashboard', label: '首页', icon: '🏠' },
  { to: '/app/daily-log', label: '每日记录', icon: '📝' },
  { to: '/app/reports', label: '健康报告', icon: '📊' },
  { to: '/app/knowledge', label: '知识科普', icon: '📚' },
  { to: '/app/profile', label: '个人中心', icon: '👤' },
]

export default function Sidebar() {
  const { user } = useUser()
  
  return (
    <aside
      className="w-[280px] flex-shrink-0 h-screen sticky top-0 flex flex-col border-r border-[#FCE7E9] shadow-sm bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/sidebar-bg-rose.jpg')" }}
    >
      {/* Logo + Slogan */}
      <div className="p-6 border-b border-[#FCE7E9]">
        <div className="flex items-center gap-3 mb-2">
          <img
            src="/logo.png"
            alt="舒汝日记"
            className="h-12 w-12 object-contain rounded-full bg-white p-1"
          />
          <h1 className="text-xl font-bold text-[#F472B6]">舒汝日记</h1>
        </div>
        <p className="text-xs text-gray-500">温柔呵护 · 科学记录</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {NAV_ITEMS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/app/dashboard'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 transition-colors ${
                isActive
                  ? 'bg-[#FDF2F4] text-[#F472B6] font-medium border border-[#FCE7E9]'
                  : 'hover:bg-[#FDF2F4] hover:text-[#F472B6]'
              }`
            }
          >
            <span className="text-lg">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User card */}
      <div className="p-4 border-t border-[#FCE7E9]">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FDF2F4] border border-[#FCE7E9]">
          <div className="w-10 h-10 rounded-full bg-[#FBC4D0] flex items-center justify-center text-[#F472B6] text-lg">
            👤
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-700 truncate">{user?.nickname || '用户'}</p>
            <Link
              to="/app/profile"
              className="text-xs text-[#F472B6] hover:underline"
            >
              查看资料
            </Link>
          </div>
        </div>
      </div>
    </aside>
  )
}
