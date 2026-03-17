import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'

type AuthMode = 'login' | 'register'

const MENSTRUAL_OPTIONS = ['规律', '不规律', '绝经', '孕期', '哺乳期']
const FERTILITY_OPTIONS = ['未生育', '1胎1产', '1胎2产', '2胎及以上', '仅哺乳史']
const PAST_HISTORY_OPTIONS = ['无明显病史', '乳腺增生', '结节', '手术史', '其他']

const Login = () => {
  const [mode, setMode] = useState<AuthMode>('login')
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false)
  const [email, setEmail] = useState('')
  const navigate = useNavigate()
  const { login } = useUser()

  const [profileData, setProfileData] = useState({
    nickname: '',
    age: 0,
    menstrualStatus: '',
    height: 0,
    weight: 0,
    fertilityHistory: '',
    pastMedicalHistory: '',
    surgeryDetail: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === 'register') {
      setAgreedToPrivacy(false)
      setShowPrivacyModal(true)
      return
    }
    login(email)
    navigate('/app/dashboard')
  }

  const handleAgreeAndContinue = () => {
    if (!agreedToPrivacy) return
    setShowPrivacyModal(false)
    setShowProfileModal(true)
  }

  const handleProfileComplete = () => {
    const pastMedical =
      profileData.pastMedicalHistory === '手术史' && profileData.surgeryDetail
        ? `手术史：${profileData.surgeryDetail}`
        : profileData.pastMedicalHistory

    login(
      email, 
      profileData.nickname || email.split('@')[0], 
      {
        age: profileData.age,
        menstrualStatus: profileData.menstrualStatus,
        height: profileData.height,
        weight: profileData.weight,
        fertilityHistory: profileData.fertilityHistory,
        pastMedicalHistory: pastMedical,
      }
    )
    setShowProfileModal(false)
    setAgreedToPrivacy(false)
    navigate('/app/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 pb-safe" style={{ backgroundImage: 'url(/landing-bg.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="absolute inset-0 bg-white/30"></div>
      <div className="w-full max-w-sm relative">
        <div className="flex flex-col items-center mb-8 gap-3">
          <img
            src="/logo.png"
            alt="舒汝日记"
            className="h-16 w-16 object-contain rounded-full bg-white p-1.5"
          />
          <span className="text-xl font-bold text-pink-600">舒汝日记</span>
        </div>

        {/* 登录/注册切换 */}
        <div className="flex rounded-xl bg-pink-100/60 p-1 mb-6">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              mode === 'login'
                ? 'bg-white text-pink-600 shadow-sm'
                : 'text-pink-600/70'
            }`}
          >
            登录
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              mode === 'register'
                ? 'bg-white text-pink-600 shadow-sm'
                : 'text-pink-600/70'
            }`}
          >
            注册
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="邮箱"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-pink-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 outline-none transition"
            required
          />
          <input
            type="password"
            placeholder="密码"
            className="w-full px-4 py-3 rounded-xl border border-pink-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 outline-none transition"
            required
          />
          {mode === 'register' && (
            <input
              type="password"
              placeholder="确认密码"
              className="w-full px-4 py-3 rounded-xl border border-pink-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 outline-none transition"
              required
            />
          )}
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-pink-500 text-white font-medium hover:bg-pink-600 active:scale-[0.98] transition"
          >
            {mode === 'login' ? '登录' : '注册'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          {mode === 'login' ? '还没有账号？' : '已有账号？'}
          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="ml-1 text-pink-600 font-medium"
          >
            {mode === 'login' ? '去注册' : '去登录'}
          </button>
        </p>
      </div>

      {/* 隐私协议弹窗 */}
      {showPrivacyModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="privacy-modal-title"
        >
          {/* 遮罩层 */}
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowPrivacyModal(false)
              setAgreedToPrivacy(false)
            }}
            aria-label="关闭"
          />

          {/* 弹窗内容 */}
          <div
            className="relative w-full max-w-lg max-h-[85vh] sm:max-h-[80vh] flex flex-col rounded-t-2xl sm:rounded-2xl bg-white/95 bg-cover bg-center bg-no-repeat shadow-xl overflow-hidden"
            style={{ backgroundImage: "url('/dashboard-card-bg.png')" }}
          >
            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
              <h2
                id="privacy-modal-title"
                className="text-lg font-bold text-gray-800 mb-4"
              >
                隐私协议摘要
              </h2>

              <div className="space-y-4 text-sm text-gray-600">
                <section>
                  <h3 className="font-medium text-gray-800 mb-1">一、数据收集</h3>
                  <p>
                    我们仅收集为您提供服务所必需的健康记录数据，包括但不限于：每日身体状况记录、疼痛位置、情绪状态、饮食习惯等。您在使用过程中主动填写的信息将作为健康档案保存。
                  </p>
                </section>
                <section>
                  <h3 className="font-medium text-gray-800 mb-1">二、数据使用</h3>
                  <p>
                    您的数据仅用于为您提供健康记录和分析服务。我们不会将您的个人健康信息用于广告推送或任何商业目的。
                  </p>
                </section>
                <section>
                  <h3 className="font-medium text-gray-800 mb-1">三、数据保护</h3>
                  <p>
                    我们采用行业标准的加密技术（SSL/TLS）保护您的数据传输安全，并在服务器端对存储的数据进行加密处理，防止未经授权的访问。
                  </p>
                </section>
                <section>
                  <h3 className="font-medium text-gray-800 mb-1">四、数据共享</h3>
                  <p>
                    未经您明确同意，我们不会向任何第三方出售、出租或共享您的个人健康信息。法律法规另有规定的除外。
                  </p>
                </section>
                <section>
                  <h3 className="font-medium text-gray-800 mb-1">五、用户权利</h3>
                  <p>
                    您有权随时查询、导出、更正和删除您的个人数据。如需行使上述权利，请前往「个人中心」-「隐私设置」进行操作。
                  </p>
                </section>
                <section>
                  <h3 className="font-medium text-gray-800 mb-1">六、注销说明</h3>
                  <p>
                    您可随时申请注销账号。注销后，我们将在30个工作日内删除您的账户及所有关联数据，且无法恢复，请谨慎操作。
                  </p>
                </section>
                <section>
                  <h3 className="font-medium text-gray-800 mb-1">七、未成年人保护</h3>
                  <p>
                    本服务面向成年用户。如您未满18周岁，请在监护人指导下使用本服务或咨询医疗专业人士。
                  </p>
                </section>
                <section>
                  <h3 className="font-medium text-gray-800 mb-1">八、联系我们</h3>
                  <p>
                    如对本政策有任何疑问，请通过应用内「联系我们」功能与我们取得联系。我们将尽快为您解答。
                  </p>
                </section>
              </div>

            </div>

            <div className="flex-shrink-0 p-4 sm:p-5 border-t border-gray-100 bg-gray-50/80 space-y-4">
              <button
                type="button"
                onClick={() => setShowPrivacyModal(true)}
                className="block text-center text-pink-600 text-sm font-medium hover:underline"
              >
                查看完整协议
              </button>
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreedToPrivacy}
                  onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-pink-500 focus:ring-pink-400"
                />
                <span className="text-sm text-gray-700">
                  我已阅读并同意
                  <button
                    type="button"
                    onClick={() => setShowPrivacyModal(true)}
                    className="text-pink-600 hover:underline mx-0.5"
                  >
                    《隐私协议》
                  </button>
                </span>
              </label>
              <button
                type="button"
                disabled={!agreedToPrivacy}
                onClick={handleAgreeAndContinue}
                className="w-full py-3 rounded-xl font-medium transition disabled:opacity-50 disabled:cursor-not-allowed bg-pink-500 text-white hover:bg-pink-600 active:scale-[0.98] disabled:active:scale-100"
              >
                同意并继续
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 完善个人资料弹窗 */}
      {showProfileModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowProfileModal(false)
              setAgreedToPrivacy(false)
            }}
          />

          <div
            className="relative w-full max-w-lg max-h-[85vh] sm:max-h-[80vh] flex flex-col rounded-t-2xl sm:rounded-2xl bg-white/95 bg-cover bg-center bg-no-repeat shadow-xl overflow-hidden"
            style={{ backgroundImage: "url('/dashboard-card-bg.png')" }}
          >
            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-2 text-center">
                完善个人资料
              </h2>
              <p className="text-sm text-gray-500 text-center mb-6">
                填写基本信息，获得更精准的健康分析
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">昵称（选填）</label>
                  <input
                    type="text"
                    placeholder="请输入昵称"
                    value={profileData.nickname}
                    onChange={(e) => setProfileData({ ...profileData, nickname: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-pink-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">年龄</label>
                  <input
                    type="number"
                    placeholder="请输入年龄"
                    value={profileData.age || ''}
                    onChange={(e) => setProfileData({ ...profileData, age: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-pink-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">月经状态</label>
                  <select
                    value={profileData.menstrualStatus}
                    onChange={(e) => setProfileData({ ...profileData, menstrualStatus: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-pink-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 outline-none transition bg-white"
                  >
                    <option value="">请选择月经状态</option>
                    {MENSTRUAL_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">身高（cm，选填）</label>
                    <input
                      type="number"
                      placeholder="请输入身高"
                      value={profileData.height || ''}
                      onChange={(e) => setProfileData({ ...profileData, height: Number(e.target.value) })}
                      className="w-full px-4 py-3 rounded-xl border border-pink-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">体重（kg，选填）</label>
                    <input
                      type="number"
                      placeholder="请输入体重"
                      value={profileData.weight || ''}
                      onChange={(e) => setProfileData({ ...profileData, weight: Number(e.target.value) })}
                      className="w-full px-4 py-3 rounded-xl border border-pink-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">生育史（可选）</label>
                  <div className="flex flex-wrap gap-2">
                    {FERTILITY_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setProfileData({ ...profileData, fertilityHistory: opt })}
                        className={`px-3 py-1.5 rounded-full border text-sm transition ${
                          profileData.fertilityHistory === opt
                            ? 'bg-pink-50 border-pink-400 text-pink-600'
                            : 'border-pink-100 text-gray-600 hover:border-pink-300'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">既往病史（可选）</label>
                  <select
                    value={profileData.pastMedicalHistory}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        pastMedicalHistory: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-pink-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 outline-none transition bg-white"
                  >
                    <option value="">请选择既往病史</option>
                    {PAST_HISTORY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  {profileData.pastMedicalHistory === '手术史' && (
                    <textarea
                      placeholder="请填写具体的手术名称和时间等信息"
                      value={profileData.surgeryDetail}
                      onChange={(e) =>
                        setProfileData({ ...profileData, surgeryDetail: e.target.value })
                      }
                      className="w-full mt-2 px-4 py-3 rounded-xl border border-pink-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 outline-none transition resize-none min-h-[72px]"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 p-4 sm:p-5 border-t border-gray-100 bg-gray-50/80">
              <button
                type="button"
                onClick={handleProfileComplete}
                className="w-full py-3 rounded-xl font-medium bg-pink-500 text-white hover:bg-pink-600 active:scale-[0.98] transition"
              >
                完成注册
              </button>
              <button
                type="button"
                onClick={() => {
                  login(email, profileData.nickname || email.split('@')[0])
                  setShowProfileModal(false)
                  setAgreedToPrivacy(false)
                  navigate('/app/dashboard')
                }}
                className="w-full py-2 mt-2 text-sm text-gray-500 hover:text-gray-700"
              >
                跳过
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Login
