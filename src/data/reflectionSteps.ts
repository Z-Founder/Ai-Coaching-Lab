import type { ReflectionStep } from '../types/session'

export const reflectionSteps: ReflectionStep[] = [
  {
    id: 'Observe',
    title: '此刻，哪一件事最占据你的注意力？',
    hint: '可以是一件具体的事，也可以是一种还说不清的感受。',
    label: '眼前的问题',
  },
  {
    id: 'Ask',
    title: '这件事里，最让你感到压力的是什么？',
    hint: '可能是现实限制、别人的期待、不确定性，或你对自己的要求。',
    label: '压力所在',
  },
  {
    id: 'Reflect',
    title: '你希望先出现什么小小的变化？',
    hint: '不用解决全部问题。哪一点变化，会对现在的你有帮助？',
    label: '希望的变化',
  },
  {
    id: 'Dispute',
    title: '是什么让这一步不容易发生？',
    hint: '例如精力、信息、时间、环境或担忧。暂时不知道也没关系。',
    label: '当前阻力',
  },
  {
    id: 'Act',
    title: '你愿意选择怎样的下一步？',
    hint: '写下做什么、何时开始，以及做到哪里就够了。也可以选择休息或寻求帮助。',
    label: '我的下一步',
  },
]
