import type { TurnContext, SafetyAssessment, RelationshipAssessment, TurnPlan } from './types.ts'
import { selectStage, reviewStage } from './changeLoop.ts'
import { routeIntervention } from '../knowledge/interventions.ts'
import { questionFor } from './practices.ts'
export function planTurn(context: TurnContext, safety: SafetyAssessment, r: RelationshipAssessment): TurnPlan {
  let stage = selectStage(context.stage, safety.state)
  if (stage !== 'SUSPENDED' && r.userIntent === 'REVIEW') stage = ['TRACK', 'LEARN', 'ADAPT'].includes(stage) ? stage : reviewStage(stage)
  if (stage === 'CHALLENGE' && !r.permissionToChallenge) stage = 'REFLECT'
  const coachingAllowed = safety.state !== 'SAFETY_MODE' && r.userIntent !== 'REST' && context.consent.coaching && r.interactionMode === 'COACH'
  const plan: TurnPlan = {
    stage, coachingAllowed, relationshipMode: r.interactionMode,
    challengeAllowed: coachingAllowed && r.permissionToChallenge && stage === 'CHALLENGE',
    resourceAllowed: coachingAllowed && safety.state === 'NORMAL' && r.cognitiveLoad !== 'LOW' && context.consent.resources && context.resourceCount === 0,
    questionBudget: safety.state === 'SAFETY_MODE' ? 0 : r.questionBudget,
    objective: r.userIntent === 'DELEGATE_DECISION' ? '保留用户最终判断权' : '帮助用户选择本轮需要',
    memoryPolicy: coachingAllowed && context.consent.memory ? 'PROPOSE' : 'SESSION_ONLY',
    followUpPolicy: 'USER_INITIATED',
  }
  if (stage !== 'SUSPENDED') plan.intervention = routeIntervention({ safety, relationship: r, context, stage })
  plan.question = questionFor(plan, r, context)
  return plan
}
