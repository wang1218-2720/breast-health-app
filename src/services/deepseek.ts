import axios from 'axios'

// 生产环境建议将 API Key 放在环境变量或后端
const DEEPSEEK_API_KEY = 'sk-5f8fd4cf4f14400f96df921aeefedf50'
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'

/** 所有 DeepSeek 回复统一要求：不使用 * # 等特殊符号 */
const NO_SPECIAL_CHARS = '回复中不要使用 * # 等特殊符号，请用纯中文和标点。'

export interface HealthData {
  records: {
    date: string
    painLevel: number
    painTypes: string[]
    dietTags: string[]
    mood: string | null
    medications: { id: string; name: string; dose: string; time: string }[]
  }[]
  stats: {
    avgPain: number
    maxPain: number
    minPain: number
    painDays: number
    totalDays: number
  }
}

export interface LaibaoChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface PainTypeSummaryInput {
  /**
   * 时间范围标签，例如“最近7天”“最近30天”“最近90天”“全部记录”
   */
  timeRangeLabel: string
  /**
   * 该时间范围内有记录的天数
   */
  totalDays: number
  /**
   * 该时间范围内所有记录的总疼痛分数（按每日疼痛评分累加）
   */
  totalPainScore: number
  /**
   * 各疼痛类型在该时间范围内的统计（已按疼痛分数加权）
   */
  painTypes: {
    name: string // 中文名称，例如“胀痛”
    count: number // 出现的天数
    totalScore: number // 分到该类型上的总疼痛分数
  }[]
}

export interface DietMoodSummaryInput {
  /**
   * 时间范围标签，例如“最近30天”
   */
  timeRangeLabel: string
  /**
   * 该时间范围内有记录的天数
   */
  totalDays: number
  /**
   * 饮食标签与疼痛的统计（已在前端按标签聚合）
   */
  dietItems: {
    label: string
    withAvg: number
    withoutAvg: number
    count: number
  }[]
  /**
   * 情绪与疼痛的统计（将情绪分为积极/消极）
   */
  moodPositiveAvg: number | null
  moodNegativeAvg: number | null
}

export async function getAIAnalysis(healthData: HealthData): Promise<string> {
  try {
    const prompt = buildPrompt(healthData)

    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content:
              '你是一个专业的女性乳房健康顾问，温柔、专业、有同理心。根据用户的健康记录数据，提供个性化的分析和建议。请用中文回复，语气温暖亲切，字数控制在200字以内。' +
              ' ' +
              NO_SPECIAL_CHARS,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
        stream: false,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        },
      }
    )

    return response.data.choices[0].message.content
  } catch (error) {
    console.error('AI分析请求失败:', error)
    return '暂时无法获取AI分析，请稍后再试。'
  }
}

/** 辅助诊断：基于用户记录数据，从多因素综合分析，给出与乳腺相关的辅助参考结论（非确诊） */
export async function getAuxiliaryDiagnosis(healthData: HealthData): Promise<string> {
  try {
    const prompt = buildAuxiliaryDiagnosisPrompt(healthData)
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content:
              '你是一位谨慎、专业的女性乳腺健康顾问。根据用户提供的健康记录数据，从疼痛程度、疼痛类型、持续时间、饮食与情绪关联等多方面综合分析，给出与常见乳腺问题相关的辅助参考结论。结论仅供用户参考、提醒就医方向，不可替代临床诊断。语气温和、客观，避免夸大或恐吓。字数控制在150字以内。' +
              ' ' +
              NO_SPECIAL_CHARS,
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,
        max_tokens: 350,
        stream: false,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        },
      }
    )
    return response.data.choices[0].message.content
  } catch (error) {
    console.error('辅助诊断请求失败:', error)
    return '暂时无法生成辅助诊断参考，请稍后再试。'
  }
}

function buildAuxiliaryDiagnosisPrompt(data: HealthData): string {
  const { records, stats } = data
  const painTypeDistribution = analyzePainTypes(records)
  const dietCorrelation = analyzeDietCorrelation(records)
  const moodCorrelation = analyzeMoodCorrelation(records)
  const highPainDays = records.filter((r) => r.painLevel >= 6).length
  const continuousHigh = records
    .map((r) => (r.painLevel >= 5 ? 1 : 0))
    .join('')
  const maxConsecutive = (continuousHigh.match(/1+/g) || []).reduce(
    (max, s) => Math.max(max, s.length),
    0
  )

  return `
请根据以下用户健康记录，从多因素综合给出与乳腺相关的辅助诊断参考（结论仅供参考，不替代就医）：

【数据概况】
记录天数：${stats.totalDays}天；有疼痛记录：${stats.painDays}天；平均疼痛：${stats.avgPain.toFixed(1)}分；最高：${stats.maxPain}分；最低：${stats.minPain}分。
疼痛≥6分的天数：${highPainDays}天；连续较高疼痛（≥5分）最长约：${maxConsecutive}天。

【疼痛类型分布】
${painTypeDistribution}

【饮食关联】
${dietCorrelation}

【情绪关联】
${moodCorrelation}

请从上述数据出发，简要分析可能相关的常见乳腺健康方向（如周期性不适、与激素/情绪/饮食的关联等），并给出是否建议进一步就医或观察的参考结论。不要使用 * # 等符号，用连贯段落表述。
`
}

