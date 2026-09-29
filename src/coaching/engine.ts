import type { CoachingTurn, ModelAdapter, TurnContext, ResourcePrescription } from './types.ts'
import type { AnalyticsStore } from '../data/contracts.ts'
import { assembleContext } from './context.ts'
import { routeSafety, safetyResponse } from './safety.ts'
import type { SafetyEvaluator } from './safety.ts'
import { assessRelationship } from './relationship.ts'
import { planTurn } from './orchestrator.ts'
import { reflect, proposeAction } from './practices.ts'
import { activeMemories, memoryProposal } from './memory.ts'
import { MockModelAdapter, generateWithTimeout, localResponse } from './model.ts'
import { validateResponse } from './validator.ts'
import { prescribeResource } from '../knowledge/resources.ts'
import { recordMetric, DevAnalyticsStore } from './measurement.ts'
export interface EngineDependencies {
  model?: ModelAdapter
  safetyEvaluator?: SafetyEvaluator
  analytics?: AnalyticsStore
  resourceLookup?: typeof prescribeResource
  timeoutMs?: number
}
export async function runTurn(input: string, rawContext: TurnContext, dependencies: EngineDependencies = {}): Promise<CoachingTurn> {
  const started = Date.now()
  const context = assembleContext(rawContext)
  context.memories = activeMemories(context.memories)
  const safety = await routeSafety(input, context, dependencies.safetyEvaluator)
  const relationship = assessRelationship(input, context, safety)
  const plan = planTurn(context, safety, relationship)
  const errors: CoachingTurn['errors'] = []
  let response = safety.state === 'SAFETY_MODE' ? safetyResponse(safety.source === 'fallback') : localResponse(plan, relationship)
  if (safety.state !== 'SAFETY_MODE') {
    try {
      const generated = await generateWithTimeout(dependencies.model ?? new MockModelAdapter(), { input, plan, relationship }, dependencies.timeoutMs)
      if (validateResponse(generated, plan, relationship)) response = generated
      else errors.push('INVALID_RESPONSE')
    } catch { errors.push('PROVIDER_UNAVAILABLE') }
  }
  // Validate every display path, including local fallbacks.
  if (!validateResponse(response, plan, relationship)) {
    response = { kind: safety.state === 'SAFETY_MODE' ? 'SAFETY' : 'SUPPORT',
      text: '我们可以先停一下。若此刻有危险，请联系当地急救或可信的人。', questions: [], challenge: false, scientificClaim: false }
  }
  let resource: ResourcePrescription | undefined
  if (plan.resourceAllowed) {
    try { resource = (dependencies.resourceLookup ?? prescribeResource)(plan) }
    catch { errors.push('RESOURCE_UNAVAILABLE') }
  }
  const memoryProposals = plan.memoryPolicy === 'PROPOSE' && relationship.userIntent === 'REVIEW'
    ? [memoryProposal(context.sessionId)] : []
  const action = plan.coachingAllowed && plan.stage === 'ACT' ? proposeAction(context) : undefined
  const analytics = dependencies.analytics ?? new DevAnalyticsStore()
  if (context.recentConversation.length === 0) await recordMetric(analytics, context.consent, 'session_started')
  if (context.previousQuestionAsked) await recordMetric(analytics, context.consent, 'question_continued')
  if (plan.intervention) await recordMetric(analytics, context.consent, 'intervention_selected')
  if (resource) await recordMetric(analytics, context.consent, 'resource_prescribed')
  if (memoryProposals.length) await recordMetric(analytics, context.consent, 'memory_proposed')
  if (action) await recordMetric(analytics, context.consent, 'next_step_defined')
  await recordMetric(analytics, context.consent, 'latency_ms', Date.now() - started)
  const turnId = crypto.randomUUID()
  return {
    id: turnId, userInput: input,
    userUtterance: { kind: 'USER_UTTERANCE', text: input, sourceTurnId: turnId },
    aiInferences: memoryProposals.map(m => ({ kind: 'AI_INFERENCE', text: m.text, sourceTurnId: turnId, status: 'UNCONFIRMED' })),
    context, safety, relationship, changeStage: plan.stage, plan, response,
    reflection: reflect(input), memoryProposals, action, followUp: context.track, resource, outcome: {}, errors,
  }
}
