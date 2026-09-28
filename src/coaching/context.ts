import { defaultConsent } from './types.ts'
import { isMemoryItem } from './memory.ts'
import type { TurnContext, Consent } from './types.ts'

export function createContext(sessionId = crypto.randomUUID()): TurnContext {
  return {
    sessionId, recentConversation: [], safetySignals: {}, safetyLatched: false,
    stage: 'OBSERVE', lowLoad: false, goal: '', problemType: 'general',
    preferences: { preferReflection: false }, consent: { ...defaultConsent },
    memories: [], explicitFacts: [], recentOutcomes: [], resourceCount: 0,
    history: { interventions: [], resources: [], actions: [] },
  }
}
export function assembleContext(context: TurnContext): TurnContext {
  return structuredClone({
    ...context,
    recentConversation: context.recentConversation.slice(-6),
    memories: context.consent.memory ? context.memories.filter(m =>
      isMemoryItem(m) && (m.kind !== 'CONFIRMED_PATTERN' || m.confirmedBy === 'USER')) : [],
    explicitFacts: context.consent.memory
      ? context.explicitFacts.filter(f => f.kind === 'EXPLICIT_USER_FACT' && f.confirmedBy === 'USER' && f.verification === 'SELF_REPORTED')
      : [],
  })
}
export function canInviteProactive(consent: Consent, signal: 'REMINDER_REQUEST' | 'ACCOUNTABILITY_REQUEST' | 'FOLLOWUP_REQUEST' | 'USER_REVIEWS' | 'VULNERABILITY', now: number) {
  return signal !== 'VULNERABILITY' && !consent.proactive && !consent.neverAskProactive &&
    (consent.proactiveRejectedAt === undefined || now - consent.proactiveRejectedAt >= 30 * 86400000)
}
