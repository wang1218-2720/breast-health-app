import { useMemo, useRef, useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import ReactECharts from 'echarts-for-react'
import { format } from 'date-fns'
import {
  loadAllRecordsFromStorage,
  applyTimeRange,
  getMenstrualDaysFromStorage,
  type DailyRecord,
  type TimeRangeKey,
} from '../lib/reportData'
import { useUser } from '../context/UserContext'
import {
  getAIAnalysis,
  getAuxiliaryDiagnosis,
  type HealthData,
  getPainTypeInsight,
  type PainTypeSummaryInput,
  getDietMoodInsight,
  type DietMoodSummaryInput,
} from '../services/deepseek'

const PAIN_TYPE_LABELS: Record<string, string> = {
  distending: '胀痛',
  stabbing: '刺痛',
  burning: '烧灼感',
  dull: '隐痛',
  tender: '触痛',
  other: '其他',
}

const DIET_TAG_LABELS: Record<string, string> = {
  caffeine: '咖啡因',
  highSalt: '高盐',
  highFat: '高脂',
  spicy: '辛辣',
  alcohol: '酒精',
  supplements: '保健品',
  fiber: '富含纤维',
  cold: '生冷',
}

const POSITIVE_MOODS = new Set(['excited', 'happy', 'relaxed'])
const NEGATIVE_MOODS = new Set(['sensitive', 'anxious', 'angry', 'depressed', 'sad'])

const TIME_RANGE_OPTIONS: { value: TimeRangeKey; label: string }[] = [
  { value: '7', label: '最近7天' },
  { value: '30', label: '最近30天' },
  { value: '90', label: '最近90天' },
  { value: 'all', label: '全部记录' },
]

function useReportData(timeRange: TimeRangeKey) {
  return useMemo(() => {
    const allRecords = loadAllRecordsFromStorage()
    const { records, dateAxis, expectedDays } = applyTimeRange(allRecords, timeRange)
    const recordMap = new Map(allRecords.map((r) => [r.date, r]))
    const missingDays = expectedDays - records.length
    const menstrualDays = getMenstrualDaysFromStorage(dateAxis.length ? dateAxis : [])

    const dataCompleteness = expectedDays > 0 ? Math.round((records.length / expectedDays) * 100) : 0
    const quality = dataCompleteness >= 90 ? 'high' : dataCompleteness >= 70 ? 'medium' : 'low'

    const painValues = records.map((r) => r.painLevel).filter((v) => v != null && !Number.isNaN(v))
    const avgPain = painValues.length > 0 ? painValues.reduce((a, b) => a + b, 0) / painValues.length : 0
    const maxPain = painValues.length ? Math.max(...painValues) : 0
    const minPain = painValues.length ? Math.min(...painValues) : 0

    // 以“疼痛分数”作为权重，计算各类型疼痛在总疼痛中的占比
    const painTypeScoreMap: Record<string, { count: number; totalScore: number }> = {}
    const totalPainScore = records.reduce((sum, r) => {
      const level = r.painLevel ?? 0
      const types = r.painTypes || []
      if (!level || !types.length) return sum
      const share = level / types.length
      types.forEach((t) => {
        if (!painTypeScoreMap[t]) {
          painTypeScoreMap[t] = { count: 0, totalScore: 0 }
        }
        painTypeScoreMap[t].count += 1
        painTypeScoreMap[t].totalScore += share
      })
      return sum + level
    }, 0)

    const painTypeStats = Object.entries(painTypeScoreMap).map(([key, stat]) => ({
      key,
      name: PAIN_TYPE_LABELS[key] || key,
      count: stat.count,
      totalScore: Math.round(stat.totalScore * 10) / 10,
    }))

    const pieData = painTypeStats.map((item) => ({
      name: item.name,
      value: item.totalScore,
    }))

    const dietAnalysisRaw: { tag: string; label: string; withAvg: number; withoutAvg: number; count: number; diff: number }[] = []
    const allDietTags = Object.keys(DIET_TAG_LABELS)
    allDietTags.forEach((tag) => {
      const withTag = records.filter((r) => r.dietTags && r.dietTags.includes(tag))
      if (withTag.length < 3) return
      const withoutTag = records.filter((r) => !r.dietTags || !r.dietTags.includes(tag))
      const withAvg = withTag.reduce((s, r) => s + r.painLevel, 0) / withTag.length
      const withoutAvg = withoutTag.length > 0 ? withoutTag.reduce((s, r) => s + r.painLevel, 0) / withoutTag.length : 0
      const diff = withAvg - withoutAvg
      dietAnalysisRaw.push({
        tag,
        label: DIET_TAG_LABELS[tag],
        withAvg: Math.round(withAvg * 10) / 10,
        withoutAvg: Math.round(withoutAvg * 10) / 10,
        count: withTag.length,
        diff,
      })
    })
    const dietAnalysis = dietAnalysisRaw.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff)).map(({ diff, ...rest }) => rest)

    const moodPositive = records.filter((r) => r.mood && POSITIVE_MOODS.has(r.mood))
    const moodNegative = records.filter((r) => r.mood && NEGATIVE_MOODS.has(r.mood))
    const moodPositiveAvg = moodPositive.length > 0 ? moodPositive.reduce((s, r) => s + r.painLevel, 0) / moodPositive.length : null
    const moodNegativeAvg = moodNegative.length > 0 ? moodNegative.reduce((s, r) => s + r.painLevel, 0) / moodNegative.length : null

    const medRecords = records.filter((r) => r.medications && r.medications.length > 0)
    const medAnalysis: {
      name: string
      periodStart: string
      periodEnd: string
      days: number
      beforeAvg: number
      afterAvg: number
      improvement: number
      improvementPct: number
    }[] = []
    if (medRecords.length > 0) {
      const byDrug = new Map<string, DailyRecord[]>()
      medRecords.forEach((r) => {
        (r.medications || []).forEach((m) => {
          const name = (m.name || '').trim() || '未命名'
          if (!byDrug.has(name)) byDrug.set(name, [])
          byDrug.get(name)!.push(r)
        })
      })
      byDrug.forEach((recs, name) => {
        const sorted = [...recs].sort((a, b) => a.date.localeCompare(b.date))
        const start = sorted[0].date
        const end = sorted[sorted.length - 1].date
        const beforeDates: string[] = []
        const afterDates: string[] = []
        for (let i = 1; i <= 3; i++) {
          const d = new Date(start)
          d.setDate(d.getDate() - i)
          beforeDates.push(d.toISOString().slice(0, 10))
        }
        for (let i = 1; i <= 3; i++) {
          const d = new Date(end)
          d.setDate(d.getDate() + i)
          afterDates.push(d.toISOString().slice(0, 10))
        }
        const beforePains = beforeDates.map((d) => recordMap.get(d)?.painLevel).filter((v) => v != null) as number[]
        const afterPains = afterDates.map((d) => recordMap.get(d)?.painLevel).filter((v) => v != null) as number[]
        const beforeAvg = beforePains.length > 0 ? beforePains.reduce((a, b) => a + b, 0) / beforePains.length : 0
        const afterAvg = afterPains.length > 0 ? afterPains.reduce((a, b) => a + b, 0) / afterPains.length : 0
        const improvement = Math.round((beforeAvg - afterAvg) * 10) / 10
        const improvementPct = beforeAvg > 0 ? Math.round((improvement / beforeAvg) * 100) : 0
        medAnalysis.push({
          name,
          periodStart: start,
          periodEnd: end,
          days: sorted.length,
          beforeAvg: Math.round(beforeAvg * 10) / 10,
          afterAvg: Math.round(afterAvg * 10) / 10,
          improvement,
          improvementPct,
        })
      })
    }

    return {
      allRecords,
      records,
      dateAxis,
      expectedDays,
      missingDays,
      menstrualDays,
      recordMap,
      dataCompleteness,
      quality,
      avgPain: Math.round(avgPain * 10) / 10,
      maxPain,
      minPain,
      totalPainScore: Math.round(totalPainScore * 10) / 10,
      painTypeStats,
      pieData,
      dietAnalysis,
      moodPositiveAvg: moodPositiveAvg != null ? Math.round(moodPositiveAvg * 10) / 10 : null,
      moodNegativeAvg: moodNegativeAvg != null ? Math.round(moodNegativeAvg * 10) / 10 : null,
      medAnalysis,
    }
  }, [timeRange])
}

