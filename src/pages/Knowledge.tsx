import { useState, useCallback, useMemo } from 'react'
import KnowledgeCard from '../components/KnowledgeCard'
import { loadAllRecordsFromStorage } from '../lib/reportData'
import { getExpertArticle } from '../services/deepseek'
import { subDays } from 'date-fns'

// 饮食建议数据结构（便于后期接入 API）
export interface FoodCategory {
  id: string
  title: string
  description: string
  effect: 'positive' | 'caution' | 'avoid'
  icon: string
  research?: string
  tips?: string[]
}

const DIET_DATA: FoodCategory[] = [
  {
    id: 'fiber',
    title: '富含纤维的食物',
    description: '全谷物、蔬菜、水果等富含纤维的食物有助于调节体内雌激素水平，可能减轻乳房疼痛。',
    effect: 'positive',
    icon: '🥦',
    tips: ['每日摄入25-30克膳食纤维', '可选择燕麦、糙米、豆类'],
  },
  {
    id: 'vitamin-e',
    title: '维生素E丰富的食物',
    description: '坚果、种子、菠菜等富含维生素E，可能有助于缓解周期性乳房疼痛。',
    effect: 'positive',
    icon: '🌰',
    research: '研究表明维生素E可减轻经前乳房胀痛',
    tips: ['每日一小把坚果（约30克）', '可选择杏仁、葵花籽'],
  },
  {
    id: 'omega3',
    title: 'Omega-3脂肪酸',
    description: '深海鱼、亚麻籽、核桃等富含Omega-3，具有抗炎作用，可能减轻乳房不适。',
    effect: 'positive',
    icon: '🐟',
    tips: ['每周食用2-3次深海鱼', '可选三文鱼、沙丁鱼'],
  },
  {
    id: 'caffeine',
    title: '咖啡因',
    description: '咖啡、浓茶、可乐等含咖啡因饮品可能使部分女性乳房组织对激素变化更敏感，加重胀痛感。',
    effect: 'caution',
    icon: '☕',
    research: '部分研究显示减少咖啡因摄入可缓解乳房疼痛',
    tips: ['尝试无咖啡因咖啡', '每日咖啡不超过1杯'],
  },
  {
    id: 'high-salt',
    title: '高盐食物',
    description: '腌制食品、加工肉类等高盐食物可能导致水分滞留，加重乳房胀痛。',
    effect: 'caution',
    icon: '🧂',
    tips: ['经前一周减少盐分摄入', '选择新鲜食材代替加工食品'],
  },
  {
    id: 'high-fat',
    title: '高脂食物',
    description: '油炸食品、肥肉等高脂肪食物可能影响激素水平，建议适量摄入。',
    effect: 'caution',
    icon: '🍟',
    tips: ['选择蒸煮炖代替油炸', '控制每日油脂摄入量'],
  },
  {
    id: 'spicy',
    title: '辛辣食物',
    description: '部分女性反馈辛辣食物可能诱发或加重乳房不适，个体差异较大。',
    effect: 'caution',
    icon: '🌶️',
    tips: ['观察自身反应', '如有不适可暂时减少'],
  },
  {
    id: 'alcohol',
    title: '酒精',
    description: '酒精可能影响肝脏代谢雌激素的功能，建议限制或避免饮酒。',
    effect: 'avoid',
    icon: '🍷',
    research: '研究表明酒精摄入与乳腺疾病风险相关',
    tips: ['尽量不饮酒', '社交场合可选择无酒精饮品'],
  },
  {
    id: 'supplements',
    title: '含激素补品',
    description: '蜂王浆、雪蛤等含激素成分的补品可能影响内分泌，建议谨慎使用。',
    effect: 'avoid',
    icon: '⚠️',
    tips: ['使用前咨询医生', '选择正规渠道产品'],
  },
]

// 运动建议数据结构（便于后期接入 API）
export interface ExerciseCategory {
  id: string
  title: string
  description: string
  effect: 'recommended' | 'avoid'
  icon: string
  tips?: string[]
}

