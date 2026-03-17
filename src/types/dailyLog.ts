export type MoodKey =
  | 'excited'
  | 'happy'
  | 'relaxed'
  | 'sensitive'
  | 'anxious'
  | 'angry'
  | 'depressed'
  | 'sad'

export type PainTypeKey =
  | 'distension'
  | 'stabbing'
  | 'burning'
  | 'dull'
  | 'tenderness'
  | 'other'

export type PainPositionKey =
  | 'left_outer_upper'
  | 'left_inner_upper'
  | 'left_outer_lower'
  | 'left_inner_lower'
  | 'right_inner_upper'
  | 'right_outer_upper'
  | 'right_inner_lower'
  | 'right_outer_lower'

export type DietTagKey =
  | 'caffeine'
  | 'salty'
  | 'fatty'
  | 'spicy'
  | 'alcohol'
  | 'supplements'
  | 'fiber'
  | 'cold'

export interface MedicationItem {
  id: string
  name: string
  dose: string
  time: 'morning' | 'noon' | 'evening'
}

/** 单日记录 payload，用于 localStorage 与控制台输出 */
export interface DailyLogPayload {
  date: string // YYYY-MM-DD
  mood: MoodKey | null
  painLevel: number
  painTypes: PainTypeKey[]
  painPositions: PainPositionKey[]
  dietTags: DietTagKey[]
  dietOther: string
  medications: MedicationItem[]
}

export const DAILY_LOG_STORAGE_KEY = 'rukangbao-daily-log'

export const MOOD_OPTIONS: { key: MoodKey; label: string; emoji: string; bgColor: string }[] = [
  { key: 'excited', label: '兴奋', emoji: '🤩', bgColor: 'bg-amber-100 border-amber-400' },
  { key: 'happy', label: '开心', emoji: '😊', bgColor: 'bg-yellow-100 border-yellow-400' },
  { key: 'relaxed', label: '放松', emoji: '😌', bgColor: 'bg-green-100 border-green-400' },
  { key: 'sensitive', label: '敏感', emoji: '😟', bgColor: 'bg-sky-100 border-sky-400' },
  { key: 'anxious', label: '焦虑', emoji: '😰', bgColor: 'bg-orange-100 border-orange-400' },
  { key: 'angry', label: '生气', emoji: '😠', bgColor: 'bg-red-100 border-red-400' },
  { key: 'depressed', label: '压抑', emoji: '😔', bgColor: 'bg-slate-200 border-slate-400' },
  { key: 'sad', label: '悲伤', emoji: '😢', bgColor: 'bg-indigo-100 border-indigo-400' },
]

export const PAIN_TYPE_OPTIONS: { key: PainTypeKey; label: string }[] = [
  { key: 'distension', label: '胀痛' },
  { key: 'stabbing', label: '刺痛' },
  { key: 'burning', label: '烧灼感' },
  { key: 'dull', label: '隐痛' },
  { key: 'tenderness', label: '触痛' },
  { key: 'other', label: '其他' },
]

export const PAIN_POSITION_LABELS: Record<PainPositionKey, string> = {
  left_outer_upper: '左乳外上',
  left_inner_upper: '左乳内上',
  left_outer_lower: '左乳外下',
  left_inner_lower: '左乳内下',
  right_inner_upper: '右乳内上',
  right_outer_upper: '右乳外上',
  right_inner_lower: '右乳内下',
  right_outer_lower: '右乳外下',
}

export const DIET_TAG_OPTIONS: { key: DietTagKey; label: string }[] = [
  { key: 'caffeine', label: '咖啡因' },
  { key: 'salty', label: '高盐' },
  { key: 'fatty', label: '高脂' },
  { key: 'spicy', label: '辛辣' },
  { key: 'alcohol', label: '酒精' },
  { key: 'supplements', label: '保健品' },
  { key: 'fiber', label: '富含纤维' },
  { key: 'cold', label: '生冷' },
]

export const TIME_OPTIONS: { value: 'morning' | 'noon' | 'evening'; label: string }[] = [
  { value: 'morning', label: '早' },
  { value: 'noon', label: '中' },
  { value: 'evening', label: '晚' },
]
