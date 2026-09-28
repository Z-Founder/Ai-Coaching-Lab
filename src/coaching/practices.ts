import type { ActionPlan, QuestionPlan, Reflection, RelationshipAssessment, TurnPlan, TurnContext } from './types.ts'
export function questionFor(plan: TurnPlan, r: RelationshipAssessment, context: TurnContext): QuestionPlan | undefined {
  if (!plan.questionBudget || plan.stage === 'SUSPENDED') return undefined
  const permission = r.interactionMode === 'RECEIVE' || r.interactionMode === 'ASK_PERMISSION'
  let question = permission ? '你希望先说说感受，还是一起看看发生了什么？' : '眼前最想理清的一件事是什么？'
  let type: QuestionPlan['type'] = permission ? 'permission' : 'clarification'
  if (!permission && r.cognitiveLoad === 'LOW') question = '愿意先停一会儿吗？'
  else if (!permission && r.userIntent === 'DELEGATE_DECISION') question = '这件事里，你最看重什么？'
  else if (!permission && plan.stage === 'TRACK') { question = '原来的计划与实际发生的事有什么不同？'; type = 'review' }
  else if (!permission && plan.stage === 'LEARN') { question = '你认为其中哪个阻力值得留意？'; type = 'review' }
  else if (!permission && plan.stage === 'ADAPT') { question = '下一轮你想只调整哪一个变量？'; type = 'review' }
  else if (!permission && plan.stage === 'CHALLENGE' && plan.challengeAllowed) { question = '有没有一种不同的解释也可能成立？'; type = 'reflection' }
  else if (!permission && ['ACT', 'DECIDE'].includes(plan.stage)) { question = '你愿意尝试哪一个小到能开始的动作？'; type = 'action' }
  else if (!permission && plan.stage === 'REFLECT') { question = '哪些是观察到的事实，哪些是你的解释？'; type = 'reflection' }
  return { type, objective: context.goal || '帮助用户自行理解', cognitiveLoad: r.cognitiveLoad, challengeLevel: plan.challengeAllowed ? 1 : 0, question }
}
export function reflect(input: string): Reflection {
  // A reported statement is not a diagnosis or an externally verified fact.
  return { reportedStatements: [input], facts: [], interpretations: [], assumptions: [], emotions: [], needs: [] }
}
export function proposeAction(context: TurnContext): ActionPlan {
  return {
    goal: context.goal || '由你选择一个值得尝试的小目标',
    nextAction: '用两分钟写下第一步；也可以选择今天不行动。',
    startTrigger: '由你选择一个方便的时刻', expectedEffort: '不超过两分钟',
    barrier: '精力不足或还不清楚', fallback: '暂停，或者只写一个词',
    reviewTime: '由你决定何时回来', accepted: false,
  }
}
