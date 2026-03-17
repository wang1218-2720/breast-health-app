import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useUser } from '../context/UserContext'

const Privacy = () => {
  const navigate = useNavigate()
  const { logout } = useUser()
  const [showFaq, setShowFaq] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleDeleteAccount = () => {
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = () => {
    // 删除本地所有与用户相关的数据（不可逆）
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key) continue
      if (key === 'user-info' || key === 'daily-log' || key.startsWith('daily-log-')) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k))
    logout()
    setShowDeleteConfirm(false)
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-[#FDF2F4] px-4 pt-4 pb-10 md:px-8">
      <div className="flex items-center gap-2 mb-6">
        <Link to="/app/profile" className="text-sm text-[#F472B6] hover:underline">
          ← 返回个人中心
        </Link>
      </div>

      <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">隐私与数据管理</h1>
      <p className="text-sm text-gray-500 mb-6">
        您可以在这里管理自己的隐私偏好、数据使用方式，以及一键清除所有记录。
      </p>

      {/* 数据与隐私说明 */}
      <section
        className="bg-white/90 bg-cover bg-center bg-no-repeat rounded-2xl shadow-lg shadow-pink-100/40 border border-[#FCE7E9] p-5 mb-6 space-y-3"
        style={{ backgroundImage: "url('/dashboard-card-bg.png')" }}
      >
        <h2 className="text-sm font-semibold text-gray-700">数据安全承诺</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          「舒汝日记」只在本设备本浏览器中存储您的健康记录和个人资料，用于生成趋势图和健康报告。我们不会将数据用于广告推送，也不会在未授权的情况下分享给第三方。
        </p>
        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
          <li>记录数据仅用于本产品内的趋势分析与报告展示。</li>
          <li>您可以随时导出、删除或注销账号，所有操作均在本地立即生效。</li>
          <li>详细说明请查看登录/注册时展示的《隐私政策》。</li>
        </ul>
      </section>

      {/* 管理数据 */}
      <section
        className="bg-white/90 bg-cover bg-center bg-no-repeat rounded-2xl shadow-lg shadow-pink-100/40 border border-[#FCE7E9] p-5 mb-6 space-y-4"
        style={{ backgroundImage: "url('/dashboard-card-bg.png')" }}
      >
        <h2 className="text-sm font-semibold text-gray-700">管理我的数据</h2>
        <p className="text-xs text-gray-500">
          下面的操作会影响到您的个人资料、每日记录和历史报告，请在操作前仔细确认。
        </p>

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleDeleteAccount}
            className="w-full py-3 px-4 rounded-xl border border-red-200 text-red-600 bg-red-50/40 hover:bg-red-50 text-sm font-medium flex items-center justify-between"
          >
            <span>注销账号并删除全部数据</span>
            <span className="text-xs text-red-500">不可恢复</span>
          </button>
          <p className="text-xs text-gray-500">
            该操作会删除个人资料以及所有以 <code className="px-1 rounded bg-gray-100 text-[10px]">daily-log-YYYY-MM-DD</code>{' '}
            为前缀的本地记录，同时退出当前账号。
          </p>
        </div>
      </section>

      {/* 使用帮助 / 常见问题 */}
      <section
        className="bg-white/90 bg-cover bg-center bg-no-repeat rounded-2xl shadow-lg shadow-pink-100/40 border border-[#FCE7E9] p-5 space-y-4"
        style={{ backgroundImage: "url('/dashboard-card-bg.png')" }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">使用帮助 & 常见问题</h2>
          <button
            type="button"
            onClick={() => setShowFaq((v) => !v)}
            className="text-xs text-[#F472B6] hover:underline"
          >
            {showFaq ? '收起' : '查看使用帮助'}
          </button>
        </div>

        {showFaq && (
          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <p className="font-medium">Q1：我每天都要记录吗？忘记记录怎么办？</p>
              <p className="mt-1 text-gray-600">
                建议每天固定时间记录，这样数据最完整。如果某天忘记，第二天可以补录（日期可选择）。但补录可能影响分析的准确性，建议尽量当天记录。
              </p>
            </div>
            <div>
              <p className="font-medium">Q2：我的数据安全吗？会不会泄露？</p>
              <p className="mt-1 text-gray-600">
                我们非常重视您的隐私。所有数据传输采用 HTTPS 加密，敏感信息在数据库中是加密存储的。您拥有完全控制权，可随时导出或注销账号。详细措施请阅读《隐私政策》。
              </p>
            </div>
            <div>
              <p className="font-medium">Q3：生成的报告医生认可吗？</p>
              <p className="mt-1 text-gray-600">
                报告采用医疗领域通用的 VAS 评分、趋势图表等表达方式。您就诊时可出示 PDF 报告，帮助医生快速了解您的病情全貌。但请注意，报告仅供参考，不能替代医疗诊断。
              </p>
            </div>
            <div>
              <p className="font-medium">Q4：饮食和运动建议适合所有人吗？</p>
              <p className="mt-1 text-gray-600">
                建议基于普遍医学共识，但个体差异存在。您可根据自身情况尝试，如发现不适请停止并咨询医生。平台不提供个性化医疗建议。
              </p>
            </div>
            <div>
              <p className="font-medium">Q5：我可以把数据给医生看吗？</p>
              <p className="mt-1 text-gray-600">
                当然可以。您可以通过导出 PDF 报告，在就诊时提供给医生，帮助其更全面地了解您的日常情况。
              </p>
            </div>
          </div>
        )}
      </section>

      {/* 注销二次确认弹窗 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div
            className="w-full max-w-md mx-4 rounded-2xl bg-white/95 bg-cover bg-center bg-no-repeat p-6 shadow-xl"
            style={{ backgroundImage: "url('/dashboard-card-bg.png')" }}
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-2">确认要注销账号吗？</h3>
            <p className="text-sm text-gray-600 mb-3">
              此操作将<strong className="text-red-500">彻底删除</strong>您的个人资料和所有历史记录（包括每日记录、疼痛数据和报告统计），且无法恢复。
            </p>
            <p className="text-xs text-gray-500 mb-4">
              如果只是暂时停止使用，您也可以保留账号而不进行记录；仅在确认完全不再使用本产品时再执行注销。
            </p>
            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
              >
                我再想想
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600"
              >
                确认注销并删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Privacy
