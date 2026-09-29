import type { RelationshipAssessment, SafetyAssessment, TurnContext } from './types.ts'
export function assessRelationship(input: string, context: TurnContext, safety: SafetyAssessment): RelationshipAssessment {
  const rest = /今天不解决|不想说|先休息|不想聊/.test(input)
  const expressOnly = /只想说说|只想倾诉|不想分析|不要分析|先听我说/.test(input)
  const explicitExplore = !expressOnly && /(?:我想|希望|帮我|请你|一起)(?:和你一起|跟你一起|你)?(?:分析|理清|梳理|看看发生了什么)|一起看看发生了什么/.test(input)
  const explicitPlan = !expressOnly && /下一步(?:该|可以|能|要)?怎么办|(?:我想|希望|帮我|请你).{0,16}(?:制定|规划).{0,16}计划/.test(input)
  const low = context.lowLoad || /不知道|说不清|没力气|简单一点|脑子转不动/.test(input) || safety.state !== 'NORMAL'
  const emotional = /难受|压力|很烦|伤心|崩溃|孤独/.test(input) || safety.state !== 'NORMAL'
  const delegate = /替我决定|帮我决定|替我选|你来决定/.test(input)
  const review = /没完成|未完成|没有做到|复盘/.test(input) || ['TRACK', 'LEARN', 'ADAPT'].includes(context.stage)
  const action = context.stage === 'ACT' || explicitPlan || /下一步|开始行动|制定计划/.test(input)
  const userIntent = rest ? 'REST' : expressOnly ? 'LISTEN' : delegate ? 'DELEGATE_DECISION' : review ? 'REVIEW' : action ? 'ACTION' : explicitExplore ? 'EXPLORE' : emotional ? 'LISTEN' : 'EXPLORE'
  return {
    emotionalIntensity: emotional ? 'HIGH' : 'LOW',
    cognitiveLoad: low ? 'LOW' : 'STANDARD', userIntent,
    explicitInteractionIntent: rest ? 'REST' : expressOnly ? 'EXPRESS' : explicitPlan ? 'PLAN' : explicitExplore ? 'EXPLORE' : undefined,
    interactionMode: rest ? 'REST' : safety.state === 'SAFETY_MODE' || expressOnly || (emotional && !explicitExplore && !explicitPlan)
      ? 'RECEIVE' : !context.consent.coaching ? 'ASK_PERMISSION' : 'COACH',
    permissionToChallenge: context.consent.challenge && safety.state === 'NORMAL' && !low && !emotional,
    responseLength: low ? 180 : 420, questionBudget: rest || expressOnly ? 0 : 1,
  }
}