export async function getPainTypeInsight(input: PainTypeSummaryInput): Promise<string> {
  try {
    const { timeRangeLabel, totalDays, totalPainScore, painTypes } = input

    const detailLines =
      painTypes.length === 0
        ? '当前时间范围内没有记录到具体的疼痛类型。'
        : painTypes
            .map((item) => {
              const share = totalPainScore > 0 ? ((item.totalScore / totalPainScore) * 100).toFixed(1) : '0.0'
              return `- ${item.name}：出现天数 ${item.count} 天，累积疼痛分约 ${item.totalScore.toFixed(
                1
              )} 分，占总疼痛分约 ${share}%`
            })
            .join('\n')

    const summaryPrompt = `
请根据下面关于乳房疼痛类型分布的数据，做一个简短的小结，用中文回复，语气温柔、专业，字数控制在120字以内，不要重复原始数字，只需要用通俗的话帮用户理解哪几种疼痛更常见，以及需要注意的方向。

【时间范围】${timeRangeLabel}（有记录天数：${totalDays}天，总疼痛分约 ${totalPainScore.toFixed(1)} 分）
【按疼痛分数加权的类型统计】
${detailLines}
`

    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content:
              '你是“舒汝日记”的乳房健康小顾问，现在要根据不同疼痛类型的占比，给出一个简短的小结。请使用温柔、安抚的语气，只用中文，不超过120字。' +
              ' ' +
              NO_SPECIAL_CHARS,
          },
          {
            role: 'user',
            content: summaryPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
        stream: false,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        },
      }
    )

    return response.data.choices[0].message.content
  } catch (error) {
    console.error('疼痛类型AI分析请求失败:', error)
    return ''
  }
}

export async function getDietMoodInsight(input: DietMoodSummaryInput): Promise<string> {
  try {
    const { timeRangeLabel, totalDays, dietItems, moodPositiveAvg, moodNegativeAvg } = input

    const dietLines =
      dietItems.length === 0
        ? '当前时间范围内，没有某一类饮食标签出现次数足够多，暂时无法做可靠的饮食关联分析。'
        : dietItems
            .map((item) => {
              const diff = Number((item.withAvg - item.withoutAvg).toFixed(1))
              const direction = diff > 0 ? '有该标签的日子疼痛略高' : diff < 0 ? '有该标签的日子疼痛略低' : '差异不明显'
              return `- ${item.label}：有标签日平均 ${item.withAvg.toFixed(
                1
              )} 分，无标签日平均 ${item.withoutAvg.toFixed(1)} 分（${direction}，样本天数约 ${item.count} 天）`
            })
            .join('\n')

    let moodLine = '当前时间范围内情绪记录较少，暂时无法稳定判断情绪与疼痛的关系。'
    if (moodPositiveAvg != null || moodNegativeAvg != null) {
      const pos = moodPositiveAvg != null ? moodPositiveAvg.toFixed(1) : '—'
      const neg = moodNegativeAvg != null ? moodNegativeAvg.toFixed(1) : '—'
      const diff =
        moodPositiveAvg != null && moodNegativeAvg != null
          ? Number((moodNegativeAvg - moodPositiveAvg).toFixed(1))
          : null
      const trend =
        diff == null
          ? ''
          : diff > 0
          ? `整体来看，情绪偏消极时疼痛往往更明显（约高 ${diff} 分左右）。`
          : diff < 0
          ? `整体来看，在更放松、积极的日子里，疼痛往往更轻（约低 ${Math.abs(diff)} 分左右）。`
          : '整体来看，积极与消极情绪日的疼痛差异不大。'
      moodLine = `积极情绪日平均疼痛约 ${pos} 分，消极情绪日约 ${neg} 分。${trend}`
    }

    const prompt = `
请根据以下关于饮食标签和情绪与乳房疼痛关系的数据，做一个简短、通俗的小结，用中文回复，语气温柔、专业，整体控制在180字以内。

【时间范围】${timeRangeLabel}（有记录天数：${totalDays}天）

【饮食标签与疼痛】
${dietLines}

【情绪与疼痛】
${moodLine}

请帮用户用简单话总结：
1）哪些饮食模式可能与疼痛加重或减轻有关（只强调趋势，不绝对化）；
2）情绪和疼痛的大致关系；
3）2-3条温柔的小建议，比如记录饮食、适度控制刺激性食物、关注情绪调节等。
`

    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content:
              '你是“舒汝日记”的乳房健康顾问，需要根据饮食与情绪数据，给出简短的关联分析和建议。请用温柔、鼓励的语气，只用中文回答，避免吓唬用户，不给具体医学诊断。' +
              ' ' +
              NO_SPECIAL_CHARS,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 400,
        stream: false,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        },
      }
    )

    return response.data.choices[0].message.content
  } catch (error) {
    console.error('饮食与情绪 AI 分析请求失败:', error)
    return ''
  }
}

