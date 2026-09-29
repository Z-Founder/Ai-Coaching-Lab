import type { ModelAdapter, ModelResponse, RelationshipAssessment, TurnPlan } from './types.ts'
export function localResponse(plan: TurnPlan, r: RelationshipAssessment): ModelResponse {
  let text = '可以从眼前的一件事开始，你保留选择和调整方向的权利。'
  if (r.userIntent === 'REST') text = '可以，今天不解决问题也可以。你可以暂停，等愿意时再回来。'
  else if (r.explicitInteractionIntent === 'EXPRESS') text = '可以，你先说说。我先听，不急着分析。'
  else if (r.userIntent === 'DELEGATE_DECISION') text = '我可以帮你梳理选项和取舍，但最终决定由你来做。'
  else if (r.interactionMode === 'RECEIVE') text = '听起来这会儿很消耗。你不必马上整理清楚，也可以只说一点。'
  else if (r.emotionalIntensity === 'HIGH' && r.explicitInteractionIntent === 'PLAN') {
    text = r.cognitiveLoad === 'LOW'
      ? '听起来很难受。我们先只看一个很小的下一步。'
      : '听起来压力不小。你想考虑下一步，我们可以先把它缩小；是否行动由你决定。'
  }
  else if (r.emotionalIntensity === 'HIGH' && r.explicitInteractionIntent === 'EXPLORE') {
    text = r.cognitiveLoad === 'LOW'
      ? '听起来很难受。我们可以慢一点，只看一件事。'
      : '听起来这会儿很消耗。你想一起分析，我们可以先看发生的一件事；你随时可以停。'
  }
  else if (r.cognitiveLoad === 'LOW') text = '不知道也没关系。我们可以慢一点，或者先休息。'
  else if (r.userIntent === 'REVIEW') text = '没完成是一条信息，不是对你的评价。可以看看计划和现实的差异。'
  else if (plan.stage === 'CHALLENGE') text = '在你允许的范围内，我们可以温和检验一个解释；你随时可以停。'
  return { kind: plan.coachingAllowed ? 'COACHING' : 'SUPPORT', text,
    questions: plan.question ? [plan.question.question] : [], challenge: plan.challengeAllowed, scientificClaim: false }
}
export class MockModelAdapter implements ModelAdapter {
  async generate(request: { input: string; plan: TurnPlan; relationship: RelationshipAssessment }, signal: AbortSignal) {
    if (signal.aborted) throw new Error('ABORTED')
    return localResponse(request.plan, request.relationship)
  }
}
export class OpenAIAdapterPlaceholder implements ModelAdapter {
  async generate(): Promise<never> { throw new Error('SERVER_ADAPTER_NOT_CONFIGURED') }
}
export async function generateWithTimeout(adapter: ModelAdapter, request: Parameters<ModelAdapter['generate']>[0], timeoutMs = 5000): Promise<unknown> {
  const controller = new AbortController()
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      adapter.generate(request, controller.signal),
      new Promise<never>((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Error('MODEL_TIMEOUT')) }, timeoutMs) }),
    ])
  } finally { clearTimeout(timer); controller.abort() }
}
