import type { ModelResponse, RelationshipAssessment, TurnPlan } from './types.ts'
export function validateResponse(value: unknown, plan: TurnPlan, r: RelationshipAssessment): value is ModelResponse {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const v = value as Record<string, unknown>
  if (Object.keys(v).some(k => !['kind', 'text', 'questions', 'challenge', 'scientificClaim'].includes(k))) return false
  if (!['COACHING', 'SUPPORT', 'SAFETY'].includes(String(v.kind)) ||
    typeof v.text !== 'string' || typeof v.challenge !== 'boolean' || typeof v.scientificClaim !== 'boolean' ||
    !Array.isArray(v.questions) || !v.questions.every(q => typeof q === 'string')) return false
  const text = v.text + v.questions.join('')
  if (text.length > r.responseLength || v.questions.length > plan.questionBudget ||
    (text.match(/[?？]/g)?.length ?? 0) > plan.questionBudget) return false
  if (v.challenge && !plan.challengeAllowed) return false
  if (v.scientificClaim) return false // No empirical claims are licensed by this local registry.
  if (/你必须|你就是|你总是|替你决定|已通知|已经联系|确诊|科学证明|scientifically proven|you must|you are diagnosed/i.test(text)) return false
  if (!plan.coachingAllowed && v.kind === 'COACHING') return false
  if (plan.stage === 'SUSPENDED' && (v.kind !== 'SAFETY' || v.challenge || v.questions.length > 0 ||
    /长期目标|年度计划|深入探索|journaling|挑战你的/.test(text))) return false
  if (plan.stage !== 'SUSPENDED' && v.kind === 'SAFETY') return false
  return true
}
