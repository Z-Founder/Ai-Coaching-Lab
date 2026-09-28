import type { SafetyAssessment, TurnContext, ModelResponse } from './types.ts'
export type SafetyEvaluator = (input: string, context: TurnContext) => Promise<SafetyAssessment>

// Development policy router, NOT a clinical or general semantic risk classifier.
// Combines current content, temporal/intent context, structured signals and history.
export async function localSafetyAssessment(input: string, context: TurnContext): Promise<SafetyAssessment> {
  const signals = { ...context.safetySignals }
  const recent = context.recentConversation.slice(-3).join(' ')
  const harm = /自杀|自伤|伤害自己|结束生命|不想活|杀人|伤害别人|suicid|kill myself|hurt myself|kill someone/i
  const urgent = /现在|马上|今晚|已经|immediate|tonight|right now/i
  const means = /药|刀|武器|楼顶|桥上|pills|weapon|roof/i
  const distress = /难受|绝望|撑不住|崩溃|痛苦|hopeless|overwhelmed/i
  const negated = /不打算|没有.*(?:想法|计划)|不会伤害|不会自伤|not going to|no intention/i.test(input)
  if (!signals.intent && harm.test(input)) signals.intent = negated ? 'unclear' : 'self-harm'
  if (!signals.immediacy && urgent.test(input) && harm.test(input)) signals.immediacy = 'immediate'
  if (!signals.capability && means.test(input) && harm.test(input)) signals.capability = 'available'
  if (!signals.meaning) signals.meaning = harm.test(input) ? 'danger' : distress.test(input) ? 'distress' : 'ordinary'
  signals.persistence ??= context.recentConversation.filter(t => harm.test(t) || distress.test(t)).length
  const dangerIntent = signals.intent === 'self-harm' || signals.intent === 'harm-other'
  const immediate = signals.immediacy === 'immediate'
  const capability = signals.capability === 'available'
  let state: SafetyAssessment['state'] = 'NORMAL'
  const reasonCodes: string[] = []
  if (context.safetyLatched || dangerIntent || (signals.meaning === 'danger' && (immediate || capability)) ||
      (harm.test(recent) && immediate && capability)) {
    state = 'SAFETY_MODE'
    reasonCodes.push(context.safetyLatched ? 'SESSION_SAFETY_LATCH' : 'INTENT_CONTEXT_RISK')
  } else if (signals.meaning === 'distress' || signals.meaning === 'danger' ||
    signals.intent === 'unclear' || (signals.persistence ?? 0) > 1) {
    state = 'ELEVATED_CONCERN'
    reasonCodes.push('DISTRESS_OR_UNCERTAINTY')
  } else reasonCodes.push('NO_LOCAL_SIGNAL_NOT_A_SAFETY_GUARANTEE')
  return { state, reasonCodes, source: 'local-dev', signals }
}
export async function routeSafety(input: string, context: TurnContext, evaluator: SafetyEvaluator = localSafetyAssessment): Promise<SafetyAssessment> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    const assessment = await Promise.race([
      evaluator(input, context),
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('timeout')), 1500) }),
    ])
    if (!assessment || !['NORMAL', 'ELEVATED_CONCERN', 'SAFETY_MODE'].includes(assessment.state) ||
        !Array.isArray(assessment.reasonCodes) || !assessment.signals) throw new Error('schema')
    if (context.safetyLatched) return { ...assessment, state: 'SAFETY_MODE', reasonCodes: ['SESSION_SAFETY_LATCH'] }
    return assessment
  } catch {
    return { state: 'SAFETY_MODE', reasonCodes: ['ASSESSMENT_UNAVAILABLE'], source: 'fallback', signals: {} }
  } finally { clearTimeout(timer) }
}
export function safetyResponse(failed = false): ModelResponse {
  return {
    kind: 'SAFETY', challenge: false, scientificClaim: false, questions: [],
    text: failed
      ? '暂时无法可靠判断安全状况，我们先暂停普通反思。若你此刻有危险，请联系当地急救或身边可信的人。系统不会代你联系或分享内容。'
      : '听起来此刻可能很难承受。先暂停普通反思。如果有立即危险，请联系当地急救或请可信的人来到身边；在安全可行时远离可能伤害自己的物品。系统不会代你联系或分享内容。',
  }
}
export const safetyResources = [
  { title: '寻找当地支持（由你决定是否打开）', url: 'https://findahelpline.com/', note: '外部目录；紧急危险请直接联系当地急救。不会自动发送聊天记录。' },
]
