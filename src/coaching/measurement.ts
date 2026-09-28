import type { Consent, OutcomeMetadata } from './types.ts'
import type { AnalyticsStore, DeIdentificationPipeline, ResearchCorpusStore } from '../data/contracts.ts'
export const eventNames = ['session_started', 'change_stage', 'intervention_selected', 'question_continued',
  'turn_abandoned', 'clarity_before', 'clarity_after', 'felt_understood', 'agency_before', 'agency_after', 'agency_score',
  'next_step_defined', 'next_step_accepted', 'follow_up_completed', 'memory_proposed',
  'memory_confirmed', 'memory_edited', 'memory_rejected', 'resource_prescribed',
  'resource_completed', 'resource_transfer', 'latency_ms', 'repair', 'insight_recognized',
  'intervention_accepted', 'intervention_outcome', 'helpfulness'] as const
export type EventName = typeof eventNames[number]
export interface AnalyticsEvent { name: EventName; value: number }
// No arbitrary properties, IDs or strings: even injected runtime properties are stripped.
export function analyticsEvent(name: EventName, value = 1): AnalyticsEvent {
  if (!eventNames.includes(name) || !Number.isFinite(value) || value < 0) throw new Error('INVALID_METRIC')
  return { name, value }
}
export class DevAnalyticsStore implements AnalyticsStore {
  private events: AnalyticsEvent[] = []
  async append(event: AnalyticsEvent) {
    this.events.push(analyticsEvent(event.name, event.value))
    this.events = this.events.slice(-200)
  }
  snapshot() { return structuredClone(this.events) }
  clear() { this.events = [] }
}
export async function recordMetric(store: AnalyticsStore, consent: Consent, name: EventName, value = 1) {
  if (!consent.analytics) return false
  try { await store.append(analyticsEvent(name, value)); return true }
  catch { return false /* Metrics must never block coaching. */ }
}
export type OutcomeRatingKey = 'feltUnderstood' | 'clarityBefore' | 'clarityAfter' |
  'agencyBefore' | 'agencyAfter' | 'helpfulness'
const outcomeEvents: Record<OutcomeRatingKey, EventName> = {
  feltUnderstood: 'felt_understood', clarityBefore: 'clarity_before', clarityAfter: 'clarity_after',
  agencyBefore: 'agency_before', agencyAfter: 'agency_after', helpfulness: 'helpfulness',
}
export async function recordOutcomeFeedback(
  store: AnalyticsStore, consent: Consent, key: OutcomeRatingKey, value: number,
): Promise<boolean> {
  if (!Number.isInteger(value) || value < 1 || value > 5) throw new Error('INVALID_OUTCOME_RATING')
  return recordMetric(store, consent, outcomeEvents[key], value)
}
export interface ResearchRecord {
  research_id: string
  research_session_id: string
  deid_version: 'dev-no-text-v1'
  text: '[REMOVED]'
  quasiIdentifiers: 'GENERALIZED_OR_REMOVED'
  sensitive: true
}
export class DevDeIdentificationPipeline implements DeIdentificationPipeline {
  async derive(_input: { text: string; subjectId: string; sessionId: string }): Promise<ResearchRecord> {
    // Development-safe: remove ALL free text, direct and quasi identifiers.
    // New independent IDs; no reversible production/research identity map.
    return { research_id: crypto.randomUUID(), research_session_id: crypto.randomUUID(),
      deid_version: 'dev-no-text-v1', text: '[REMOVED]', quasiIdentifiers: 'GENERALIZED_OR_REMOVED', sensitive: true }
  }
}
export async function deriveResearch(
  getConsent: () => Consent, input: { text: string; subjectId: string; sessionId: string },
  pipeline: DeIdentificationPipeline, corpus: ResearchCorpusStore,
) {
  if (!getConsent().research) return false
  const derived = await pipeline.derive(input)
  if (!getConsent().research) return false // Revocation during derivation is honored.
  if (derived.text !== '[REMOVED]' || derived.deid_version !== 'dev-no-text-v1' ||
      derived.research_id === input.subjectId || derived.research_session_id === input.sessionId) throw new Error('DEID_GATE_FAILED')
  // Reconstruct at the trust boundary; pipeline cannot smuggle raw fields.
  await corpus.append({ research_id: derived.research_id, research_session_id: derived.research_session_id,
    deid_version: 'dev-no-text-v1', text: '[REMOVED]', quasiIdentifiers: 'GENERALIZED_OR_REMOVED', sensitive: true })
  return true
}
export function evaluateOutcomes(outcomes: OutcomeMetadata[]) {
  const mean = (values: number[]) => values.length ? values.reduce((a, b) => a + b, 0) / values.length : null
  return {
    feltUnderstood: mean(outcomes.flatMap(o => o.feltUnderstood === undefined ? [] : [o.feltUnderstood])),
    clarityDelta: mean(outcomes.flatMap(o => o.clarityAfter !== undefined && o.clarityBefore !== undefined ? [o.clarityAfter - o.clarityBefore] : [])),
    agencyDelta: mean(outcomes.flatMap(o => o.agencyAfter !== undefined && o.agencyBefore !== undefined ? [o.agencyAfter - o.agencyBefore] : [])),
    nextStepAcceptance: mean(outcomes.flatMap(o => o.nextStepAccepted === undefined ? [] : [Number(o.nextStepAccepted)])),
  }
}
export function evaluateEvents(events: AnalyticsEvent[]) {
  const count = (name: EventName) => events.filter(e => e.name === name).length
  const ratio = (a: EventName, b: EventName) => count(b) ? count(a) / count(b) : null
  return {
    questionContinuationRate: ratio('question_continued', 'intervention_selected'),
    turnDropOff: count('turn_abandoned'), repairRate: ratio('repair', 'intervention_selected'),
    insightRecognition: count('insight_recognized'), followThrough: count('follow_up_completed'),
    memory: { accepted: count('memory_confirmed'), edited: count('memory_edited'), rejected: count('memory_rejected') },
    interventionAcceptance: ratio('intervention_accepted', 'intervention_selected'),
    interventionOutcome: events.filter(e => e.name === 'intervention_outcome').map(e => e.value),
    resourceTransfer: count('resource_transfer'),
  }
}