const RANGE_CHART_LABEL: Record<TimeRangeKey, string> = {
  '7': '最近7天',
  '30': '最近30天',
  '90': '最近90天',
  all: '全部记录',
}

export default function Reports() {
  const chartRef = useRef<ReactECharts>(null)
  const [timeRange, setTimeRange] = useState<TimeRangeKey>('30')
  const [isPrinting, setIsPrinting] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<string>('')
  const [auxiliaryDiagnosis, setAuxiliaryDiagnosis] = useState<string>('')
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [painTypeInsight, setPainTypeInsight] = useState<string>('')
  const [isLoadingPainInsight, setIsLoadingPainInsight] = useState(false)
  const [dietMoodInsight, setDietMoodInsight] = useState<string>('')
  const [isLoadingDietMoodInsight, setIsLoadingDietMoodInsight] = useState(false)
  const beforePrintTimeRangeRef = useRef<TimeRangeKey>('30')
  const data = useReportData(timeRange)
  const { user } = useUser()

  const fetchAIAnalysis = useCallback(async () => {
    setIsLoadingAI(true)
    try {
      const painDays = data.records.filter((r) => r.painLevel > 0).length
      const healthData: HealthData = {
        records: data.records.map((r) => ({
          date: r.date,
          painLevel: r.painLevel,
          painTypes: r.painTypes || [],
          dietTags: r.dietTags || [],
          mood: r.mood ?? null,
          medications: r.medications || [],
        })),
        stats: {
          avgPain: data.avgPain,
          maxPain: data.maxPain,
          minPain: data.minPain,
          painDays,
          totalDays: data.records.length,
        },
      }
      const analysis = await getAIAnalysis(healthData)
      setAiAnalysis(analysis)
      const diagnosis = await getAuxiliaryDiagnosis(healthData)
      setAuxiliaryDiagnosis(diagnosis)
    } catch (error) {
      console.error('获取AI分析失败:', error)
      setAiAnalysis('暂时无法获取AI分析，请稍后再试。')
      setAuxiliaryDiagnosis('')
    } finally {
      setIsLoadingAI(false)
    }
  }, [data.records, data.avgPain, data.maxPain, data.minPain])

  const fetchPainTypeInsight = useCallback(async () => {
    if (data.painTypeStats.length === 0 || !data.totalPainScore) {
      setPainTypeInsight('当前时间范围内暂无具体的疼痛类型记录，后续多记录几天后会自动生成分析。')
      return
    }
    setIsLoadingPainInsight(true)
    try {
      const input: PainTypeSummaryInput = {
        timeRangeLabel: RANGE_CHART_LABEL[timeRange],
        totalDays: data.records.length,
        totalPainScore: data.totalPainScore,
        painTypes: data.painTypeStats.map((item) => ({
          name: item.name,
          count: item.count,
          totalScore: item.totalScore,
        })),
      }
      const insight = await getPainTypeInsight(input)
      setPainTypeInsight(
        insight ||
          '已根据不同类型疼痛的占比完成计算，目前以胀痛、刺痛等为主，请结合日常记录留意是否与经期、饮食或情绪有关。'
      )
    } catch (error) {
      console.error('获取疼痛类型AI分析失败:', error)
      setPainTypeInsight('')
    } finally {
      setIsLoadingPainInsight(false)
    }
  }, [data.painTypeStats, data.records.length, data.totalPainScore, timeRange])

  const fetchDietMoodInsight = useCallback(async () => {
    if (data.dietAnalysis.length === 0 && data.moodPositiveAvg == null && data.moodNegativeAvg == null) {
      setDietMoodInsight('当前时间范围内饮食与情绪记录较少，暂时无法给出可靠的关联分析。')
      return
    }
    setIsLoadingDietMoodInsight(true)
    try {
      const input: DietMoodSummaryInput = {
        timeRangeLabel: RANGE_CHART_LABEL[timeRange],
        totalDays: data.records.length,
        dietItems: data.dietAnalysis,
        moodPositiveAvg: data.moodPositiveAvg,
        moodNegativeAvg: data.moodNegativeAvg,
      }
      const insight = await getDietMoodInsight(input)
      setDietMoodInsight(
        insight ||
          '已根据当前时间范围内的饮食与情绪记录完成计算，大致可看到部分饮食标签与疼痛轻重的趋势，同时情绪越放松、越积极时，疼痛往往更容易缓解。'
      )
    } catch (error) {
      console.error('获取饮食与情绪 AI 分析失败:', error)
      setDietMoodInsight('')
    } finally {
      setIsLoadingDietMoodInsight(false)
    }
  }, [data.dietAnalysis, data.moodPositiveAvg, data.moodNegativeAvg, data.records.length, timeRange])

  useEffect(() => {
    fetchAIAnalysis()
  }, [fetchAIAnalysis])

  useEffect(() => {
    fetchPainTypeInsight()
  }, [fetchPainTypeInsight])

  useEffect(() => {
    fetchDietMoodInsight()
  }, [fetchDietMoodInsight])

  const userBMI = user?.height && user?.weight 
    ? Math.round((user.weight / ((user.height / 100) ** 2)) * 10) / 10 
    : null

  const painTrendOption = useMemo(() => {
    const dateAxis = data.dateAxis
    const recordMap = data.recordMap
    const menstrualSet = new Set(data.menstrualDays)
    const xData = dateAxis.map((d) => format(new Date(d), 'MM-dd'))
    const lineData = dateAxis.map((d) => {
      const r = recordMap.get(d)
      return r != null ? r.painLevel : null
    })
    // 一条连续线，经期段用 visualMap 标红；[x 索引, y 疼痛值, 是否经期] 保证与横坐标日期一一对应
    const lineDataWithPeriod = dateAxis.map((d, i) => [i, lineData[i], menstrualSet.has(d) ? 1 : 0] as [number, number | null, number])
    const periodLabels = dateAxis.map((d) => (menstrualSet.has(d) ? '经期' : ''))

    const menstrualRanges: number[][] = data.menstrualDays
      .map((d) => {
        const i = dateAxis.indexOf(d)
        return i >= 0 ? [i - 0.5, i + 0.5] : null
      })
      .filter((x): x is number[] => x != null)

    // 打印预览专用：30 天 - 统一 9px 字体、实心深粉数据点、灰色坐标轴
    if (timeRange === '30' && isPrinting) {
      return {
        title: {
          text: '疼痛趋势（最近30天）',
          left: 'center',
          top: 5,
          textStyle: {
            fontSize: 14,
            fontWeight: 'bold',
            color: '#2D3748',
            fontFamily: 'sans-serif',
          },
        },
        tooltip: { show: false },
        grid: { left: '8%', right: '6%', bottom: '24%', top: '14%', containLabel: false },
        xAxis: [
          {
            type: 'category',
            data: xData,
            axisLabel: {
              interval: 0,
              rotate: 0,
              fontSize: 9,
              margin: 6,
              color: '#374151',
              fontWeight: 'normal',
              fontFamily: 'sans-serif',
              show: true,
              hideOverlap: false,
              formatter: (value: string) => {
                const [month = '', day = ''] = value.split('-')
                return `${month}/${day}`
              },
            },
            axisTick: {
              alignWithLabel: true,
              show: true,
              length: 4,
              lineStyle: { color: '#6B7280', width: 0.8 },
            },
            axisLine: { lineStyle: { color: '#6B7280', width: 1 } },
          },
          {
            type: 'category',
            data: periodLabels,
            gridIndex: 0,
            position: 'bottom',
            offset: 22,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: {
              fontSize: 8,
              color: '#6B7280',
              formatter: (value: string) => value,
            },
          },
        ],
        yAxis: {
          type: 'value',
          min: 0,
          max: 10,
          name: '疼痛评分',
          nameTextStyle: { fontSize: 9, color: '#374151' },
          nameGap: 8,
          axisLine: { show: true, lineStyle: { color: '#6B7280', width: 1 } },
          axisTick: { show: true, length: 4, lineStyle: { color: '#6B7280', width: 0.8 } },
          splitLine: {
            show: true,
            lineStyle: { color: '#D1D5DB', width: 0.5, type: 'dashed' as const },
          },
          axisLabel: { fontSize: 9, margin: 6, color: '#374151' },
        },
        visualMap: {
          type: 'piecewise',
          dimension: 2,
          show: false,
          pieces: [
            { value: 0, color: '#EC4899' },
            { value: 1, color: '#DC2626' },
          ],
          seriesIndex: 0,
        },
        series: [
          {
            name: '疼痛评分',
            type: 'line',
            xAxisIndex: 0,
            data: lineDataWithPeriod,
            encode: { x: 0, y: 1 },
            smooth: 0.2,
            lineStyle: { width: 1.8, color: '#EC4899' },
            itemStyle: { color: '#EC4899' },
            symbol: 'circle',
            symbolSize: 5,
            showSymbol: true,
            connectNulls: true,
            markLine: {
              silent: true,
              symbol: 'none',
              data: [{ type: 'average', name: '平均值' }],
              lineStyle: { color: '#94A3B8', width: 1, type: 'dashed' as const },
              label: {
                show: true,
                fontSize: 8,
                color: '#64748B',
                position: 'end' as const,
                formatter: (params: { value: number }) => `平均: ${params.value}`,
              },
            },
          },
        ],
        legend: {
          show: true,
          data: ['疼痛评分'],
          bottom: 2,
          left: 'center',
          icon: 'circle',
          itemWidth: 8,
          itemHeight: 8,
          itemGap: 10,
          textStyle: { fontSize: 9, color: '#374151' },
        },
        backgroundColor: '#ffffff',
        animation: false,
      }
    }

    return {
      title: {
        text: `疼痛趋势（${RANGE_CHART_LABEL[timeRange]}）`,
        left: 'center',
        textStyle: { fontSize: isPrinting ? 16 : 14, fontWeight: isPrinting ? 'bold' : 'normal', color: '#333' },
      },
      tooltip: isPrinting
        ? { show: false }
        : {
            trigger: 'axis' as const,
            formatter: (params: unknown) => {
              const p = params as { axisValue: string; value: number | number[]; seriesName: string; dataIndex?: number }[]
              if (!p?.length) return ''
              const axisVal = p[0].axisValue
              const idx = p[0].dataIndex ?? 0
              const dateKey = dateAxis[idx] ?? ''
              const raw = p[0].value
              const val = Array.isArray(raw) ? raw[1] : raw
              const which = menstrualSet.has(dateKey) ? '经期' : '普通时期'
              return `${axisVal}（${which}）<br/>疼痛评分: ${val != null ? `${val}分` : '—'}`
            },
          },
      grid: {
        left: isPrinting ? '6%' : '8%',
        right: isPrinting ? '4%' : '5%',
        top: isPrinting ? '14%' : '15%',
        bottom: isPrinting ? '24%' : '28%',
        containLabel: true,
      },
      xAxis: [
        {
          type: 'category',
          data: xData,
          axisLine: { lineStyle: { color: '#9ca3af' } },
          axisLabel: {
            color: '#374151',
            rotate: timeRange === '30' && !isPrinting ? 30 : isPrinting ? 0 : 45,
            interval: timeRange === '30' && !isPrinting ? 5 : 0,
            fontSize: isPrinting ? 9 : 10,
            margin: isPrinting ? 12 : 10,
          },
          axisTick: { alignWithLabel: true },
        },
        {
          type: 'category',
          data: periodLabels,
          gridIndex: 0,
          position: 'bottom',
          offset: 24,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: {
            fontSize: 9,
            color: '#6B7280',
          },
        },
      ],
      yAxis: {
        type: 'value',
        min: 0,
        max: 10,
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#d1d5db' } },
        axisLabel: { color: '#374151', fontSize: isPrinting ? 9 : undefined },
      },
      animation: !isPrinting,
      markArea: menstrualRanges.length
        ? {
            silent: true,
            itemStyle: { color: 'rgba(248, 113, 113, 0.15)' },
            data: menstrualRanges.map((range) => [{ xAxis: range[0] }, { xAxis: range[1] }]),
          }
        : undefined,
      visualMap: {
        type: 'piecewise',
        dimension: 2,
        show: false,
        pieces: [
          { value: 0, color: '#F472B6' },
          { value: 1, color: '#DC2626' },
        ],
        seriesIndex: 0,
      },
      legend: {
        show: true,
        data: ['疼痛评分'],
        bottom: 2,
        left: 'center',
        icon: 'circle',
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 12,
        textStyle: { color: '#374151', fontSize: 11 },
      },
      series: [
        {
          name: '疼痛评分',
          type: 'line',
          xAxisIndex: 0,
          data: lineDataWithPeriod,
          encode: { x: 0, y: 1 },
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 3, color: '#F472B6' },
          itemStyle: { color: '#F472B6' },
          areaStyle: { color: 'rgba(244, 114, 182, 0.1)' },
          connectNulls: true,
          markLine: {
            silent: true,
            data: [{ yAxis: data.avgPain, lineStyle: { type: 'dashed', color: '#9ca3af' }, label: { formatter: `平均 ${data.avgPain}` } }],
          },
        },
      ],
    }
  }, [data, timeRange, isPrinting])

  const pieOption = useMemo(() => {
    if (data.pieData.length === 0) {
      return {
        title: {
          text: '疼痛特征分布',
          left: 'center',
          textStyle: { fontSize: isPrinting ? 12 : 14 },
        },
        graphic: [
          {
            type: 'text',
            left: 'center',
            top: 'middle',
            style: { text: '暂无疼痛记录', fontSize: 14, fill: '#9ca3af' },
          },
        ],
      }
    }
    const colors = ['#F472B6', '#F9A8D4', '#FBC4D0', '#FCE7E9', '#FDF2F4', '#ec4899']
    return {
      title: {
        text: '疼痛特征分布',
        left: 'center',
        textStyle: { fontSize: isPrinting ? 12 : 14 },
      },
      tooltip: { trigger: 'item', formatter: '{b}: {c}分 ({d}%)' },
      legend: {
        orient: 'horizontal',
        bottom: isPrinting ? 2 : 0,
        textStyle: { fontSize: isPrinting ? 8 : 12 },
      },
      color: colors,
      series: [
        {
          type: 'pie',
          radius: isPrinting ? ['45%', '65%'] : ['40%', '70%'],
          center: ['50%', isPrinting ? '48%' : '45%'],
          data: data.pieData,
          label: {
            formatter: '{b}\n{d}%',
            fontSize: isPrinting ? 8 : 12,
          },
          emphasis: {
            itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.1)' },
          },
        },
      ],
    }
  }, [data.pieData, isPrinting])

  const exportPDF = () => {
    beforePrintTimeRangeRef.current = timeRange
    setTimeRange('30')
    setIsPrinting(true)
    setTimeout(() => {
      window.print()
      setTimeout(() => {
        setIsPrinting(false)
        setTimeRange(beforePrintTimeRangeRef.current)
      }, 500)
    }, 300)
  }

  const downloadCSV = () => {
    const headers = ['日期', '疼痛评分', '疼痛类型', '饮食标签', '情绪', '药物']
    const rows = data.records.map((r) => [
      r.date,
      String(r.painLevel),
      (r.painTypes || []).join(';'),
      (r.dietTags || []).join(';'),
      r.mood ?? '',
      (r.medications || []).map((m) => m.name).join(';'),
    ])
    const csv = [headers.join(','), ...rows.map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `舒汝日记数据_${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }


  const qualityLabel = data.quality === 'high' ? '🟢 高质量' : data.quality === 'medium' ? '🟡 中等质量' : '🔴 低质量'
  const qualityHint = data.quality === 'low' ? '（数据不足，仅供参考）' : ''
  const hasNoData = data.allRecords.length === 0

  if (hasNoData) {
    return (
      <div className="min-h-screen bg-[#FDF2F4] p-6 md:p-8 flex items-center justify-center">
        <div
          className="max-w-md mx-auto text-center bg-white/90 bg-cover bg-center bg-no-repeat rounded-2xl shadow-lg shadow-pink-100/50 border border-[#FCE7E9] p-8"
          style={{ backgroundImage: "url('/dashboard-card-bg.png')" }}
        >
          <p className="text-gray-700 text-lg mb-2">暂无记录，请先完成每日记录</p>
          <p className="text-gray-500 text-sm mb-6">完成每日记录后即可在此查看健康报告与趋势分析</p>
          <Link
            to="/daily-log"
            className="inline-block px-5 py-2.5 rounded-xl bg-[#F472B6] text-white font-medium hover:bg-[#FBC4D0] transition"
          >
            去记录
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDF2F4] p-6 md:p-8 print:bg-white print:p-0">
      <div className="max-w-5xl mx-auto space-y-6 print:max-w-none print:shadow-none print:space-y-4">
        {/* 时间范围选择 */}
        <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
          <h1 className="text-xl md:text-2xl font-bold text-gray-700">健康报告</h1>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRangeKey)}
            className="px-4 py-2 rounded-xl border border-[#FCE7E9] bg-white text-gray-700 text-sm focus:ring-2 focus:ring-[#FCE7E9] focus:border-[#F472B6] outline-none"
          >
            {TIME_RANGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* 模块1：患者信息摘要 */}
        <section
          className="bg-white/90 bg-cover bg-center bg-no-repeat rounded-2xl shadow-lg shadow-pink-100/50 border border-[#FCE7E9] p-6 print:bg-white print:shadow-none print:border print:break-inside-avoid"
          style={isPrinting ? undefined : { backgroundImage: "url('/dashboard-card-bg.png')" }}
        >
          <h2 className="text-lg font-semibold text-gray-700 mb-4">患者信息摘要</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <span>👤</span>
              <span>年龄：{user?.age || '未设置'}岁</span>
            </div>
            <div className="flex items-center gap-2">
              <span>📅</span>
              <span>月经状态：{user?.menstrualStatus || '未设置'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>⚖️</span>
              <span>BMI：{userBMI || '未设置'}（{userBMI ? (userBMI >= 18.5 && userBMI < 24 ? '正常范围' : '异常') : '-'})</span>
            </div>
            <div className="flex items-center gap-2">
              <span>📊</span>
              <span>记录天数：{data.records.length}天</span>
            </div>
            <div className="flex items-center gap-2 col-span-2 md:col-span-4">
              <span>🟢</span>
              <span>数据完整度：{data.dataCompleteness}%{qualityLabel}{qualityHint}</span>
            </div>
          </div>
          {data.expectedDays > 0 && data.records.length < data.expectedDays && (
            <p className="mt-2 text-xs text-amber-600">当前为{data.records.length}天记录，共{data.expectedDays}天范围。持续记录可获得更准确报告。</p>
          )}
        </section>

        {/* 模块2：疼痛趋势图 - 打印时美化、灰色坐标轴、实心深粉数据点 */}
        <section
          className="bg-white/90 bg-cover bg-center bg-no-repeat rounded-2xl shadow-lg shadow-pink-100/50 border border-[#FCE7E9] p-6 print:bg-white print:shadow-none print:border print:border-[#E2E8F0] print:p-6 print:break-inside-avoid"
          style={isPrinting ? undefined : { backgroundImage: "url('/dashboard-card-bg.png')" }}
        >
          {/* 打印专用：标题行 */}
          <div className="hidden print:flex print:justify-between print:items-center print:mb-4">
            <h3 className="text-sm font-medium text-[#2D3748]">📊 疼痛趋势分析</h3>
            <div className="flex items-center gap-3 print:gap-2">
              <span className="text-[10px] text-[#4A5568]">最近30天</span>
              <span className="text-[10px] font-medium text-[#EC4899]">{data.records.length}天有记录</span>
            </div>
          </div>
          <div className="w-full overflow-x-auto chart-container print:overflow-visible">
            <div className="min-w-[600px] h-[350px] print:min-w-0 print:w-full print:h-[220px]">
              <ReactECharts
                ref={chartRef}
                option={painTrendOption}
                style={{ width: '100%', height: '100%' }}
                opts={{ renderer: 'svg' }}
              />
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2 print:hidden">
            最高 {data.maxPain} 分 · 最低 {data.minPain} 分 · 平均 {data.avgPain} 分
          </p>
          {data.expectedDays > 0 && (
            <p className="text-xs text-gray-500 mt-1 print:hidden">
              横轴为最近{data.expectedDays}天，有记录 {data.records.length} 天
              {data.missingDays > 0 && `，缺失 ${data.missingDays} 天（图中以折线连接表示）`}
            </p>
          )}
          {/* 打印专用：四项统计小卡 - 浅灰背景 */}
          <div className="hidden print:grid print:grid-cols-4 print:gap-2 print:mt-5 print:gap-x-4">
            <div className="text-center print:py-1.5 print:rounded-lg print:bg-[#F8FAFC] print:border print:border-[#E2E8F0]">
              <p className="text-[8px] text-[#4A5568]">最高疼痛</p>
              <p className="text-sm font-bold text-[#EC4899]">{data.maxPain}分</p>
            </div>
            <div className="text-center print:py-1.5 print:rounded-lg print:bg-[#F8FAFC] print:border print:border-[#E2E8F0]">
              <p className="text-[8px] text-[#4A5568]">最低疼痛</p>
              <p className="text-sm font-bold text-[#10B981]">{data.minPain}分</p>
            </div>
            <div className="text-center print:py-1.5 print:rounded-lg print:bg-[#F8FAFC] print:border print:border-[#E2E8F0]">
              <p className="text-[8px] text-[#4A5568]">平均疼痛</p>
              <p className="text-sm font-bold text-[#F59E0B]">{data.avgPain}分</p>
            </div>
            <div className="text-center print:py-1.5 print:rounded-lg print:bg-[#F8FAFC] print:border print:border-[#E2E8F0]">
              <p className="text-[8px] text-[#4A5568]">记录率</p>
              <p className="text-sm font-bold text-[#8B5CF6]">{data.expectedDays > 0 ? Math.round((data.records.length / data.expectedDays) * 100) : 0}%</p>
            </div>
          </div>
          {/* 打印专用：图例与说明 - 含平均值线、实心红点说明 */}
          <div className="hidden print:flex print:justify-between print:items-center print:mt-4 print:pt-3 print:border-t print:border-[#E2E8F0]">
            <div className="flex items-center gap-4 print:gap-3 print:text-[8px] print:text-[#4A5568]">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#EC4899] print:w-2.5 print:h-2.5" />
                有记录
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-gray-200 print:w-2.5 print:h-2.5" />
                无记录
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-6 h-0.5 bg-[#94A3B8] print:w-5" />
                平均值
              </span>
              <span className="text-[#718096]">(30天)</span>
            </div>
            <span className="text-[7px] text-[#718096]">* 实心红点表示每日疼痛分值</span>
          </div>
        </section>

        {/* 模块3：疼痛特征分布 */}
        <section
          className="bg-white/90 bg-cover bg-center bg-no-repeat rounded-2xl shadow-lg shadow-pink-100/50 border border-[#FCE7E9] p-6 print:bg-white print:shadow-none print:border print:break-inside-avoid"
          style={isPrinting ? undefined : { backgroundImage: "url('/dashboard-card-bg.png')" }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-700">疼痛特征分布</h2>
            {isLoadingPainInsight && (
              <span className="text-xs text-gray-400">AI 正在分析不同类型疼痛占比…</span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
            <div className="md:col-span-2">
              <ReactECharts
                option={pieOption}
                style={{ height: isPrinting ? 220 : 280, width: '100%' }}
                opts={{ renderer: 'svg' }}
              />
            </div>
            <div className="md:col-span-1 flex flex-col h-full">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <span>🤖</span>
                  <span>AI 疼痛类型小结</span>
                </h3>
                {isLoadingPainInsight && (
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 border-2 border-[#F472B6] border-t-transparent rounded-full animate-spin" />
                    <span className="text-[11px] text-gray-400">分析中...</span>
                  </div>
                )}
              </div>
              {data.pieData.length === 0 ? (
                <div className="text-sm text-gray-500 bg-gradient-to-r from-[#FDF2F4] to-white rounded-2xl p-4 min-h-[120px] flex items-center">
                  <p>
                    最近时间范围内还没有记录到具体的疼痛类型，先坚持几天记录，AI 会根据不同类型疼痛的占比，帮你做一段温柔的小结。
                  </p>
                </div>
              ) : painTypeInsight ? (
                <div className="text-sm text-gray-700 leading-relaxed bg-gradient-to-r from-[#FDF2F4] to-white rounded-2xl p-4 min-h-[140px]">
                  <p className="whitespace-pre-line">{painTypeInsight}</p>
                </div>
              ) : (
                <div className="text-sm text-gray-400 bg-gradient-to-r from-[#FDF2F4] to-white rounded-2xl p-4 min-h-[120px] flex items-center">
                  <p>数据已计算完成，如未自动生成小结，可以稍后刷新页面或更换时间范围再试一次。</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 模块4：关联因素分析 */}
        <section
          className="bg-white/90 bg-cover bg-center bg-no-repeat rounded-2xl shadow-lg shadow-pink-100/50 border border-[#FCE7E9] p-6 print:bg-white print:shadow-none print:border print:break-inside-avoid"
          style={isPrinting ? undefined : { backgroundImage: "url('/dashboard-card-bg.png')" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-700">关联因素分析</h2>
            {isLoadingDietMoodInsight && (
              <span className="text-xs text-gray-400">AI 正在综合分析饮食与情绪的影响…</span>
            )}
          </div>
          <div className="space-y-4">
            {/* 上排：饮食 & 情绪，两列布局 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
              <h3 className="text-sm font-medium text-gray-600 mb-3">饮食关联</h3>
              {data.dietAnalysis.length === 0 ? (
                <p className="text-sm text-gray-500">暂无足够饮食记录（需至少3天含该标签）</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {data.dietAnalysis.map((item) => {
                    const diff = Math.round((item.withAvg - item.withoutAvg) * 10) / 10
                    const arrow = diff > 0.3 ? '⬆️' : diff < -0.3 ? '⬇️' : '➡️'
                    const color = diff > 0.3 ? 'text-red-600' : diff < -0.3 ? 'text-green-600' : 'text-gray-600'
                    return (
                      <li key={item.tag} className="flex flex-wrap items-center gap-1">
                        <span className="font-medium">{item.label}：</span>
                        <span>有摄入日 {item.withAvg}分 | 无 {item.withoutAvg}分</span>
                        <span className={color}>{arrow} {diff > 0 ? '+' : ''}{diff}分</span>
                      </li>
                    )
                  })}
                </ul>
              )}
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-3">情绪关联</h3>
                {data.moodPositiveAvg == null && data.moodNegativeAvg == null ? (
                  <p className="text-sm text-gray-500">暂无情绪记录</p>
                ) : (
                  <div className="space-y-2 text-sm text-gray-700">
                    <p>积极情绪日平均疼痛：{data.moodPositiveAvg ?? '—'} 分</p>
                    <p>消极情绪日平均疼痛：{data.moodNegativeAvg ?? '—'} 分</p>
                    {data.moodPositiveAvg != null && data.moodNegativeAvg != null && (
                      <p className="text-[#F472B6] font-medium">
                        差异：⬆️ +{Math.round((data.moodNegativeAvg - data.moodPositiveAvg) * 10) / 10} 分
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 下排：AI 关联小结，整行长矩形 */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <span>🤖</span>
                  <span>AI 关联小结</span>
                </h3>
                {isLoadingDietMoodInsight && (
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 border-2 border-[#F472B6] border-t-transparent rounded-full animate-spin" />
                    <span className="text-[11px] text-gray-400">分析中...</span>
                  </div>
                )}
              </div>
              {dietMoodInsight ? (
                <div className="text-sm text-gray-700 leading-relaxed bg-gradient-to-r from-[#FDF2F4] to-white rounded-2xl p-4 min-h-[140px]">
                  <p className="whitespace-pre-line">{dietMoodInsight}</p>
                </div>
              ) : (
                <div className="text-sm text-gray-400 bg-gradient-to-r from-[#FDF2F4] to-white rounded-2xl p-4 min-h-[120px] flex items-center">
                  <p>
                    当饮食标签和情绪记录积累到一定天数后，这里会自动生成一段关于“吃什么、心情如何”与疼痛关系的小结，让页面风格与下方 AI 健康分析保持统一。
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 模块5：药物反馈 */}
        {data.medAnalysis.length > 0 && (
          <section
            className="bg-white/90 bg-cover bg-center bg-no-repeat rounded-2xl shadow-lg shadow-pink-100/50 border border-[#FCE7E9] p-6 print:bg-white print:shadow-none print:border print:break-inside-avoid"
            style={isPrinting ? undefined : { backgroundImage: "url('/dashboard-card-bg.png')" }}
          >
            <h2 className="text-lg font-semibold text-gray-700 mb-4">药物反馈</h2>
            <ul className="space-y-4">
              {data.medAnalysis.map((m) => (
                <li key={m.name} className="border border-[#FCE7E9] rounded-xl p-4 bg-[#FDF2F4]/50">
                  <p className="font-medium text-gray-800">💊 {m.name}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    服药周期：{m.periodStart} - {m.periodEnd}（{m.days}天）
                  </p>
                  <p className="text-sm text-gray-600">服药前3天平均疼痛：{m.beforeAvg} 分</p>
                  <p className="text-sm text-gray-600">服药后3天平均疼痛：{m.afterAvg} 分</p>
                  <p className="text-sm text-green-600 mt-1">
                    改善程度：⬇️ 下降 {m.improvement} 分（{m.improvementPct}%）
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}
        {data.medAnalysis.length === 0 && (
          <section
            className="bg-white/90 bg-cover bg-center bg-no-repeat rounded-2xl shadow-lg shadow-pink-100/50 border border-[#FCE7E9] p-6 print:bg-white print:shadow-none print:border print:break-inside-avoid"
            style={isPrinting ? undefined : { backgroundImage: "url('/dashboard-card-bg.png')" }}
          >
            <h2 className="text-lg font-semibold text-gray-700 mb-2">药物反馈</h2>
            <p className="text-sm text-gray-500">无药物记录</p>
          </section>
        )}

        {/* 模块6：周期性规律（数据>2个月时展示，此处简化占位） */}
        {data.records.length >= 30 && (
          <section
            className="bg-white/90 bg-cover bg-center bg-no-repeat rounded-2xl shadow-lg shadow-pink-100/50 border border-[#FCE7E9] p-6 print:bg-white print:shadow-none print:border print:break-inside-avoid"
            style={isPrinting ? undefined : { backgroundImage: "url('/dashboard-card-bg.png')" }}
          >
            <h2 className="text-lg font-semibold text-gray-700 mb-4">周期性规律总结</h2>
            <p className="text-sm text-gray-600">经期前3天平均疼痛：6.2 分（示例）</p>
            <p className="text-sm text-gray-600">经期期间平均疼痛：4.5 分（示例）</p>
            <p className="text-sm text-gray-600">经后7天平均疼痛：2.1 分（示例）</p>
            <p className="text-sm text-[#F472B6] mt-2">结论：您的疼痛呈明显周期性，与月经周期相关。（需接入真实周期数据）</p>
          </section>
        )}

        {/* 模块7：AI 健康分析（替代原医生意见） */}
        <section
          className="bg-white/90 bg-cover bg-center bg-no-repeat rounded-2xl shadow-lg shadow-pink-100/50 border border-[#FCE7E9] p-6 print:bg-white print:shadow-none print:break-inside-avoid"
          style={isPrinting ? undefined : { backgroundImage: "url('/dashboard-card-bg.png')" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <span>🤖</span> AI健康分析
            </h2>
            {isLoadingAI && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-[#F472B6] border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-gray-400">分析中...</span>
              </div>
            )}
          </div>
          {aiAnalysis ? (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-[#FDF2F4] to-white p-5 rounded-xl">
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">{aiAnalysis}</p>
              </div>
              {auxiliaryDiagnosis && (
                <div className="bg-gradient-to-r from-[#F8F4F5] to-[#FDF2F4] p-5 rounded-xl border border-[#FCE7E9]">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">辅助诊断参考</h3>
                  <p className="text-gray-700 whitespace-pre-line leading-relaxed text-sm">
                    {auxiliaryDiagnosis}
                  </p>
                  <p className="text-xs text-gray-500 mt-3">
                    以上结论仅供参考，不可替代专业医疗诊断，如有不适请及时就医。
                  </p>
                </div>
              )}
            </div>
          ) : (
            !isLoadingAI && (
              <div className="text-center py-8 text-gray-400">暂无分析数据，请先完成每日记录</div>
            )
          )}
          <button
            type="button"
            onClick={fetchAIAnalysis}
            disabled={isLoadingAI}
            className="mt-3 text-sm text-[#F472B6] hover:underline disabled:opacity-50"
          >
            {isLoadingAI ? '分析中...' : '重新分析'}
          </button>
        </section>

        {/* 模块8：免责声明与按钮 */}
        <section className="space-y-4 print:break-inside-avoid">
          <p className="text-xs text-gray-500">
            ⚠️ 本报告由舒汝日记根据您的日常记录自动生成，仅供参考，不可替代专业医疗诊断。如有剧烈疼痛或异常情况，请及时就医。
          </p>
          <div className="flex flex-wrap gap-4 no-print">
            <button
              type="button"
              onClick={exportPDF}
              className="px-5 py-2.5 rounded-xl bg-[#F472B6] text-white font-medium hover:bg-[#FBC4D0] transition print:hidden"
            >
              📄 导出PDF
            </button>
            <button
              type="button"
              onClick={downloadCSV}
              className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition print:hidden"
            >
              📊 下载CSV原始数据
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