const EXERCISE_DATA: ExerciseCategory[] = [
  {
    id: 'walking',
    title: '散步',
    description: '低强度有氧运动，促进血液循环，有助于缓解乳房胀痛和紧张感。',
    effect: 'recommended',
    icon: '🚶',
    tips: ['每日20-30分钟', '选择平坦路面，穿舒适内衣'],
  },
  {
    id: 'yoga',
    title: '瑜伽 / 拉伸',
    description: '温和的拉伸和呼吸练习可放松胸大肌及周围组织，减轻疼痛。',
    effect: 'recommended',
    icon: '🧘',
    tips: ['避免过度挤压胸部的体式', '可做扩胸、肩背拉伸'],
  },
  {
    id: 'swimming',
    title: '游泳',
    description: '水中运动冲击小，能改善循环且不加重乳房负担。',
    effect: 'recommended',
    icon: '🏊',
    tips: ['每周2-3次', '选择支撑性好的泳衣'],
  },
  {
    id: 'cycling',
    title: '骑行（轻度）',
    description: '平路或低阻力骑行有助于有氧与放松，注意姿势避免含胸。',
    effect: 'recommended',
    icon: '🚴',
    tips: ['控制时长与强度', '座椅高度适中，减少上身压力'],
  },
  {
    id: 'high-impact',
    title: '剧烈跑跳',
    description: '跑步、跳绳、 HIIT 等 high-impact 运动可能加重乳房晃动与不适。',
    effect: 'avoid',
    icon: '🏃',
    tips: ['疼痛期可改为快走或椭圆机', '若进行需穿高支撑运动内衣'],
  },
  {
    id: 'chest-heavy',
    title: '胸部负重训练',
    description: '卧推、俯卧撑等胸肌大负重可能使部分人乳房或胸壁不适加重。',
    effect: 'avoid',
    icon: '🏋️',
    tips: ['疼痛期可减少重量与组数', '以轻重量、多组数为宜'],
  },
]

const DIET_GROUPS: { key: FoodCategory['effect']; label: string }[] = [
  { key: 'positive', label: '✅ 有益食物' },
  { key: 'caution', label: '⚠️ 需注意' },
  { key: 'avoid', label: '❌ 建议避免' },
]

const EXERCISE_GROUPS: { key: ExerciseCategory['effect']; label: string }[] = [
  { key: 'recommended', label: '✅ 推荐运动' },
  { key: 'avoid', label: '❌ 需避免' },
]

const PAIN_TYPE_NAMES: Record<string, string> = {
  distending: '胀痛',
  stabbing: '刺痛',
  burning: '烧灼感',
  dull: '隐痛',
  tender: '触痛',
  other: '其他',
}

type TabKey = 'diet' | 'exercise' | 'expert'