/** 专家文章：根据用户症状摘要生成一篇专家解读风格的文章（供知识科普-专家文章使用） */
export async function getExpertArticle(symptomSummary: string): Promise<string> {
  try {
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content:
              '你是一位女性乳腺健康领域的专家，擅长撰写科普与解读类文章。请根据用户提供的症状与记录摘要，写一篇结构清晰、语气专业且温和的「专家解读」文章，约800～1200字。' +
              '文章需包含：一、对用户当前状况的简要概括；二、与症状相关的医学常识与文献共识（可模拟综合知网等学术资料中的常见结论）；三、生活与饮食建议；四、何时建议就医的提示。' +
              '全文使用中文，段落分明，不要使用 * # 等特殊符号，不要使用 Markdown 标题符号。可直接用「一、」「二、」或「首先」「其次」等连接。' +
              ' ' +
              NO_SPECIAL_CHARS,
          },
          {
            role: 'user',
            content: `请根据以下用户健康记录摘要，生成一篇专家解读文章：\n\n${symptomSummary}`,
          },
        ],
        temperature: 0.6,
        max_tokens: 2500,
        stream: false,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        },
      }
    )
    return response.data.choices[0].message.content
  } catch (error) {
    console.error('专家文章生成失败:', error)
    return '暂时无法生成专家文章，请稍后再试。'
  }
}

export async function chatWithLaibao(content: string): Promise<string> {
  try {
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content:
              '你是一个叫“奶宝”的可爱AI小助手，形象是粉色奶萌小桃子，性格温柔、积极、会用简单温暖的话安慰和鼓励用户，只用中文回复。' +
              ' ' +
              NO_SPECIAL_CHARS,
          },
          {
            role: 'user',
            content,
          },
        ],
        temperature: 0.8,
        max_tokens: 300,
        stream: false,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        },
      }
    )
    return response.data.choices[0].message.content
  } catch (error) {
    console.error('奶宝对话请求失败:', error)
    return '暂时联系不上奶宝，请稍后再试~'
  }
}

export async function chatWithLaibaoConversation(
  history: LaibaoChatMessage[]
): Promise<string> {
  try {
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content:
              '你是一个叫“奶宝”的可爱AI小助手，形象是粉色奶萌小桃子，性格温柔、积极、会用简单温暖的话安慰和鼓励用户，只用中文回复，回答简短一些。' +
              ' ' +
              NO_SPECIAL_CHARS,
          },
          ...history,
        ],
        temperature: 0.8,
        max_tokens: 400,
        stream: false,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        },
      }
    )
    return response.data.choices[0].message.content
  } catch (error) {
    console.error('奶宝连续对话请求失败:', error)
    return '奶宝有点累啦，稍后再聊好不好呀~'
  }
}

export async function getDailyReminder(summary: string): Promise<string> {
  try {
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content:
              '你是“舒汝日记”的健康提醒助手，请根据用户最近的疼痛记录和信息，用不超过30个字给出一句温柔的每日提醒，可以是提醒记录日记、经期前后注意事项、休息和情绪安抚等。不出现具体日期，不重复用户原话，只输出提醒内容本身。' +
              ' ' +
              NO_SPECIAL_CHARS,
          },
          {
            role: 'user',
            content: summary,
          },
        ],
        temperature: 0.9,
        max_tokens: 60,
        stream: false,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        },
      }
    )
    return response.data.choices[0].message.content
  } catch (error) {
    console.error('每日提醒请求失败:', error)
    return '今天也要温柔对待自己，记得记录身体的小变化哦～'
  }
}

