import type { EvidenceMetadata, InterventionPlan, TurnContext, RelationshipAssessment, SafetyAssessment, ChangeStage } from '../coaching/types.ts'
export interface InterventionDefinition {
  id: string
  objective: string
  evidence: EvidenceMetadata
}
const define = (id: string, objective: string, method: string, useCase: string): InterventionDefinition => ({
  id, objective,
  evidence: { tier: 'D', method, useCase, limitation: '本地启发式练习，未经本产品疗效验证，不是诊断或治疗。' },
})
export const interventionRegistry: readonly InterventionDefinition[] = [
  define('supportive_reflection', '先承接感受，保留选择', '支持性复述', '非临床自我反思中的情绪承接'),
  define('clarification', '澄清一个当下问题', '单问题澄清', '普通目标的自我说明'),
  define('behavioral_activation_microstep', '选择一个可拒绝的小行动', '微小行动提示', '一般生活目标；不宣称抑郁治疗效果'),
  define('implementation_intention', '连接触发条件与下一步', '如果—那么行动提示', '用户自选非临床目标的开始提示'),
  define('after_action_review_lite', '从计划和现实的差异学习', '轻量行动复盘', '个人计划执行回顾'),
]
export interface InterventionRouterInput {
  safety: SafetyAssessment
  relationship: RelationshipAssessment
  context: TurnContext
  stage: ChangeStage
}
export function routeIntervention({ safety, relationship: r, context, stage }: InterventionRouterInput): InterventionPlan | undefined {
  if (safety.state === 'SAFETY_MODE' || r.userIntent === 'REST' || !context.consent.coaching) return undefined
  const confirmed = context.memories.filter(m => m.kind === 'CONFIRMED_PATTERN')
  const hypotheses = context.memories.filter(m => m.kind === 'WORKING_HYPOTHESIS')
  const recentDifficulty = context.recentOutcomes.some(o => o.nextStepAccepted === false)
  const preferGentle = context.preferences.preferReflection || confirmed.length > 0
  let id = 'clarification'
  if (r.cognitiveLoad === 'LOW' || r.emotionalIntensity === 'HIGH' || r.userIntent === 'DELEGATE_DECISION' || preferGentle) id = 'supportive_reflection'
  else if (r.userIntent === 'REVIEW' || context.problemType === 'follow-through') id = 'after_action_review_lite'
  else if (r.userIntent === 'ACTION' || stage === 'ACT') id = recentDifficulty || !context.goal ? 'behavioral_activation_microstep' : 'implementation_intention'
  const entry = interventionRegistry.find(i => i.id === id)!
  return {
    interventionId: id, objective: entry.objective, evidenceTier: entry.evidence.tier,
    challengeLevel: stage === 'CHALLENGE' && r.permissionToChallenge ? 1 : 0,
    cognitiveLoad: r.cognitiveLoad, requiredConsent: ['coaching'],
    reasonCodes: [
      'USER_GOAL_AND_CURRENT_CAPACITY',
      ...(confirmed.length ? ['CONFIRMED_STRATEGY_PREFERENCE'] : hypotheses.length ? ['HYPOTHESIS_LOW_WEIGHT_NO_AUTOMATIC_FACT'] : []),
      ...(recentDifficulty ? ['REDUCE_ACTION_EFFORT'] : []),
    ],
  }
}
