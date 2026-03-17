/** 与每日记录页存储格式一致 */
export interface DailyRecord {
  date: string
  mood: string | null
  painLevel: number
  painTypes: string[]
  painPositions: string[]
  dietTags: string[]
  dietOther: string
  medications: { id: string; name: string; dose: string; time: string }[]
}

export const DAILY_LOG_STORAGE_KEY = 'daily-log'

const STORAGE_PREFIX = `${DAILY_LOG_STORAGE_KEY}-`

/** 从 localStorage 读取所有以 daily-log- 开头的记录，按日期倒序 */
export function loadAllRecordsFromStorage(): DailyRecord[] {
  const records: DailyRecord[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key?.startsWith(STORAGE_PREFIX)) continue
    const dateKey = key.slice(STORAGE_PREFIX.length)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) continue
    const raw = localStorage.getItem(key)
    if (!raw) continue
    try {
      const data = JSON.parse(raw) as Record<string, unknown>
      if (!data || typeof data !== 'object') continue
      const painLevel = typeof data.painLevel === 'number' && !Number.isNaN(data.painLevel) ? data.painLevel : 0
      records.push({
        date: dateKey,
        mood: (data.mood as string) ?? null,
        painLevel,
        painTypes: Array.isArray(data.painTypes) ? (data.painTypes as string[]) : [],
        painPositions: Array.isArray(data.painPositions) ? (data.painPositions as string[]) : [],
        dietTags: Array.isArray(data.dietTags) ? (data.dietTags as string[]) : [],
        dietOther: typeof data.dietOther === 'string' ? data.dietOther : '',
        medications: Array.isArray(data.medications) ? (data.medications as DailyRecord['medications']) : [],
      })
    } catch (_) {
      // skip invalid
    }
  }
  records.sort((a, b) => b.date.localeCompare(a.date))
  return records
}

/** 格式化为本地 YYYY-MM-DD，与 DailyLog 存储 key 一致 */
function toLocalDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** 获取最近 N 天的日期字符串 YYYY-MM-DD（本地日期，从今天往前） */
export function getLastNDays(n: number): string[] {
  const out: string[] = []
  const today = new Date()
  for (let i = 0; i < n; i++) {
    const x = new Date(today)
    x.setDate(x.getDate() - i)
    out.push(toLocalDateStr(x))
  }
  return out.reverse()
}

/** 从 localStorage 按日期逐日读取最近 N 天，确保与 DailyLog 的 key 一致 */
export function loadLastNDaysRecords(n: number): { records: DailyRecord[]; missingDays: number; dates: string[] } {
  const dates = getLastNDays(n)
  const records: DailyRecord[] = []
  for (const dateKey of dates) {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${dateKey}`)
    if (!raw) continue
    try {
      const data = JSON.parse(raw) as Record<string, unknown>
      if (!data || typeof data !== 'object') continue
      const painLevel = typeof data.painLevel === 'number' && !Number.isNaN(data.painLevel) ? data.painLevel : 0
      records.push({
        date: dateKey,
        mood: (data.mood as string) ?? null,
        painLevel,
        painTypes: Array.isArray(data.painTypes) ? (data.painTypes as string[]) : [],
        painPositions: Array.isArray(data.painPositions) ? (data.painPositions as string[]) : [],
        dietTags: Array.isArray(data.dietTags) ? (data.dietTags as string[]) : [],
        dietOther: typeof data.dietOther === 'string' ? data.dietOther : '',
        medications: Array.isArray(data.medications) ? (data.medications as DailyRecord['medications']) : [],
      })
    } catch (_) {
      // skip invalid
    }
  }
  const missingDays = n - records.length
  return { records, missingDays, dates }
}

/** 最近 30 天记录（用于报告首屏） */
export function loadLast30DaysRecords(): { records: DailyRecord[]; missingDays: number } {
  const { records, missingDays } = loadLastNDaysRecords(30)
  return { records, missingDays }
}

export type TimeRangeKey = '7' | '30' | '90' | 'all'

/** 根据时间范围从已排序的完整记录中截取并生成日期轴（最近 N 个自然日或全部） */
export function applyTimeRange(
  allRecords: DailyRecord[],
  range: TimeRangeKey
): { records: DailyRecord[]; dateAxis: string[]; expectedDays: number } {
  if (range === 'all') {
    const dates = [...new Set(allRecords.map((r) => r.date))].sort()
    const recordMap = new Map<string, DailyRecord>()
    allRecords.forEach((r) => recordMap.set(r.date, r))
    const records = dates.map((d) => recordMap.get(d)).filter((r): r is DailyRecord => r != null)
    return {
      records,
      dateAxis: dates,
      expectedDays: dates.length,
    }
  }
  const expectedDays = Number(range)
  const dateAxis = getLastNDays(expectedDays)
  const set = new Set(dateAxis)
  const records = allRecords.filter((r) => set.has(r.date))
  return { records, dateAxis, expectedDays }
}

/** 用户基础信息（模拟，后期可从用户档案获取） */
export const mockUserInfo = {
  age: 35,
  menstrualStatus: '规律',
  bmi: 21.5,
  height: 165,
  weight: 58,
}

/** 从 localStorage 读取经期日期，与每日记录页日历中勾选“今天是否在经期”的记录一致 */
export function getMenstrualDaysFromStorage(dateAxis: string[]): string[] {
  const out: string[] = []
  try {
    for (const dateKey of dateAxis) {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${dateKey}`)
      if (!raw) continue
      const data = JSON.parse(raw) as { menstrual?: { isPeriod?: boolean }; date?: string }
      if (data?.menstrual?.isPeriod === true) out.push(dateKey)
    }
  } catch {
    // ignore
  }
  return out
}
