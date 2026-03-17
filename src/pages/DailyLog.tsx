import { useState, useMemo, useCallback } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns'
import { zhCN } from 'date-fns/locale'
// 类型定义
type MoodKey =
  | 'excited'
  | 'happy'
  | 'relaxed'
  | 'sensitive'
  | 'anxious'
  | 'angry'
  | 'depressed'
  | 'sad'
  | 'irritable'
type PainTypeKey = 'distending' | 'stabbing' | 'burning' | 'dull' | 'tender' | 'other'
type PainPositionKey = 'left-upper-outer' | 'left-upper-inner' | 'left-lower-outer' | 'left-lower-inner' | 'right-upper-inner' | 'right-upper-outer' | 'right-lower-inner' | 'right-lower-outer'
type DietTagKey = 'caffeine' | 'highSalt' | 'highFat' | 'spicy' | 'alcohol' | 'supplements' | 'fiber' | 'cold'

interface MedicationItem {
  id: string
  name: string
  dose: string
  time: 'once' | 'twice' | 'thrice'
}

interface MenstrualRecord {
  isPeriod: boolean
  flowLevel: 'light' | 'medium' | 'heavy' | null
  periodDay: number
}

interface DailyLogPayload {
  date: string
  mood: MoodKey | null
  painLevel: number
  painTypes: PainTypeKey[]
  painPositions: PainPositionKey[]
  dietTags: DietTagKey[]
  dietOther: string
  medications: MedicationItem[]
  menstrual: MenstrualRecord
}

// 常量定义
const MOOD_OPTIONS = [
  {
    key: 'happy' as MoodKey,
    label: '开心',
    emoji: '/moods/happy.png',
    isImage: true,
    bgColor: 'bg-pink-50 border-pink-300',
    softBgColor: 'bg-pink-50 border-pink-100',
  },
  {
    key: 'excited' as MoodKey,
    label: '兴奋',
    emoji: '/moods/excited.png',
    isImage: true,
    bgColor: 'bg-yellow-50 border-yellow-300',
    softBgColor: 'bg-yellow-50 border-yellow-100',
  },
  {
    key: 'relaxed' as MoodKey,
    label: '放松',
    emoji: '/moods/relaxed.png',
    isImage: true,
    bgColor: 'bg-green-50 border-green-300',
    softBgColor: 'bg-green-50 border-green-100',
  },
  {
    key: 'sensitive' as MoodKey,
    label: '敏感',
    emoji: '/moods/sensitive.png',
    isImage: true,
    bgColor: 'bg-purple-50 border-purple-300',
    softBgColor: 'bg-purple-50 border-purple-100',
  },
  {
    key: 'anxious' as MoodKey,
    label: '焦虑',
    emoji: '/moods/anxious.png',
    isImage: true,
    bgColor: 'bg-red-50 border-red-300',
    softBgColor: 'bg-red-50 border-red-100',
  },
  {
    key: 'angry' as MoodKey,
    label: '生气',
    emoji: '/moods/angry.png',
    isImage: true,
    bgColor: 'bg-rose-50 border-rose-300',
    softBgColor: 'bg-rose-50 border-rose-100',
  },
  {
    key: 'depressed' as MoodKey,
    label: '压抑',
    emoji: '/moods/depressed.png',
    isImage: true,
    bgColor: 'bg-slate-50 border-slate-300',
    softBgColor: 'bg-slate-50 border-slate-100',
  },
  {
    key: 'sad' as MoodKey,
    label: '悲伤',
    emoji: '/moods/sad.png',
    isImage: true,
    bgColor: 'bg-blue-50 border-blue-300',
    softBgColor: 'bg-blue-50 border-blue-100',
  },
  {
    key: 'irritable' as MoodKey,
    label: '暴躁',
    emoji: '/moods/irritable.png',
    isImage: true,
    bgColor: 'bg-amber-50 border-amber-300',
    softBgColor: 'bg-amber-50 border-amber-100',
  },
] as const

const PAIN_TYPE_OPTIONS = [
  { key: 'distending' as PainTypeKey, label: '胀痛' },
  { key: 'stabbing' as PainTypeKey, label: '刺痛' },
  { key: 'burning' as PainTypeKey, label: '烧灼感' },
  { key: 'dull' as PainTypeKey, label: '隐痛' },
  { key: 'tender' as PainTypeKey, label: '触痛' },
  { key: 'other' as PainTypeKey, label: '其他' },
]

const PAIN_POSITION_LABELS: Record<PainPositionKey, string> = {
  'left-upper-outer': '左乳外上',
  'left-upper-inner': '左乳内上',
  'left-lower-outer': '左乳外下',
  'left-lower-inner': '左乳内下',
  'right-upper-inner': '右乳内上',
  'right-upper-outer': '右乳外上',
  'right-lower-inner': '右乳内下',
  'right-lower-outer': '右乳外下',
}

