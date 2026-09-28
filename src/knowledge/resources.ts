import type { Resource, ResourcePrescription, TurnPlan } from '../coaching/types.ts'
export const resourceCatalog: readonly Resource[] = [{
  id: 'small-step-card', title: '两分钟下一步卡片', url: '/resources/small-step.html',
  summary: '自选一个小行动、触发条件和可暂停的退路。',
  authorization: 'PROJECT_AUTHORED',
  evidence: { tier: 'D', method: '自写行动提示卡', useCase: '普通生活目标的开始练习', limitation: '启发性练习，不是科学疗效承诺。' },
}]
export const coachingProtocolMetadata = { version: '0.3', mode: 'LOCAL_MOCK', loopIsLinear: false }
export function prescribeResource(plan: TurnPlan, catalog: readonly Resource[] = resourceCatalog): ResourcePrescription | undefined {
  if (!plan.resourceAllowed) return undefined
  const resource = catalog[0]
  if (!resource) return undefined
  return {
    resourceId: resource.id, whyNow: '你选择查看一个帮助行动开始的练习。',
    focusOn: '只看一个小动作和触发条件，不必读完更多内容。',
    reflectionQuestion: '哪个动作对你来说足够小？',
    behaviorBridge: '由你选择是否在一个方便的时刻尝试两分钟。',
    evidenceTier: resource.evidence.tier,
  }
}
