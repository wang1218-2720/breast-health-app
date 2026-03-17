import { useMemo, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { format, subDays } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { getDailyReminder } from '../services/deepseek'

const STORAGE_PREFIX = 'daily-log-'

interface DailyRecord {
  date: string
  painLevel: number
}

function getLast7DaysRecords(): (DailyRecord | null)[] {
  const records: (DailyRecord | null)[] = []
  for (let i = 6; i >= 0; i--) {
    const d = subDays(new Date(), i)
    const date = format(d, 'yyyy-MM-dd')
    const key = `${STORAGE_PREFIX}${date}`
    const raw = localStorage.getItem(key)
    if (raw) {
      try {
        const data = JSON.parse(raw) as { painLevel?: number }
        const painLevel = typeof data.painLevel === 'number' ? data.painLevel : 0
        records.push({ date, painLevel })
      } catch {
        records.push(null)
      }
    } else {
      records.push(null)
    }
  }
  return records
}

function getLast7DaysLabels(): string[] {
  const labels: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = subDays(new Date(), i)
    labels.push(format(d, 'MM-dd'))
  }
  return labels
}

function calculateAveragePain(records: (DailyRecord | null)[]): number {
  const valid = records.filter((r): r is DailyRecord => r != null)
  if (valid.length === 0) return 0
  const sum = valid.reduce((acc, r) => acc + r.painLevel, 0)
  return Math.round((sum / valid.length) * 10) / 10
}

function calculateMaxPain(records: (DailyRecord | null)[]): number {
  const valid = records.filter((r): r is DailyRecord => r != null)
  if (valid.length === 0) return 0
  return Math.max(...valid.map((r) => r.painLevel))
}

function countPainDays(records: (DailyRecord | null)[]): number {
  return records.filter((r) => r != null && r.painLevel > 0).length
}

function getMaxPainDate(records: (DailyRecord | null)[]): string {
  const valid = records.filter((r): r is DailyRecord => r != null && r.painLevel > 0)
  if (valid.length === 0) return '—'
  const max = valid.reduce((prev, curr) => (prev.painLevel >= curr.painLevel ? prev : curr))
  return format(new Date(max.date), 'M月d日', { locale: zhCN })
}

function getLast7DaysCompleteness(records: (DailyRecord | null)[]): number {
  const count = records.filter((r) => r != null).length
  return Math.round((count / 7) * 100)
}

function getPreviousWeekAvgPain(): number {
  let sum = 0
  let count = 0
  for (let i = 13; i >= 7; i--) {
    const d = subDays(new Date(), i)
    const date = format(d, 'yyyy-MM-dd')
    const key = `${STORAGE_PREFIX}${date}`
    const raw = localStorage.getItem(key)
    if (raw) {
      try {
        const data = JSON.parse(raw) as { painLevel?: number }
        if (typeof data.painLevel === 'number') {
          sum += data.painLevel
          count++
        }
      } catch {
        // skip
      }
    }
  }
  if (count === 0) return 0
  return Math.round((sum / count) * 10) / 10
}

function calculateWeekOverWeekChange(records: (DailyRecord | null)[]): number {
  const thisWeekAvg = calculateAveragePain(records)
  const lastWeekAvg = getPreviousWeekAvgPain()
  return Math.round((thisWeekAvg - lastWeekAvg) * 10) / 10
}

function generateInsight(
  records: (DailyRecord | null)[],
  weekChange: number
): string {
  const valid = records.filter((r): r is DailyRecord => r != null)
  if (valid.length === 0) {
    return '还没有足够的记录数据，开始记录您的每日健康吧。'
  }

  const avg = calculateAveragePain(records)
  const max = calculateMaxPain(records)
  const maxDate = getMaxPainDate(records)
  const validDays = valid.length
  const completeness = getLast7DaysCompleteness(records)

  let changeText = ''
  if (weekChange > 0.5) {
    changeText = `较上周上升了${weekChange.toFixed(1)}分，建议关注可能的影响因素。`
  } else if (weekChange < -0.5) {
    changeText = `较上周下降了${Math.abs(weekChange).toFixed(1)}分，继续保持！`
  } else {
    changeText = '与上周基本持平。'
  }

  return `最近7天平均疼痛${avg}分，${changeText}最高疼痛${max}分出现在${maxDate}。您有${validDays}天记录了疼痛，完整度${completeness}%。`
}

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler
)

const USER_NICKNAME = '用户' // 后期可从用户档案获取

