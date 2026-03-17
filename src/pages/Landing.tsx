import { useState } from 'react'
import { Link } from 'react-router-dom'
import LaibaoAssistant from '../components/LaibaoAssistant'

export default function Landing() {
  const [showAgreementModal, setShowAgreementModal] = useState(false)

  return (
    <div className="min-h-screen bg-white font-sans antialiased relative" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>
      {/* ========== 导航栏 ========== */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-[#FCE7E9]">
        <div className="max-w-[1200px] mx-auto px-5 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="舒汝日记"
              className="h-12 w-12 object-contain rounded-full bg-white p-1"
            />
            <span className="text-2xl font-bold text-[#F472B6]">舒汝日记</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-[#4A5568] text-sm font-medium">
            <a href="#features" className="hover:text-[#F472B6] transition">首页</a>
            <a href="#about" className="hover:text-[#F472B6] transition">关于我们</a>
            <a href="#how" className="hover:text-[#F472B6] transition">我们的工作</a>
            <a href="#contact" className="hover:text-[#F472B6] transition">联系我们</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 rounded-2xl border-2 border-[#F472B6] text-[#F472B6] text-sm font-medium hover:bg-[#FDF2F4] transition"
            >
              登录
            </Link>
            <Link
              to="/login"
              className="px-4 py-2 rounded-2xl bg-[#F472B6] text-white text-sm font-medium hover:bg-[#EC4899] transition shadow-md shadow-pink-200/50"
            >
              注册
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ========== Hero 区 ========== */}
        <section className="relative max-w-[1200px] mx-auto px-5 py-16 md:py-24 overflow-hidden" style={{ backgroundImage: 'url(/landing-bg.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <div className="absolute inset-0 bg-white/70"></div>
          <div className="relative z-10 max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold text-[#2D3748] leading-tight">
              温柔呵护 · 科学记录
            </h1>
            <p className="mt-6 text-lg md:text-xl text-[#4A5568] leading-relaxed max-w-xl">
              专为乳房健康设计的智能日记，让每一份记录都成为呵护自己的礼物
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-8 py-4 rounded-[28px] bg-[#F472B6] text-white font-semibold text-base hover:bg-[#EC4899] transition shadow-lg shadow-pink-200/40"
              >
                开始记录
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center px-8 py-4 rounded-[28px] border-2 border-[#F472B6] text-[#F472B6] font-semibold text-base hover:bg-[#FDF2F4] transition"
              >
                了解更多
              </a>
            </div>
          </div>
        </section>

        {/* ========== 功能亮点区 ========== */}
        <section id="features" className="bg-[#FFF9F9] py-16 md:py-20">
          <div className="max-w-[1200px] mx-auto px-5">
            <h2 className="text-3xl font-bold text-[#2D3748] text-center mb-4">如何帮助您</h2>
            <p className="text-[#718096] text-center max-w-xl mx-auto mb-12">
              智能记录与专业报告，让健康管理更简单
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 卡片1 */}
              <div
                className="bg-white/90 bg-cover bg-center bg-no-repeat rounded-[24px] p-8 shadow-lg shadow-pink-100/30 border border-[#FFE8F0] hover:shadow-xl transition-all"
                style={{ backgroundImage: "url('/dashboard-card-bg.png')" }}
              >
                <div className="text-4xl mb-4">📝</div>
                <h3 className="text-xl font-bold text-[#2D3748] mb-2">智能日记</h3>
                <p className="text-[#4A5568] text-sm leading-relaxed">
                  每日记录疼痛、情绪、饮食，轻松追踪健康趋势
                </p>
              </div>
              {/* 卡片2 */}
              <div
                className="bg-white/90 bg-cover bg-center bg-no-repeat rounded-[24px] p-8 shadow-lg shadow-pink-100/30 border border-[#FFE8F0] hover:shadow-xl transition-all"
                style={{ backgroundImage: "url('/dashboard-card-bg.png')" }}
              >
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-xl font-bold text-[#2D3748] mb-2">专业报告</h3>
                <p className="text-[#4A5568] text-sm leading-relaxed">
                  一键生成医生可读的健康报告，辅助诊疗
                </p>
              </div>
              {/* 卡片3 */}
              <div
                className="bg-white/90 bg-cover bg-center bg-no-repeat rounded-[24px] p-8 shadow-lg shadow-pink-100/30 border border-[#FFE8F0] hover:shadow-xl transition-all"
                style={{ backgroundImage: "url('/dashboard-card-bg.png')" }}
              >
                <div className="text-4xl mb-4">🔒</div>
                <h3 className="text-xl font-bold text-[#2D3748] mb-2">隐私安全</h3>
                <p className="text-[#4A5568] text-sm leading-relaxed">
                  数据加密存储，您拥有完全控制权
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========== 注册流程引导区 ========== */}
        <section id="how" className="bg-[#FFF9F9] py-16 md:py-20">
          <div className="max-w-[1200px] mx-auto px-5">
            <h2 className="text-3xl font-bold text-[#2D3748] text-center mb-2">简单三步，开启呵护之旅</h2>
            <p className="text-[#718096] text-center mb-12">How It Works?</p>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* 步骤1：注册账号 */}
              <div
                className="bg-white/90 bg-cover bg-center bg-no-repeat rounded-[28px] p-6 shadow-lg shadow-pink-100/20 border border-[#FCE7E9]"
                style={{ backgroundImage: "url('/dashboard-card-bg.png')" }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">📱</span>
                  <div>
                    <h3 className="text-lg font-bold text-[#2D3748]">注册/登录</h3>
                    <p className="text-xs text-[#718096]">输入手机号，获取验证码，设置密码</p>
                  </div>
                </div>
                <div className="space-y-3 pt-4 border-t border-[#FCE7E9]">
                  <div className="flex rounded-xl border border-[#FCE7E9] overflow-hidden">
                    <span className="px-3 py-2.5 bg-[#FDF2F4] text-[#718096] text-sm border-r border-[#FCE7E9]">+86</span>
                    <input type="text" placeholder="手机号" className="flex-1 px-3 py-2.5 text-sm outline-none placeholder:text-gray-400" readOnly aria-label="手机号" />
                  </div>
                  <div className="flex gap-2">
                    <input type="text" placeholder="验证码" className="flex-1 px-3 py-2.5 rounded-xl border border-[#FCE7E9] text-sm outline-none placeholder:text-gray-400" readOnly aria-label="验证码" />
                    <button type="button" className="px-3 py-2.5 rounded-xl bg-[#FDF2F4] text-[#F472B6] text-xs font-medium whitespace-nowrap">获取验证码</button>
                  </div>
                  <div className="relative">
                    <input type="password" placeholder="设置密码" className="w-full px-3 py-2.5 rounded-xl border border-[#FCE7E9] text-sm outline-none placeholder:text-gray-400" readOnly aria-label="密码" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm cursor-default" aria-hidden>👁</span>
                  </div>
                  <p className="text-[10px] text-[#718096]">密码强度：中等</p>
                  <Link to="/login" className="block w-full py-2.5 rounded-xl bg-[#F472B6] text-white text-sm font-medium text-center hover:bg-[#EC4899] transition">下一步</Link>
                </div>
              </div>

              {/* 步骤2：同意协议 */}
              <div
                className="bg-white/90 bg-cover bg-center bg-no-repeat rounded-[28px] p-6 shadow-lg shadow-pink-100/20 border border-[#FCE7E9] relative"
                style={{ backgroundImage: "url('/dashboard-card-bg.png')" }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">📄</span>
                  <div>
                    <h3 className="text-lg font-bold text-[#2D3748]">隐私协议</h3>
                    <p className="text-xs text-[#718096]">阅读并勾选同意《隐私政策》和《用户协议》</p>
                  </div>
                </div>
                <div className="space-y-3 pt-4 border-t border-[#FCE7E9]">
                  <div className="rounded-xl bg-[#FDF2F4] p-3 text-xs text-[#4A5568] space-y-1.5">
                    <p>🔒 数据加密存储</p>
                    <p>📋 不出售个人信息</p>
                    <p>🗑️ 随时注销删除</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAgreementModal(true)}
                    className="text-xs text-[#F472B6] hover:underline"
                  >
                    查看完整协议
                  </button>
                  <label className="flex items-center gap-2 text-sm text-[#4A5568] cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded border-[#F472B6] text-[#F472B6]" readOnly />
                    <span>我已阅读并同意</span>
                  </label>
                  <Link to="/login" className="block w-full py-2.5 rounded-xl bg-[#F472B6] text-white text-sm font-medium text-center hover:bg-[#EC4899] transition">同意并继续</Link>
                </div>
                {/* 协议弹窗示意 */}
                {showAgreementModal && (
                  <div
                    className="absolute inset-0 rounded-[28px] bg-white/95 bg-cover bg-center bg-no-repeat border-2 border-[#F472B6] shadow-xl z-10 p-4 flex flex-col"
                    style={{ backgroundImage: "url('/dashboard-card-bg.png')" }}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-bold text-[#2D3748]">隐私政策摘要</h4>
                      <button type="button" onClick={() => setShowAgreementModal(false)} className="text-[#718096] hover:text-[#F472B6] text-lg leading-none">×</button>
                    </div>
                    <div className="flex-1 overflow-auto text-xs text-[#4A5568] space-y-2">
                      <p>本产品重视您的隐私，我们会加密存储您的健康数据……</p>
                      <p>完整条款请参阅《隐私政策》与《用户协议》。</p>
                    </div>
                    <button type="button" onClick={() => setShowAgreementModal(false)} className="mt-3 py-2 rounded-xl bg-[#FDF2F4] text-[#F472B6] text-sm font-medium">关闭</button>
                  </div>
                )}
              </div>

              {/* 步骤3：填写档案 */}
              <div
                className="bg-white/90 bg-cover bg-center bg-no-repeat rounded-[28px] p-6 shadow-lg shadow-pink-100/20 border border-[#FCE7E9]"
                style={{ backgroundImage: "url('/dashboard-card-bg.png')" }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">👤</span>
                  <div>
                    <h3 className="text-lg font-bold text-[#2D3748]">基础信息</h3>
                    <p className="text-xs text-[#718096]">填写年龄、月经状态等，开启专属记录</p>
                  </div>
                </div>
                <div className="space-y-3 pt-4 border-t border-[#FCE7E9]">
                  <div>
                    <label className="block text-xs text-[#718096] mb-1">年龄</label>
                    <input type="text" placeholder="请选择或输入" className="w-full px-3 py-2.5 rounded-xl border border-[#FCE7E9] text-sm outline-none placeholder:text-gray-400" readOnly />
                  </div>
                  <div>
                    <label className="block text-xs text-[#718096] mb-1">月经状态</label>
                    <select className="w-full px-3 py-2.5 rounded-xl border border-[#FCE7E9] text-sm outline-none text-gray-500 bg-white" defaultValue="" disabled>
                      <option value="">规律 / 不规律 / 绝经 / 孕期 / 哺乳期</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-[#718096] mb-1">身高(cm)</label>
                      <input type="text" placeholder="选填" className="w-full px-3 py-2.5 rounded-xl border border-[#FCE7E9] text-sm outline-none placeholder:text-gray-400" readOnly />
                    </div>
                    <div>
                      <label className="block text-xs text-[#718096] mb-1">体重(kg)</label>
                      <input type="text" placeholder="选填" className="w-full px-3 py-2.5 rounded-xl border border-[#FCE7E9] text-sm outline-none placeholder:text-gray-400" readOnly />
                    </div>
                  </div>
                  <Link to="/login" className="block w-full py-2.5 rounded-xl bg-[#F472B6] text-white text-sm font-medium text-center hover:bg-[#EC4899] transition mt-2">完成注册</Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========== 行动号召区 ========== */}
        <section
          className="relative py-16 md:py-20"
          style={{
            backgroundImage: 'url(/cta-bg.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-white/70" />
          <div className="relative max-w-[1200px] mx-auto px-5 text-center py-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#2D3748] mb-4">
              准备好开始呵护自己了吗？
            </h2>
            <p className="text-[#4A5568] text-lg mb-10 max-w-xl mx-auto">
              加入舒汝日记，让每一次记录都更有意义
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-12 py-4 rounded-[32px] bg-white border-2 border-[#F472B6] text-[#F472B6] font-bold text-lg hover:bg-[#FDF2F4] transition shadow-lg"
            >
              立即注册
            </Link>
            <p className="mt-6 text-xs text-[#718096]">
              点击注册即表示同意《隐私政策》和《用户协议》
            </p>
          </div>
        </section>

        {/* ========== 页脚 ========== */}
        <footer id="contact" className="bg-white border-t border-[#FCE7E9] py-12">
          <div className="max-w-[1200px] mx-auto px-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-center gap-3">
                <img
                  src="/logo.png"
                  alt="舒汝日记"
                  className="h-10 w-10 object-contain rounded-full bg-white p-1"
                />
                <span className="text-sm text-[#718096] ml-2">© {new Date().getFullYear()} 版权所有</span>
              </div>
              <div className="flex flex-wrap gap-6 text-sm text-[#4A5568]">
                <a href="#about" className="hover:text-[#F472B6] transition">关于我们</a>
                <a href="#contact" className="hover:text-[#F472B6] transition">联系我们</a>
                <Link to="/profile/privacy" className="hover:text-[#F472B6] transition">隐私政策</Link>
                <a href="#" className="hover:text-[#F472B6] transition">用户协议</a>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-[#FCE7E9] flex justify-center gap-6">
              <span className="text-[#718096] text-sm">社交媒体：</span>
              <span className="w-8 h-8 rounded-full bg-[#FDF2F4] flex items-center justify-center text-sm text-[#718096]" title="微信">微</span>
              <span className="w-8 h-8 rounded-full bg-[#FDF2F4] flex items-center justify-center text-sm text-[#718096]" title="微博">博</span>
            </div>
          </div>
        </footer>
      </main>
      {/* 右侧奶宝 AI 小助手，仅桌面端显示 */}
      <LaibaoAssistant />
    </div>
  )
}