export default function Knowledge() {
  const [activeTab, setActiveTab] = useState<TabKey>('diet')
  const [expertArticle, setExpertArticle] = useState<string>('')
  const [expertLoading, setExpertLoading] = useState(false)

  const expertSummary = useMemo(() => {
    const records = loadAllRecordsFromStorage()
    const recent = records.filter((r) => {
      const d = new Date(r.date)
      const limit = subDays(new Date(), 90)
      return d >= limit
    }).slice(0, 30)
    if (recent.length === 0) {
      return '用户暂无近期记录，请从一般性乳房健康与周期性不适的科普角度撰写。'
    }
    const avgPain = recent.reduce((s, r) => s + r.painLevel, 0) / recent.length
    const painDays = recent.filter((r) => r.painLevel > 0).length
    const typeCount: Record<string, number> = {}
    recent.forEach((r) => {
      (r.painTypes || []).forEach((t) => { typeCount[t] = (typeCount[t] || 0) + 1 })
    })
    const typeStr = Object.entries(typeCount)
      .map(([k, v]) => `${PAIN_TYPE_NAMES[k] || k}${v}次`)
      .join('、') || '未记录类型'
    const dietTags = new Set<string>()
    recent.forEach((r) => (r.dietTags || []).forEach((t) => dietTags.add(t)))
    const moodCount: Record<string, number> = {}
    recent.forEach((r) => {
      const m = r.mood || '未记录'
      moodCount[m] = (moodCount[m] || 0) + 1
    })
    return `最近${recent.length}天内有${painDays}天有疼痛记录；平均疼痛评分${avgPain.toFixed(1)}分（0-10）。疼痛类型分布：${typeStr}。饮食标签出现：${dietTags.size ? [...dietTags].join('、') : '无'}。情绪分布简要：${Object.entries(moodCount).map(([k, v]) => `${k}${v}次`).join('，')}。`
  }, [])

  const handleGenerateExpert = useCallback(async () => {
    setExpertLoading(true)
    setExpertArticle('')
    try {
      const text = await getExpertArticle(expertSummary)
      setExpertArticle(text)
    } finally {
      setExpertLoading(false)
    }
  }, [expertSummary])

  const handleExportPdf = useCallback(() => {
    if (!expertArticle) return
    const escapeHtml = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    const paragraphs = expertArticle.split(/\n+/).filter((p) => p.trim())
    const bodyHtml = paragraphs.map((p) => `<p>${escapeHtml(p.trim())}</p>`).join('')
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>专家解读文章 - 舒汝日记</title>
          <style>
            body { font-family: "Microsoft YaHei", "PingFang SC", sans-serif; padding: 2cm; line-height: 1.8; color: #333; max-width: 21cm; margin: 0 auto; }
            h1 { font-size: 18pt; color: #ec4899; margin-bottom: 1em; }
            p { margin-bottom: 0.8em; text-indent: 2em; }
          </style>
        </head>
        <body>
          <h1>专家解读文章</h1>
          <div>${bodyHtml}</div>
          <p style="margin-top:2em;font-size:12px;color:#666;">本文章由舒汝日记根据您的记录生成，仅供参考，不可替代医疗诊断。</p>
        </body>
      </html>
    `)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 300)
  }, [expertArticle])

  return (
    <div className="min-h-screen bg-[#FDF2F4] p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-gray-700 flex items-center gap-2">
            📚 知识科普
          </h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">
            科学饮食与适度运动有助于缓解乳房不适，以下建议仅供参考，请结合自身情况调整。
          </p>
        </header>

        {/* 标签页切换 */}
        <div className="flex gap-2 mb-6 border-b border-[#FCE7E9]">
          <button
            type="button"
            onClick={() => setActiveTab('diet')}
            className={`px-4 md:px-6 py-3 font-medium rounded-t-lg transition ${
              activeTab === 'diet'
                ? 'bg-white text-[#F472B6] border-b-2 border-[#F472B6] -mb-px'
                : 'text-gray-500 hover:text-[#F472B6]'
            }`}
          >
            🥗 饮食建议
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('exercise')}
            className={`px-4 md:px-6 py-3 font-medium rounded-t-lg transition ${
              activeTab === 'exercise'
                ? 'bg-white text-[#F472B6] border-b-2 border-[#F472B6] -mb-px'
                : 'text-gray-500 hover:text-[#F472B6]'
            }`}
          >
            🧘 运动建议
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('expert')}
            className={`px-4 md:px-6 py-3 font-medium rounded-t-lg transition ${
              activeTab === 'expert'
                ? 'bg-white text-[#F472B6] border-b-2 border-[#F472B6] -mb-px'
                : 'text-gray-500 hover:text-[#F472B6]'
            }`}
          >
            📄 专家文章
          </button>
        </div>

        {activeTab === 'diet' && (
          <div className="space-y-8">
            {DIET_GROUPS.map((group) => {
              const items = DIET_DATA.filter((d) => d.effect === group.key)
              if (items.length === 0) return null
              return (
                <section key={group.key}>
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">{group.label}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((item) => (
                      <KnowledgeCard
                        key={item.id}
                        variant="light"
                        icon={item.icon}
                        title={item.title}
                        description={item.description}
                        research={item.research}
                        tips={item.tips}
                      />
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        )}

        {activeTab === 'exercise' && (
          <div className="space-y-8">
            {EXERCISE_GROUPS.map((group) => {
              const items = EXERCISE_DATA.filter((d) => d.effect === group.key)
              if (items.length === 0) return null
              return (
                <section key={group.key}>
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">{group.label}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((item) => (
                      <KnowledgeCard
                        key={item.id}
                        variant="light"
                        icon={item.icon}
                        title={item.title}
                        description={item.description}
                        tips={item.tips}
                      />
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        )}

        {activeTab === 'expert' && (
          <section className="space-y-4">
            <p className="text-sm text-gray-600">
              根据您近期的记录，生成一篇与您症状相关的专家解读文章，可在页面浏览全文，并支持导出为 PDF 保存。
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleGenerateExpert}
                disabled={expertLoading}
                className="px-5 py-2.5 rounded-xl bg-[#F472B6] text-white font-medium hover:bg-[#FBC4D0] disabled:opacity-50 transition"
              >
                {expertLoading ? '生成中…' : '生成专家文章'}
              </button>
              {expertArticle && (
                <button
                  type="button"
                  onClick={handleExportPdf}
                  className="px-5 py-2.5 rounded-xl border-2 border-[#F472B6] text-[#F472B6] font-medium hover:bg-[#FDF2F4] transition"
                >
                  下载为 PDF
                </button>
              )}
            </div>
            {expertLoading && (
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <div className="w-4 h-4 border-2 border-[#F472B6] border-t-transparent rounded-full animate-spin" />
                <span>正在根据您的记录生成专家解读文章…</span>
              </div>
            )}
            {expertArticle && !expertLoading && (
              <div
                className="expert-article-print bg-gradient-to-r from-[#FDF2F4] to-white rounded-2xl p-6 border border-[#FCE7E9] shadow-sm text-gray-700 leading-relaxed whitespace-pre-line"
                style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5), rgba(255,255,255,0.5)), url('/knowledge-card-bg.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}
              >
                {expertArticle}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