function buildPrompt(data: HealthData): string {
  const { records, stats } = data
  const dietCorrelation = analyzeDietCorrelation(records)
  const moodCorrelation = analyzeMoodCorrelation(records)
  const painTypeDistribution = analyzePainTypes(records)

  return `
请根据以下用户的${stats.totalDays}天乳房健康记录数据，提供一份温暖的AI健康分析：

【数据概况】
- 记录天数：${stats.totalDays}天
- 有疼痛记录的天数：${stats.painDays}天
- 平均疼痛评分：${stats.avgPain.toFixed(1)}分（0-10分）
- 最高疼痛：${stats.maxPain}分
- 最低疼痛：${stats.minPain}分

【疼痛类型分布】
${painTypeDistribution}

【饮食关联分析】
${dietCorrelation}

【情绪关联分析】
${moodCorrelation}

请以“亲爱的”开头，给出包含以下内容的分析：
1. 对用户当前状况的温暖解读
2. 发现的有价值规律（如与饮食、情绪的关系）
3. 2-3条具体的、可操作的健康建议
4. 一句温暖的鼓励

请用中文回复，语气温柔亲切，像一位贴心的健康顾问。
`
}

function analyzeDietCorrelation(
  records: HealthData['records']
): string {
  const dietTags = ['caffeine', 'highSalt', 'spicy', 'alcohol']
  const results: string[] = []

  for (const tag of dietTags) {
    const withTag = records.filter((r) => r.dietTags?.includes(tag) && r.painLevel > 0)
    const withoutTag = records.filter((r) => !r.dietTags?.includes(tag) && r.painLevel > 0)

    if (withTag.length > 2) {
      const avgWith = withTag.reduce((sum, r) => sum + r.painLevel, 0) / withTag.length
      const avgWithout =
        withoutTag.length > 0
          ? withoutTag.reduce((sum, r) => sum + r.painLevel, 0) / withoutTag.length
          : avgWith

      const diff = (avgWith - avgWithout).toFixed(1)
      const tagName: Record<string, string> = {
        caffeine: '咖啡因',
        highSalt: '高盐',
        spicy: '辛辣',
        alcohol: '酒精',
      }
      const name = tagName[tag] || tag

      if (Math.abs(Number(diff)) > 0.5) {
        results.push(
          `- ${name}摄入日平均疼痛${avgWith.toFixed(1)}分，比不摄入时${Number(diff) > 0 ? '高' : '低'}${Math.abs(Number(diff))}分`
        )
      }
    }
  }

  return results.length > 0 ? results.join('\n') : '- 未发现明显的饮食关联'
}

function analyzeMoodCorrelation(
  records: HealthData['records']
): string {
  const positiveMoods = ['happy', 'excited', 'relaxed']
  const negativeMoods = ['sensitive', 'anxious', 'angry', 'depressed', 'sad']

  const positiveDays = records.filter(
    (r) => r.mood && positiveMoods.includes(r.mood) && r.painLevel > 0
  )
  const negativeDays = records.filter(
    (r) => r.mood && negativeMoods.includes(r.mood) && r.painLevel > 0
  )

  if (positiveDays.length > 2 && negativeDays.length > 2) {
    const avgPositive =
      positiveDays.reduce((sum, r) => sum + r.painLevel, 0) / positiveDays.length
    const avgNegative =
      negativeDays.reduce((sum, r) => sum + r.painLevel, 0) / negativeDays.length
    const diff = (avgNegative - avgPositive).toFixed(1)
    return `积极情绪日平均疼痛${avgPositive.toFixed(1)}分，消极情绪日平均疼痛${avgNegative.toFixed(1)}分，相差${diff}分`
  }

  return '- 情绪数据不足，暂时无法分析关联'
}

function analyzePainTypes(records: HealthData['records']): string {
  const painTypeCount: Record<string, number> = {}
  let total = 0

  records.forEach((r) => {
    if (r.painTypes && r.painLevel > 0) {
      r.painTypes.forEach((type: string) => {
        painTypeCount[type] = (painTypeCount[type] || 0) + 1
        total++
      })
    }
  })

  if (total === 0) return '无疼痛记录'

  const typeName: Record<string, string> = {
    distending: '胀痛',
    stabbing: '刺痛',
    burning: '烧灼感',
    dull: '隐痛',
    tender: '触痛',
    other: '其他',
  }

  return Object.entries(painTypeCount)
    .map(([type, count]) => {
      const percentage = ((count / total) * 100).toFixed(0)
      const name = typeName[type] || type
      return `- ${name}: ${percentage}%`
    })
    .join('\n')
}
