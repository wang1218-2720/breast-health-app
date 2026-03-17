import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'

const MENSTRUAL_OPTIONS = ['规律', '不规律', '绝经', '孕期', '哺乳期']
const FERTILITY_OPTIONS = ['未生育', '1胎1产', '1胎2产', '2胎及以上', '仅哺乳史']
const PAST_HISTORY_OPTIONS = ['无明显病史', '乳腺增生', '结节', '手术史', '其他']

const Profile = () => {
  const { user, updateUser, logout } = useUser()
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    nickname: '',
    age: 0,
    menstrualStatus: '',
    height: 0,
    weight: 0,
    fertilityHistory: '',
    pastMedicalHistory: '',
    surgeryDetail: '',
  })

  useEffect(() => {
    if (user) {
      setFormData({
        nickname: user.nickname || '',
        age: user.age || 0,
        menstrualStatus: user.menstrualStatus || '',
        height: user.height || 0,
        weight: user.weight || 0,
        fertilityHistory: user.fertilityHistory || '',
        pastMedicalHistory: user.pastMedicalHistory || '',
        surgeryDetail:
          user.pastMedicalHistory && user.pastMedicalHistory.startsWith('手术史：')
            ? user.pastMedicalHistory.replace('手术史：', '')
            : '',
      })
    }
  }, [user])

  const handleSave = () => {
    const pastMedical =
      formData.pastMedicalHistory === '手术史' && formData.surgeryDetail
        ? `手术史：${formData.surgeryDetail}`
        : formData.pastMedicalHistory

    updateUser({
      nickname: formData.nickname,
      age: formData.age,
      menstrualStatus: formData.menstrualStatus,
      height: formData.height,
      weight: formData.weight,
      fertilityHistory: formData.fertilityHistory,
      pastMedicalHistory: pastMedical,
    })
    setIsEditing(false)
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  if (!user) {
    return (
      <div className="px-4 pt-4 pb-6">
        <p className="text-center text-gray-500">请先登录</p>
        <Link to="/login" className="block text-center text-pink-500 mt-2">去登录</Link>
      </div>
    )
  }

  return (
    <div className="px-4 pt-4 pb-6">
      <h1 className="text-xl font-bold text-gray-800 mb-6">个人中心</h1>

      <section
        className="bg-cover bg-center bg-no-repeat rounded-2xl p-4 shadow-sm border border-pink-100 mb-6"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.45), rgba(255,255,255,0.45)), url('/knowledge-card-bg.png')",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-gray-600">用户信息</h2>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-pink-500 text-sm"
          >
            {isEditing ? '取消' : '编辑'}
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500">昵称</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-pink-200 focus:border-pink-400 outline-none"
              />
            ) : (
              <p className="text-gray-800">{user.nickname || '未设置'}</p>
            )}
          </div>

          <div>
            <label className="text-xs text-gray-500">邮箱</label>
            <p className="text-gray-800">{user.email}</p>
          </div>

          <div>
            <label className="text-xs text-gray-500">年龄</label>
            {isEditing ? (
              <input
                type="number"
                value={formData.age || ''}
                onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-pink-200 focus:border-pink-400 outline-none"
              />
            ) : (
              <p className="text-gray-800">{user.age ? `${user.age}岁` : '未设置'}</p>
            )}
          </div>

          <div>
            <label className="text-xs text-gray-500">月经状态</label>
            {isEditing ? (
              <select
                value={formData.menstrualStatus}
                onChange={(e) => setFormData({ ...formData, menstrualStatus: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-pink-200 focus:border-pink-400 outline-none bg-white"
              >
                <option value="">请选择</option>
                {MENSTRUAL_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <p className="text-gray-800">{user.menstrualStatus || '未设置'}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">身高 (cm)</label>
              {isEditing ? (
                <input
                  type="number"
                  value={formData.height || ''}
                  onChange={(e) => setFormData({ ...formData, height: Number(e.target.value) })}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-pink-200 focus:border-pink-400 outline-none"
                />
              ) : (
                <p className="text-gray-800">{user.height || '未设置'}</p>
              )}
            </div>
            <div>
              <label className="text-xs text-gray-500">体重 (kg)</label>
              {isEditing ? (
                <input
                  type="number"
                  value={formData.weight || ''}
                  onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-pink-200 focus:border-pink-400 outline-none"
                />
              ) : (
                <p className="text-gray-800">{user.weight || '未设置'}</p>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500">生育史（可选）</label>
            {isEditing ? (
              <div className="mt-1 flex flex-wrap gap-2">
                {FERTILITY_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setFormData({ ...formData, fertilityHistory: opt })}
                    className={`px-3 py-1.5 rounded-full border text-xs md:text-sm transition ${
                      formData.fertilityHistory === opt
                        ? 'bg-pink-50 border-pink-400 text-pink-600'
                        : 'border-pink-100 text-gray-600 hover:border-pink-300'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-800">{user.fertilityHistory || '未设置'}</p>
            )}
          </div>

          <div>
            <label className="text-xs text-gray-500">既往病史（可选）</label>
            {isEditing ? (
              <div className="mt-1">
                <select
                  value={formData.pastMedicalHistory}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pastMedicalHistory: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-pink-200 focus:border-pink-400 outline-none bg-white text-sm"
                >
                  <option value="">请选择既往病史</option>
                  {PAST_HISTORY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                {formData.pastMedicalHistory === '手术史' && (
                  <textarea
                    placeholder="请填写具体的手术名称和时间等信息"
                    value={formData.surgeryDetail}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        surgeryDetail: e.target.value,
                      })
                    }
                    className="w-full mt-2 px-3 py-2 rounded-lg border border-pink-200 focus:border-pink-400 outline-none resize-none min-h-[72px] text-sm"
                  />
                )}
              </div>
            ) : (
              <p className="text-gray-800 whitespace-pre-line">
                {user.pastMedicalHistory || '未设置'}
              </p>
            )}
          </div>

          {isEditing && (
            <button
              onClick={handleSave}
              className="w-full py-2.5 rounded-xl bg-pink-500 text-white font-medium mt-2"
            >
              保存
            </button>
          )}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-gray-600 mb-2">设置</h2>
        <Link
          to="/app/profile/privacy"
          className="block w-full py-3 px-4 rounded-xl bg-cover bg-center bg-no-repeat border border-gray-200 shadow-sm hover:border-pink-200 transition"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.45), rgba(255,255,255,0.45)), url('/knowledge-card-bg.png')",
          }}
        >
          <span className="text-gray-800">隐私设置</span>
          <span className="float-right text-gray-400">→</span>
        </Link>
      </section>

      <section className="mt-6 space-y-2">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full py-3 px-4 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition text-sm font-medium"
        >
          退出登录
        </button>
        <p className="text-xs text-gray-500 mt-2 text-center">
          注销后数据将无法恢复，请谨慎操作
        </p>
      </section>
    </div>
  )
}

export default Profile