const DIET_TAG_OPTIONS = [
  { key: 'caffeine' as DietTagKey, label: '咖啡因' },
  { key: 'highSalt' as DietTagKey, label: '高盐' },
  { key: 'highFat' as DietTagKey, label: '高脂' },
  { key: 'spicy' as DietTagKey, label: '辛辣' },
  { key: 'alcohol' as DietTagKey, label: '酒精' },
  { key: 'supplements' as DietTagKey, label: '保健品' },
  { key: 'fiber' as DietTagKey, label: '富含纤维' },
  { key: 'cold' as DietTagKey, label: '生冷' },
]

const TIME_OPTIONS = [
  { value: 'once', label: '每日一次' },
  { value: 'twice', label: '每日两次' },
  { value: 'thrice', label: '每日三次' },
]

type MedCategory = 'anti-infective' | 'hormone' | 'tcm' | ''
type AntiInfectiveSub = 'antibiotic' | 'nsaid' | ''
type HormoneSub = 'anti-estrogen' | 'other-hormone' | ''
type TcmSub = 'tcm-main' | ''

const DAILY_LOG_STORAGE_KEY = 'daily-log'
const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

// 乳房示意图组件 - 彻底解决对齐问题
function BreastDiagram({ selected, onToggle }: {
  selected: Set<PainPositionKey>,
  onToggle: (key: PainPositionKey) => void
}) {
  const positions = [
    { id: 'left-upper-outer' as PainPositionKey, label: '左乳外上', x: 20, y: 30 },
    { id: 'left-upper-inner' as PainPositionKey, label: '左乳内上', x: 35, y: 30 },
    { id: 'left-lower-outer' as PainPositionKey, label: '左乳外下', x: 20, y: 55 },
    { id: 'left-lower-inner' as PainPositionKey, label: '左乳内下', x: 35, y: 55 },
    { id: 'right-upper-inner' as PainPositionKey, label: '右乳内上', x: 65, y: 30 },
    { id: 'right-upper-outer' as PainPositionKey, label: '右乳外上', x: 80, y: 30 },
    { id: 'right-lower-inner' as PainPositionKey, label: '右乳内下', x: 65, y: 55 },
    { id: 'right-lower-outer' as PainPositionKey, label: '右乳外下', x: 80, y: 55 },
  ]

  return (
    <div className="flex items-stretch gap-2">
      {/* 左侧：乳房示意图 - 固定高度，垂直居中显示内容 */}
      <div className="w-[65%] flex items-center justify-end">
        <div className="relative w-full max-w-[280px]">
          <svg viewBox="0 0 100 90" className="w-full h-auto">
            {/* 左乳轮廓 */}
            <ellipse cx="30" cy="40" rx="20" ry="25" fill="#FFE5E5" stroke="#F472B6" strokeWidth="1" />
            {/* 右乳轮廓 */}
            <ellipse cx="70" cy="40" rx="20" ry="25" fill="#FFE5E5" stroke="#F472B6" strokeWidth="1" />

            {/* 点击区域标记 - 8个可点击圆点 */}
            {positions.map(pos => (
              <circle
                key={pos.id}
                cx={pos.x}
                cy={pos.y}
                r="5"
                fill={selected.has(pos.id) ? '#EC4899' : '#F9A8D4'}
                fillOpacity={selected.has(pos.id) ? 0.8 : 0.3}
                stroke="#F472B6"
                strokeWidth="1"
                onClick={() => onToggle(pos.id)}
                className="cursor-pointer hover:fill-pink-400 transition"
              />
            ))}

            {/* 左右标注 */}
            <text x="30" y="73" textAnchor="middle" fill="#F472B6" fontSize="7" opacity="0.7">左</text>
            <text x="70" y="73" textAnchor="middle" fill="#F472B6" fontSize="7" opacity="0.7">右</text>
          </svg>
        </div>
      </div>

      {/* 右侧：已选文字框 - 内部内容均匀居中对齐 */}
      {selected.size > 0 && (
        <div className="w-[35%] flex items-center">
          <div className="w-full bg-[#FDF2F4] p-4 rounded-lg flex flex-col items-center justify-center min-h-[200px] min-w-0">
            <p className="text-sm font-medium text-[#F472B6] mb-4 text-center">已选位置</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {[...selected].map(k => (
                <span key={k} className="inline-block bg-white px-2.5 py-1.5 rounded-full text-xs text-gray-600 shadow-sm">
                  {PAIN_POSITION_LABELS[k]}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
// 可折叠卡片组件（keepCalendarBg=true 时保留原背景，用于日历卡片）
function CollapsibleCard({ title, defaultOpen = true, keepCalendarBg = false, children }: {
  title: string
  defaultOpen?: boolean
  keepCalendarBg?: boolean
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const style = keepCalendarBg
    ? { backgroundImage: "url('/calendar-bg-leaf.png')" }
    : {
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.45), rgba(255,255,255,0.45)), url('/knowledge-card-bg.png')",
      }

  return (
    <div
      className="bg-cover bg-center bg-no-repeat rounded-2xl shadow-lg shadow-pink-100/50 border border-[#FCE7E9] overflow-hidden"
      style={style}
    >
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#FDF2F4] transition"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h2 className="text-lg font-semibold text-gray-700">{title}</h2>
        <button 
          type="button"
          className="text-[#F472B6] hover:bg-[#FCE7E9] p-1 rounded-lg transition"
          onClick={(e) => {
            e.stopPropagation()
            setIsOpen(!isOpen)
          }}
        >
          {isOpen ? '收起' : '展开'}
        </button>
      </div>
      {isOpen && <div className="px-4 pb-4">{children}</div>}
    </div>
  )
}
// 从 localStorage 读取所有记录（只关心当天心情 key，方便在日历中还原图片）
function loadMoodByDateFromStorage(): Record<string, MoodKey> {
  const out: Record<string, MoodKey> = {}
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key?.startsWith(DAILY_LOG_STORAGE_KEY + '-')) continue
      const dateKey = key.slice((DAILY_LOG_STORAGE_KEY + '-').length)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) continue
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const data = JSON.parse(raw) as DailyLogPayload
      const moodOpt = MOOD_OPTIONS.find((m) => m.key === data.mood)
      if (moodOpt) out[dateKey] = moodOpt.key
    }
  } catch (_) {
    // ignore
  }
  return out
}

// 从 localStorage 获取所有经期记录
function getAllPeriodRecords(): string[] {
  const periodDatesSet = new Set<string>()
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key?.startsWith(DAILY_LOG_STORAGE_KEY + '-')) continue
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const data = JSON.parse(raw) as DailyLogPayload
      if (data.menstrual?.isPeriod) {
        periodDatesSet.add(data.date)
      }
    }
  } catch {
    // ignore
  }
  return Array.from(periodDatesSet).sort()
}

