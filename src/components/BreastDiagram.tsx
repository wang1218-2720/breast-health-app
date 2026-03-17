import type { PainPositionKey } from '../types/dailyLog'
import { PAIN_POSITION_LABELS } from '../types/dailyLog'

const POSITIONS: PainPositionKey[] = [
  'left_outer_upper',
  'left_inner_upper',
  'left_outer_lower',
  'left_inner_lower',
  'right_inner_upper',
  'right_outer_upper',
  'right_inner_lower',
  'right_outer_lower',
]

// 左乳 4 个区域圆心 (viewBox 约 0-100)，右乳 4 个区域
// 左乳：外上、内上、外下、内下 → 左上、右上、左下、右下
const LEFT_CENTERS = [
  { cx: 28, cy: 28 }, // 左外上
  { cx: 38, cy: 28 }, // 左内上
  { cx: 28, cy: 52 }, // 左外下
  { cx: 38, cy: 52 }, // 左内下
]
const RIGHT_CENTERS = [
  { cx: 62, cy: 28 }, // 右内上
  { cx: 72, cy: 28 }, // 右外上
  { cx: 62, cy: 52 }, // 右内下
  { cx: 72, cy: 52 }, // 右外下
]

const ALL_CENTERS = [...LEFT_CENTERS, ...RIGHT_CENTERS]
const R = 12

interface BreastDiagramProps {
  selected: Set<PainPositionKey>
  onToggle: (key: PainPositionKey) => void
}

export default function BreastDiagram({ selected, onToggle }: BreastDiagramProps) {
  return (
    <div className="w-full max-w-xs mx-auto">
      <svg
        viewBox="0 0 100 80"
        className="w-full h-auto"
        aria-label="乳房疼痛位置示意图"
      >
        {/* 简易胸部轮廓（左右对称） */}
        <ellipse cx="33" cy="40" rx="22" ry="26" fill="none" stroke="#e5e7eb" strokeWidth="1.5" />
        <ellipse cx="67" cy="40" rx="22" ry="26" fill="none" stroke="#e5e7eb" strokeWidth="1.5" />
        {/* 8 个可点击区域 */}
        {POSITIONS.map((key, i) => {
          const { cx, cy } = ALL_CENTERS[i]
          const isSelected = selected.has(key)
          return (
            <circle
              key={key}
              cx={cx}
              cy={cy}
              r={R}
              fill={isSelected ? '#F472B6' : '#f3f4f6'}
              stroke={isSelected ? '#FBC4D0' : '#d1d5db'}
              strokeWidth={isSelected ? 2 : 1}
              className="cursor-pointer transition-colors hover:opacity-90"
              onClick={() => onToggle(key)}
              aria-pressed={isSelected}
              aria-label={PAIN_POSITION_LABELS[key]}
            />
          )
        })}
      </svg>
    </div>
  )
}

export { PAIN_POSITION_LABELS }