export default function Dashboard() {
  const [dailyReminder, setDailyReminder] = useState<string>('')
  const [reminderLoading, setReminderLoading] = useState(false)

  const {
    records,
    labels,
    avgPain,
    maxPain,
    maxPainDate,
    painDays,
    completeness,
    validDays,
    insight,
    todayRecorded,
    todayPain,
  } = useMemo(() => {
    const recs = getLast7DaysRecords()
    const lbls = getLast7DaysLabels()
    const avg = calculateAveragePain(recs)
    const max = calculateMaxPain(recs)
    const maxDate = getMaxPainDate(recs)
    const painD = countPainDays(recs)
    const comp = getLast7DaysCompleteness(recs)
    const valid = recs.filter((r) => r != null).length
    const change = calculateWeekOverWeekChange(recs)
    const todayRec = recs[6] // 最后一天是今天
    const todayRecorded = todayRec != null
    const todayPain = todayRec?.painLevel ?? 0

    return {
      records: recs,
      labels: lbls,
      avgPain: avg,
      maxPain: max,
      maxPainDate: maxDate,
      painDays: painD,
      completeness: comp,
      validDays: valid,
      weekChange: change,
      insight: generateInsight(recs, change),
      todayRecorded,
      todayPain,
    }
  }, [])
  const hasAnyData = records.some((r) => r != null)

  useEffect(() => {
    const run = async () => {
      if (!hasAnyData) {
        setDailyReminder('今天还没有记录，记得写下今日日记哦～')
        return
      }
      setReminderLoading(true)
      try {
        const summary = `最近7天平均疼痛${avgPain}分，最高${maxPain}分，出现在${maxPainDate}。共有${painDays}天有疼痛记录，记录完整度${completeness}%。今天${todayRecorded ? `已记录，疼痛${todayPain}分` : '尚未记录'}。请给出一句温柔的每日提醒。`
        const text = await getDailyReminder(summary)
        setDailyReminder(text)
      } catch {
        setDailyReminder('今天也要温柔对待自己，适当休息、放松身心～')
      } finally {
        setReminderLoading(false)
      }
    }
    run()
  }, [hasAnyData, avgPain, maxPain, maxPainDate, painDays, completeness, todayRecorded, todayPain])

  const hour = new Date().getHours()
  let greeting = '下午好'
  if (hour < 12) greeting = '早上好'
  if (hour >= 18) greeting = '晚上好'

  const chartData = useMemo(() => {
    const values = records.map((r) => (r != null ? r.painLevel : null))
    return {
      labels,
      datasets: [
        {
          label: '疼痛评分',
          data: values,
          borderColor: '#F472B6',
          backgroundColor: 'rgba(244, 114, 182, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointBackgroundColor: '#F472B6',
          pointBorderColor: '#fff',
          pointBorderWidth: 1,
          pointRadius: 4,
          spanGaps: false,
        },
      ],
    }
  }, [records, labels])

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx: { raw?: unknown }) =>
              typeof ctx.raw === 'number' ? `疼痛 ${ctx.raw} 分` : '无记录',
          },
        },
      },
      scales: {
        x: {
          grid: { color: 'rgba(0,0,0,0.06)' },
          ticks: { color: '#6b7280', font: { size: 11 } },
        },
        y: {
          min: 0,
          max: 10,
          grid: { color: 'rgba(0,0,0,0.06)' },
          ticks: { color: '#6b7280', stepSize: 2 },
        },
      },
    }),
    []
  )

  return (
    <div className="min-h-screen bg-[#FDF2F4] p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 模块0：每日AI提醒 */}
        {dailyReminder && (
          <div className="relative h-20 sm:h-24 rounded-2xl overflow-hidden border border-[#FCE7E9] shadow-sm bg-[#FDF2F4]">
            {/* 右侧完整显示背景图 */}
            <div
              className="absolute inset-y-0 right-0 w-2/5 sm:w-1/3"
              style={{
                backgroundImage: 'url(/reminder-bg.png)',
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right center',
              }}
            />
            {/* 从左侧页面粉色到右侧图片的更顺滑平滑过渡 */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#FDF2F4] via-white/85 via-70% to-[#FDF2F4]/10" />
            <div className="relative h-full flex items-center px-4 sm:px-6 gap-3 text-sm sm:text-base text-[#D9468D]">
              <span className="text-lg sm:text-xl shrink-0">💌</span>
              <span className="flex-1 line-clamp-2">{dailyReminder}</span>
              {reminderLoading && (
                <span className="text-xs text-pink-300 ml-2 shrink-0">生成中…</span>
              )}
            </div>
          </div>
        )}

        {/* 模块1：欢迎语和快捷入口 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-gray-700 text-lg">
            👋 {greeting}，{USER_NICKNAME}！今天感觉怎么样？
          </p>
          <Link
            to="/app/daily-log"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#F472B6] text-white font-medium hover:bg-[#FBC4D0] transition shrink-0"
          >
            +每日记录
          </Link>
        </div>

        {/* 模块2：今日记录状态 */}
        <div
          className={`rounded-xl p-4 border ${
            todayRecorded
              ? 'bg-[#FDF2F4] border-[#FCE7E9]'
              : 'bg-[#FCE7E9]/50 border-[#FBC4D0]'
          }`}
        >
          {todayRecorded ? (
            <p className="text-gray-700 text-sm">
              ✅ 今日已完成记录 | 疼痛评分：{todayPain} 分
            </p>
          ) : (
            <p className="text-gray-600 text-sm">
              ⏰ 今日还未记录 | 点击上方按钮开始记录
            </p>
          )}
        </div>

        {/* 模块3：过去7天疼痛趋势图 */}
        <section
          className="bg-white/90 bg-cover bg-center bg-no-repeat rounded-2xl shadow-lg shadow-pink-100/50 border border-[#FCE7E9] p-6"
          style={{ backgroundImage: "url('/dashboard-card-bg.png')" }}
        >
          <h2 className="text-base font-semibold text-gray-700 mb-4">📈 过去7天疼痛趋势</h2>
          {hasAnyData ? (
            <div className="h-[200px] w-full">
              <Line data={chartData} options={chartOptions} />
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-500 text-sm">
              暂无数据，请先完成每日记录
            </div>
          )}
        </section>

        {/* 模块4：关键指标卡片 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            className="bg-white/90 bg-cover bg-center bg-no-repeat rounded-xl p-4 shadow-sm border border-[#FCE7E9]"
            style={{ backgroundImage: "url('/dashboard-card-bg.png')" }}
          >
            <p className="text-sm text-gray-500">平均疼痛</p>
            <p className="text-2xl md:text-3xl font-bold text-[#F472B6]">
              {avgPain}
              <span className="text-sm text-gray-400 ml-1">分</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">最近7天</p>
          </div>
          <div
            className="bg-white/90 bg-cover bg-center bg-no-repeat rounded-xl p-4 shadow-sm border border-[#FCE7E9]"
            style={{ backgroundImage: "url('/dashboard-card-bg.png')" }}
          >
            <p className="text-sm text-gray-500">最高疼痛</p>
            <p className="text-2xl md:text-3xl font-bold text-orange-500">
              {maxPain}
              <span className="text-sm text-gray-400 ml-1">分</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">发生在 {maxPainDate}</p>
          </div>
          <div
            className="bg-white/90 bg-cover bg-center bg-no-repeat rounded-xl p-4 shadow-sm border border-[#FCE7E9]"
            style={{ backgroundImage: "url('/dashboard-card-bg.png')" }}
          >
            <p className="text-sm text-gray-500">疼痛天数</p>
            <p className="text-2xl md:text-3xl font-bold text-green-500">
              {painDays}
              <span className="text-sm text-gray-400 ml-1">天</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">最近7天中</p>
          </div>
          <div
            className="bg-white/90 bg-cover bg-center bg-no-repeat rounded-xl p-4 shadow-sm border border-[#FCE7E9]"
            style={{ backgroundImage: "url('/dashboard-card-bg.png')" }}
          >
            <p className="text-sm text-gray-500">记录完整度</p>
            <p className="text-2xl md:text-3xl font-bold text-purple-500">
              {completeness}%
            </p>
            <p className="text-xs text-gray-400 mt-1">{validDays}/7 天有记录</p>
          </div>
        </div>

        {/* 模块5：健康洞察总结 */}
        <section className="bg-[#FDF2F4] rounded-2xl border border-[#FCE7E9] p-6">
          <h2 className="text-base font-semibold text-gray-700 mb-2 flex items-center gap-2">
            💡 健康洞察
          </h2>
          <p className="text-gray-700 text-sm leading-relaxed">{insight}</p>
        </section>

        {/* 模块6：快捷导航卡片 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/reports"
            className="bg-white/90 bg-cover bg-center bg-no-repeat rounded-xl p-5 shadow-sm border border-[#FCE7E9] hover:shadow-md hover:border-[#FBC4D0] transition flex flex-col gap-2"
            style={{ backgroundImage: "url('/dashboard-card-bg.png')" }}
          >
            <span className="text-3xl">📊</span>
            <h3 className="font-semibold text-gray-800">健康报告</h3>
            <p className="text-sm text-gray-600">查看详细趋势和分析</p>
          </Link>
          <Link
            to="/knowledge"
            className="bg-white/90 bg-cover bg-center bg-no-repeat rounded-xl p-5 shadow-sm border border-[#FCE7E9] hover:shadow-md hover:border-[#FBC4D0] transition flex flex-col gap-2"
            style={{ backgroundImage: "url('/dashboard-card-bg.png')" }}
          >
            <span className="text-3xl">📚</span>
            <h3 className="font-semibold text-gray-800">知识科普</h3>
            <p className="text-sm text-gray-600">饮食与运动建议</p>
          </Link>
          <Link
            to="/profile"
            className="bg-white/90 bg-cover bg-center bg-no-repeat rounded-xl p-5 shadow-sm border border-[#FCE7E9] hover:shadow-md hover:border-[#FBC4D0] transition flex flex-col gap-2"
            style={{ backgroundImage: "url('/dashboard-card-bg.png')" }}
          >
            <span className="text-3xl">👤</span>
            <h3 className="font-semibold text-gray-800">个人中心</h3>
            <p className="text-sm text-gray-600">管理您的信息</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