export default function DailyLog() {
  const [currentMonth, setCurrentMonth] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => new Date())
  const [moodByDate, setMoodByDate] = useState<Record<string, MoodKey>>(() => loadMoodByDateFromStorage())
  const [mood, setMood] = useState<MoodKey | null>(null)
  const [painLevel, setPainLevel] = useState(0)
  const [painTypes, setPainTypes] = useState<Set<PainTypeKey>>(new Set())
  const [painPositions, setPainPositions] = useState<Set<PainPositionKey>>(new Set())
  const [dietTags, setDietTags] = useState<Set<DietTagKey>>(new Set())
  const [dietOther, setDietOther] = useState('')
  const [medications, setMedications] = useState<MedicationItem[]>([])
  const [medName, setMedName] = useState('')
  const [medDose, setMedDose] = useState('')
  const [tabletCount, setTabletCount] = useState<number | ''>('')
  const [medTime, setMedTime] = useState<'once' | 'twice' | 'thrice'>('once')
  const [medCategory, setMedCategory] = useState<MedCategory>('')
  const [antiInfectiveSub, setAntiInfectiveSub] = useState<AntiInfectiveSub>('')
  const [hormoneSub, setHormoneSub] = useState<HormoneSub>('')
  const [tcmSub, setTcmSub] = useState<TcmSub>('')
  const [medSpecific, setMedSpecific] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('记录已保存')

  // 经期相关状态
  const [isPeriod, setIsPeriod] = useState(false)
  const [periodFlow, setPeriodFlow] = useState<'light' | 'medium' | 'heavy' | null>(null)

  // 获取经期日期列表（不缓存，实时获取）
  const periodDates = useMemo(() => {
    return getAllPeriodRecords()
  }, [showToast])

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 })
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 })
    const days: Date[] = []
    let d = start
    while (d <= end) {
      days.push(d)
      d = addDays(d, 1)
    }
    return days
  }, [currentMonth])

  const moodForDate = useCallback(
    (d: Date) => moodByDate[format(d, 'yyyy-MM-dd')] ?? null,
    [moodByDate]
  )

  const togglePainType = (key: PainTypeKey) => {
    setPainTypes((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const togglePainPosition = (key: PainPositionKey) => {
    setPainPositions((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const toggleDietTag = (key: DietTagKey) => {
    setDietTags((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const addMedication = () => {
    // 根据级联选择自动生成药物名称
    let finalName = medName.trim()

    if (medCategory === 'anti-infective') {
      if (antiInfectiveSub === 'antibiotic') {
        if (!medSpecific.trim()) return
        finalName = medSpecific.trim()
      } else if (antiInfectiveSub === 'nsaid') {
        if (!medSpecific.trim()) return
        finalName = medSpecific.trim()
      }
    } else if (medCategory === 'hormone') {
      if (!medSpecific.trim()) return
      finalName = medSpecific.trim()
    } else if (medCategory === 'tcm') {
      if (!medSpecific.trim()) return
      finalName = medSpecific.trim()
    }

    if (!finalName) return

    const tabletText =
      tabletCount && Number(tabletCount) > 0 ? `${tabletCount}片（约 ${Number(tabletCount) * 200} mg）` : ''

    const finalDose = medDose.trim()
      ? `${tabletText ? `${tabletText}，` : ''}${medDose.trim()}`
      : tabletText

    setMedications((prev) => [
      ...prev,
      {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
        name: finalName,
        dose: finalDose,
        time: medTime,
      },
    ])
    setMedName('')
    setMedDose('')
    setMedTime('once')
    setMedCategory('')
    setAntiInfectiveSub('')
    setHormoneSub('')
    setTcmSub('')
    setMedSpecific('')
    setTabletCount('')
  }

  const removeMedication = (id: string) => {
    setMedications((prev) => prev.filter((m) => m.id !== id))
  }

  const timeLabel = (t: 'once' | 'twice' | 'thrice') => {
    return TIME_OPTIONS.find((o) => o.value === t)?.label ?? t
  }

  const selectedDateKey = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null
  const hasRecordForSelected =
    typeof window !== 'undefined' && selectedDateKey
      ? !!localStorage.getItem(`${DAILY_LOG_STORAGE_KEY}-${selectedDateKey}`)
      : false

  const handleDeleteRecord = () => {
    if (!selectedDate || !selectedDateKey) return
    if (!window.confirm(`确定要删除 ${format(selectedDate, 'M月d日', { locale: zhCN })} 的记录吗？此操作不可恢复。`)) return
    localStorage.removeItem(`${DAILY_LOG_STORAGE_KEY}-${selectedDateKey}`)
    setMoodByDate((prev) => {
      const next = { ...prev }
      delete next[selectedDateKey]
      return next
    })
    setMood(null)
    setPainLevel(0)
    setPainTypes(new Set())
    setPainPositions(new Set())
    setDietTags(new Set())
    setDietOther('')
    setMedications([])
    setIsPeriod(false)
    setPeriodFlow(null)
    setToastMessage('已删除该日记录')
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2000)
  }

  const handleSave = () => {
    if (!selectedDate) return
    const dateKey = format(selectedDate, 'yyyy-MM-dd')
    
    // 计算经期第几天
    let periodDay = 0
    if (isPeriod) {
      const periodRecords = getAllPeriodRecords()
      const sortedPeriodDates = periodRecords.sort()
      for (let i = 0; i < sortedPeriodDates.length; i++) {
        if (sortedPeriodDates[i] === dateKey) {
          periodDay = i + 1
          break
        }
        if (sortedPeriodDates[i] > dateKey) break
      }
      if (periodDay === 0) periodDay = sortedPeriodDates.length + 1
    }
    
    const payload: DailyLogPayload = {
      date: dateKey,
      mood,
      painLevel,
      painTypes: [...painTypes],
      painPositions: [...painPositions],
      dietTags: [...dietTags],
      dietOther,
      medications,
      menstrual: {
        isPeriod,
        flowLevel: periodFlow,
        periodDay,
      },
    }
    console.log('每日记录保存:', payload)
    localStorage.setItem(`${DAILY_LOG_STORAGE_KEY}-${dateKey}`, JSON.stringify(payload))
    // 用 MoodKey 更新日历显示，日历通过 key 在 MOOD_OPTIONS 里取表情图
    if (mood) {
      setMoodByDate((prev) => ({ ...prev, [dateKey]: mood }))
    } else {
      setMoodByDate((prev) => {
        const next = { ...prev }
        delete next[dateKey]
        return next
      })
    }
    setToastMessage('记录已保存')
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2000)
  }

  // 计算周期统计和预测
  const cycleData = useMemo(() => {
    const periodDates = getAllPeriodRecords()
    if (periodDates.length < 2) {
      return {
        avgCycleDays: 28,
        nextPeriodDate: null,
        ovulationDate: null,
        periodDates,
        isInOvulationWindow: false,
      }
    }

    // 计算平均周期
    const cycles: number[] = []
    for (let i = 1; i < periodDates.length; i++) {
      const prev = new Date(periodDates[i - 1])
      const curr = new Date(periodDates[i])
      const diff = Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24))
      if (diff > 15 && diff < 60) cycles.push(diff)
    }
    const avgCycle = cycles.length > 0 
      ? Math.round(cycles.reduce((a, b) => a + b, 0) / cycles.length) 
      : 28

    // 预测下次经期
    const lastPeriodDate = new Date(periodDates[periodDates.length - 1])
    const nextPeriodDate = new Date(lastPeriodDate)
    nextPeriodDate.setDate(nextPeriodDate.getDate() + avgCycle)

    // 预测排卵期（下次经期前14天左右）
    const ovulationDate = new Date(nextPeriodDate)
    ovulationDate.setDate(ovulationDate.getDate() - 14)

    // 判断今天是否在排卵期窗口（排卵日前5天到后1天）
    const today = new Date()
    const ovulationStart = new Date(ovulationDate)
    ovulationStart.setDate(ovulationStart.getDate() - 5)
    const ovulationEnd = new Date(ovulationDate)
    ovulationEnd.setDate(ovulationEnd.getDate() + 1)
    const isInOvulationWindow = today >= ovulationStart && today <= ovulationEnd

    return {
      avgCycleDays: avgCycle,
      nextPeriodDate: nextPeriodDate.toISOString().slice(0, 10),
      ovulationDate: ovulationDate.toISOString().slice(0, 10),
      periodDates,
      isInOvulationWindow,
    }
  }, [periodDates])

  // 兼容旧的 cycleStats
  const cycleStats = {
    avgPeriodDays: 5,
    avgCycleDays: cycleData.avgCycleDays,
    flowLight: 3,
    flowMedium: 2,
    mildPain: 4,
  }

  return (
    <div className="min-h-screen bg-[#FDF2F4] p-6 pb-20">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-700">每日记录</h1>
        <p className="text-gray-600 mt-1">记录每日心情、疼痛与饮食，便于追踪健康趋势</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 1. 日历视图（左侧，占两行高度） */}
        <div className="lg:row-span-2">
        <CollapsibleCard title="日历" defaultOpen keepCalendarBg>
        <div className="p-4 md:p-5">
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            className="p-2 rounded-xl text-gray-600 hover:bg-[#FDF2F4] transition-colors"
            aria-label="上个月"
          >
            ‹
          </button>
          <span className="text-base font-semibold text-gray-700">
            {format(currentMonth, 'yyyy年M月', { locale: zhCN })}
          </span>
          <button
            type="button"
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            className="p-2 rounded-xl text-gray-600 hover:bg-[#FDF2F4] transition-colors"
            aria-label="下个月"
          >
            ›
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1.5 text-center text-sm md:text-base text-gray-500 mb-2">
          {WEEKDAYS.map((w) => (
            <div key={w} className="py-1">{w}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5 pb-8">
          {calendarDays.map((d) => {
            const inMonth = isSameMonth(d, currentMonth)
            const isSelected = selectedDate ? isSameDay(d, selectedDate) : false
            const isTodayDate = isToday(d)
            const moodKey = moodForDate(d)
            const dateKey = format(d, 'yyyy-MM-dd')
            const isPeriodDay = periodDates.includes(dateKey)
            const isOvulationDay = cycleData.ovulationDate === dateKey
            
            return (
              <button
                key={d.getTime()}
                type="button"
                onClick={() => setSelectedDate(d)}
                className={`
                  min-h-[124px] md:min-h-[142px] rounded-3xl flex flex-col items-center transition relative overflow-hidden
                  ${!inMonth ? 'text-gray-300' : 'text-gray-700'}
                  ${isSelected ? 'ring-2 ring-[#F472B6] ring-offset-1 bg-[#FDF2F4]' : 'hover:bg-[#FCE7E9]'}
                  ${isTodayDate && inMonth ? 'font-bold text-[#F472B6]' : ''}
                `}
              >
                {/* 上方固定区域：日期数字 + 今日圆点，保证不被表情遮挡 */}
                <div className="flex-shrink-0 pt-1 pb-0.5 min-h-[2rem] flex flex-col items-center justify-end">
                  <span className="text-base md:text-lg leading-tight">{format(d, 'd')}</span>
                  {isTodayDate && inMonth && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F472B6] mt-0.5" />
                  )}
                </div>
                {/* 下方区域：大桃子表情，与数字分区不重叠 */}
                {moodKey && inMonth && (
                  <div className="flex-1 min-h-0 flex items-center justify-center w-full">
                    {(() => {
                      const opt = MOOD_OPTIONS.find((m) => m.key === moodKey)
                      if (!opt) return null
                      if ((opt as any).isImage) {
                        return (
                          <img
                            src={opt.emoji}
                            alt={opt.label}
                            className="w-[3.5rem] h-[3.5rem] md:w-20 md:h-20 object-contain"
                          />
                        )
                      }
                      return <span className="text-lg md:text-xl">{opt.emoji}</span>
                    })()}
                  </div>
                )}
                {isPeriodDay && inMonth && (
                  <span
                    className="absolute top-1 right-1 w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-400"
                    title="经期"
                  />
                )}
                {isOvulationDay && inMonth && (
                  <span
                    className="absolute bottom-1 right-1.5 w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-400"
                    title="排卵日"
                  />
                )}
              </button>
            )
          })}
        </div>
        <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-[#FCE7E9] text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <img src="/46fc2b93100bc5f88659ff1b46bd3f88.jpg" alt="开心" className="w-4 h-4 object-contain" /> 有记录
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-400"></span> 经期
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-400"></span> 排卵日
          </span>
        </div>
        {selectedDate && (
          <p className="mt-2 text-sm text-gray-600">
            记录日期：{format(selectedDate, 'yyyy年M月d日', { locale: zhCN })}
          </p>
        )}
        </div>
        </CollapsibleCard>
        </div>

        {/* 2. 心情记录 */}
        <CollapsibleCard title="今日心情" defaultOpen>
        <div className="grid grid-cols-3 gap-4">
          {MOOD_OPTIONS.map((opt) => {
            const isSelected = mood === opt.key
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setMood(opt.key)}
                className={`
                  flex flex-col items-center justify-center rounded-2xl border-2 transition hover:opacity-90 w-full h-full
                  ${isSelected ? opt.bgColor : opt.softBgColor}
                `}
              >
                <img
                  src={opt.emoji}
                  alt={opt.label}
                  className="w-16 h-16 md:w-20 md:h-20 mb-2 object-contain"
                />
                <span className="text-[11px] md:text-xs">{opt.label}</span>
              </button>
            )
          })}
        </div>
        </CollapsibleCard>

        {/* 3. 疼痛记录 */}
        <CollapsibleCard title="疼痛记录" defaultOpen>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>无痛</span>
              <span className="font-medium text-[#F472B6]">{painLevel}分</span>
              <span>剧痛</span>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              value={painLevel}
              onChange={(e) => setPainLevel(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none bg-gray-200 accent-pink-500"
            />
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">疼痛类型</p>
            <div className="flex flex-wrap gap-2">
              {PAIN_TYPE_OPTIONS.map((opt) => {
                const on = painTypes.has(opt.key)
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => togglePainType(opt.key)}
                    className={`
                      px-3 py-1.5 rounded-full text-sm border transition hover:opacity-90
                      ${on ? 'bg-[#F472B6] text-white border-[#F472B6]' : 'bg-gray-100 border-gray-200 text-gray-700'}
                    `}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">疼痛位置</p>
            <BreastDiagram selected={painPositions} onToggle={togglePainPosition} />
          </div>
        </div>
        </CollapsibleCard>

        {/* 4. 饮食记录 */}
        <CollapsibleCard title="饮食记录" defaultOpen>
        <div className="flex flex-wrap gap-2 mb-3">
          {DIET_TAG_OPTIONS.map((opt) => {
            const on = dietTags.has(opt.key)
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => toggleDietTag(opt.key)}
                className={`
                  px-3 py-1.5 rounded-full text-sm transition hover:opacity-90
                  ${on ? 'bg-[#F472B6] text-white' : 'bg-gray-100 text-gray-700'}
                `}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
        <input
          type="text"
          placeholder="输入其他食物..."
          value={dietOther}
          onChange={(e) => setDietOther(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-[#FCE7E9] bg-white focus:border-[#FBC4D0] focus:ring-2 focus:ring-[#FCE7E9] outline-none text-sm text-gray-700"
        />
        </CollapsibleCard>

        {/* 5. 经期记录 */}
        <CollapsibleCard title="经期记录" defaultOpen>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">今天是否在经期？</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setIsPeriod(!isPeriod)
              }}
              className={`w-14 h-7 rounded-full transition-colors ${
                isPeriod ? 'bg-pink-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`block w-6 h-6 bg-white rounded-full shadow transition-transform ${
                  isPeriod ? 'translate-x-7' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {isPeriod && (
            <div>
              <p className="text-sm text-gray-700 mb-2">经期流量</p>
              <div className="flex gap-2">
                {[
                  { key: 'light' as const, label: '少', color: 'bg-red-200' },
                  { key: 'medium' as const, label: '中', color: 'bg-red-400' },
                  { key: 'heavy' as const, label: '多', color: 'bg-red-600' },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setPeriodFlow(opt.key)
                    }}
                    className={`flex-1 py-2 rounded-lg text-sm transition ${
                      periodFlow === opt.key
                        ? `${opt.color} text-white`
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 周期预测 */}
          <div className="pt-3 border-t border-[#FCE7E9]">
            <p className="text-sm font-medium text-gray-700 mb-2">周期预测</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">平均周期</span>
                <span className="text-pink-600 font-medium">{cycleData.avgCycleDays} 天</span>
              </div>
              {cycleData.nextPeriodDate && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">预计下次经期</span>
                  <span className="text-pink-600 font-medium">{cycleData.nextPeriodDate}</span>
                </div>
              )}
              {cycleData.ovulationDate && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">预计排卵日</span>
                  <span className={`font-medium ${cycleData.isInOvulationWindow ? 'text-green-600' : 'text-pink-600'}`}>
                    {cycleData.ovulationDate}
                    {cycleData.isInOvulationWindow && '（排卵期）'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        </CollapsibleCard>

        {/* 5. 药物干预 */}
        <CollapsibleCard title="药物干预" defaultOpen>
        <div className="space-y-3 mb-3">
          <div className="flex flex-wrap gap-2">
            {/* 一级：药物大类 */}
            <select
              value={medCategory}
              onChange={(e) => {
                const val = e.target.value as MedCategory
                setMedCategory(val)
                setAntiInfectiveSub('')
                setHormoneSub('')
                setTcmSub('')
                setMedSpecific('')
              }}
              className="min-w-[150px] px-3 py-2 rounded-xl border border-[#FCE7E9] text-sm text-gray-700 bg-white"
            >
              <option value="">选择药物大类</option>
              <option value="anti-infective">抗感染类药物</option>
              <option value="hormone">激素类药物</option>
              <option value="tcm">中成药</option>
            </select>

            {/* 二级：子类选择 */}
            {medCategory === 'anti-infective' && (
              <select
                value={antiInfectiveSub}
                onChange={(e) => {
                  setAntiInfectiveSub(e.target.value as AntiInfectiveSub)
                  setMedSpecific('')
                }}
                className="min-w-[150px] px-3 py-2 rounded-xl border border-[#FCE7E9] text-sm text-gray-700 bg-white"
              >
                <option value="">选择具体类别</option>
                <option value="antibiotic">抗生素（如青霉素类、头孢菌素类、甲硝唑等）</option>
                <option value="nsaid">抗炎药（NSAIDs，如布洛芬、双氯芬酸）</option>
              </select>
            )}

            {medCategory === 'hormone' && (
              <select
                value={hormoneSub}
                onChange={(e) => {
                  setHormoneSub(e.target.value as HormoneSub)
                  setMedSpecific('')
                }}
                className="min-w-[150px] px-3 py-2 rounded-xl border border-[#FCE7E9] text-sm text-gray-700 bg-white"
              >
                <option value="">选择具体类别</option>
                <option value="anti-estrogen">抗雌激素药物（如他莫昔芬等）</option>
                <option value="other-hormone">其他激素调节药物（如溴隐亭、达那唑）</option>
              </select>
            )}

            {medCategory === 'tcm' && (
              <select
                value={tcmSub}
                onChange={(e) => {
                  setTcmSub(e.target.value as TcmSub)
                  setMedSpecific('')
                }}
                className="min-w-[150px] px-3 py-2 rounded-xl border border-[#FCE7E9] text-sm text-gray-700 bg-white"
              >
                <option value="">选择中成药类型</option>
                <option value="tcm-main">乳房相关中成药</option>
              </select>
            )}
          </div>

          {/* 三级：具体药物 + 其他输入 */}
          <div className="flex flex-wrap gap-2">
            {medCategory === 'anti-infective' && antiInfectiveSub === 'antibiotic' && (
              <select
                value={medSpecific}
                onChange={(e) => setMedSpecific(e.target.value)}
                className="min-w-[150px] px-3 py-2 rounded-xl border border-[#FCE7E9] text-sm text-gray-700 bg-white"
              >
                <option value="">选择抗生素</option>
                <option value="青霉素类">青霉素类</option>
                <option value="头孢菌素类">头孢菌素类</option>
                <option value="甲硝唑">甲硝唑</option>
                <option value="">其他（请在下方输入具体名称）</option>
              </select>
            )}

            {medCategory === 'anti-infective' && antiInfectiveSub === 'nsaid' && (
              <select
                value={medSpecific}
                onChange={(e) => setMedSpecific(e.target.value)}
                className="min-w-[150px] px-3 py-2 rounded-xl border border-[#FCE7E9] text-sm text-gray-700 bg-white"
              >
                <option value="">选择抗炎药</option>
                <option value="布洛芬">布洛芬</option>
                <option value="双氯芬酸">双氯芬酸</option>
                <option value="">其他（请在下方输入具体名称）</option>
              </select>
            )}

            {medCategory === 'hormone' && (
              <select
                value={medSpecific}
                onChange={(e) => setMedSpecific(e.target.value)}
                className="min-w-[180px] px-3 py-2 rounded-xl border border-[#FCE7E9] text-sm text-gray-700 bg-white"
              >
                <option value="">选择具体药物或在下方自填</option>
                {hormoneSub === 'anti-estrogen' && <option value="他莫昔芬">他莫昔芬</option>}
                {hormoneSub === 'other-hormone' && (
                  <>
                    <option value="溴隐亭">溴隐亭</option>
                    <option value="达那唑">达那唑</option>
                  </>
                )}
                <option value="">其他（请在下方输入具体名称）</option>
              </select>
            )}

            {medCategory === 'tcm' && (
              <select
                value={medSpecific}
                onChange={(e) => setMedSpecific(e.target.value)}
                className="min-w-[200px] px-3 py-2 rounded-xl border border-[#FCE7E9] text-sm text-gray-700 bg-white"
              >
                <option value="">选择常用中成药或在下方自填</option>
                <option value="乳癖消片">乳癖消片</option>
                <option value="逍遥丸">逍遥丸</option>
                <option value="小金丸">小金丸</option>
                <option value="消乳散结胶囊">消乳散结胶囊</option>
                <option value="">其他（请在下方输入具体名称）</option>
              </select>
            )}

            {/* 其他：手动输入具体药物名 */}
            <input
              type="text"
              placeholder="如选择“其他”，在此输入具体药物名称"
              value={medName}
              onChange={(e) => setMedName(e.target.value)}
              className="flex-1 min-w-[160px] px-3 py-2 rounded-xl border border-[#FCE7E9] text-sm text-gray-700 focus:border-[#FBC4D0] focus:ring-2 focus:ring-[#FCE7E9] outline-none"
            />
          </div>

          {/* 剂量与时间 */}
          <div className="flex flex-wrap gap-2 items-center">
            {/* 片数下拉 + 加减 */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  setTabletCount((prev) => {
                    const n = typeof prev === 'number' ? prev : 0
                    return n > 0 ? (n - 1 || '') : ''
                  })
                }
                className="w-7 h-7 flex items-center justify-center rounded-full border border-[#FCE7E9] text-sm text-gray-600"
              >
                -
              </button>
              <select
                value={tabletCount === '' ? '' : String(tabletCount)}
                onChange={(e) => {
                  const v = e.target.value
                  setTabletCount(v ? Number(v) : '')
                }}
                className="px-2 py-1.5 rounded-xl border border-[#FCE7E9] text-sm text-gray-700 bg-white"
              >
                <option value="">片数</option>
                <option value="1">一片</option>
                <option value="2">两片</option>
                <option value="3">三片</option>
                <option value="4">四片</option>
              </select>
              <button
                type="button"
                onClick={() =>
                  setTabletCount((prev) => {
                    const n = typeof prev === 'number' ? prev : 0
                    return n + 1
                  })
                }
                className="w-7 h-7 flex items-center justify-center rounded-full border border-[#FCE7E9] text-sm text-gray-600"
              >
                +
              </button>
            </div>

            {/* 自由剂量输入 */}
            <input
              type="text"
              placeholder="其他剂量（如 200mg、10ml 等）"
              value={medDose}
              onChange={(e) => setMedDose(e.target.value)}
              className="min-w-[150px] px-3 py-2 rounded-xl border border-[#FCE7E9] text-sm text-gray-700"
            />

            <select
              value={medTime}
              onChange={(e) => setMedTime(e.target.value as 'once' | 'twice' | 'thrice')}
              className="px-3 py-2 rounded-xl border border-[#FCE7E9] text-sm text-gray-700 bg-white"
            >
              {TIME_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={addMedication}
              className="px-4 py-2 rounded-xl bg-[#F472B6] text-white text-sm font-medium hover:bg-[#FBC4D0] transition"
            >
              添加
            </button>
            <span className="text-xs text-gray-400 ml-1">
              提示：约 **1 片 ≈ 200 mg**，仅供换算参考。
            </span>
          </div>
        </div>
        {medications.length > 0 && (
          <ul className="space-y-2">
            {medications.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between py-2 px-3 rounded-xl bg-[#FDF2F4] text-sm text-gray-700"
              >
                <span>{m.name} {m.dose && `· ${m.dose}`} · {timeLabel(m.time)}</span>
                <button
                  type="button"
                  onClick={() => removeMedication(m.id)}
                  className="text-[#F472B6] hover:underline"
                >
                  删除
                </button>
              </li>
            ))}
          </ul>
        )}
        </CollapsibleCard>

        {/* 6. 周期统计卡片 */}
        <CollapsibleCard title="经期与周期" defaultOpen>
        <div className="space-y-3 text-sm text-gray-700">
          <p>近6个月平均经期：<span className="font-medium text-[#F472B6]">{cycleStats.avgPeriodDays}</span> 天</p>
          <p>近6个月平均周期：<span className="font-medium text-[#F472B6]">{cycleStats.avgCycleDays}</span> 天</p>
        </div>
        <div className="mt-3 pt-3 border-t border-[#FCE7E9]">
          <p className="text-xs text-gray-500 mb-2">症状统计</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-700">
            <span>流量少：{cycleStats.flowLight} 次</span>
            <span>流量中等：{cycleStats.flowMedium} 次</span>
            <span>轻微痛经：{cycleStats.mildPain} 次</span>
          </div>
        </div>
        <button
          type="button"
          className="mt-3 text-sm text-[#F472B6] hover:underline"
        >
          展开最近6个月记录
        </button>
        </CollapsibleCard>
      </div>

      {/* 7. 提交与删除按钮 */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          className="flex-1 min-w-[140px] py-3.5 rounded-2xl bg-[#F472B6] text-white font-medium shadow-lg shadow-pink-200/50 hover:bg-[#FBC4D0] active:scale-[0.99] transition"
        >
          保存今日记录
        </button>
        {hasRecordForSelected && (
          <button
            type="button"
            onClick={handleDeleteRecord}
            className="flex-1 min-w-[140px] py-3.5 rounded-2xl border-2 border-red-300 text-red-600 font-medium hover:bg-red-50 active:scale-[0.99] transition"
          >
            删除该日记录
          </button>
        )}
      </div>

      {/* Toast */}
      {showToast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl bg-gray-800/90 text-white text-sm shadow-lg"
          role="status"
          aria-live="polite"
        >
          {toastMessage}
        </div>
      )}
    </div>
  )
}