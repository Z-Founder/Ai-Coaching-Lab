import type { ExplicitUserFact, MemoryItem, UserUtterance } from './types.ts'
import type { LocalCacheStore } from '../data/contracts.ts'
export function activeMemories(items: MemoryItem[], now = Date.now()): MemoryItem[] {
  return items.filter(m => (m.kind === 'CONFIRMED_PATTERN' && m.confirmedBy === 'USER') ||
    (now - m.createdAt < 14 * 86400000 && new Set(m.relevantSessionIds).size < 3))
}
export function markRelevantSession(item: MemoryItem, sessionId: string): MemoryItem {
  return { ...item, relevantSessionIds: [...new Set([...item.relevantSessionIds, sessionId])] }
}
export function memoryProposal(sessionId: string, now = Date.now()): MemoryItem {
  return { id: crypto.randomUUID(), text: '把行动缩小，可能更容易开始。这个规律适合你吗？',
    kind: 'WORKING_HYPOTHESIS', createdAt: now, relevantSessionIds: [sessionId], category: 'strategy', origin: 'AI_INFERENCE' }
}
export function confirmUserFact(utterance: UserUtterance, wording: string, explicitUserConfirmation: boolean): ExplicitUserFact {
  if (utterance.kind !== 'USER_UTTERANCE' || !utterance.sourceTurnId || !explicitUserConfirmation || !wording.trim() || wording.length > 240) {
    throw new Error('EXPLICIT_FACT_CONFIRMATION_REQUIRED')
  }
  return { kind: 'EXPLICIT_USER_FACT', text: wording.trim(), sourceTurnId: utterance.sourceTurnId,
    confirmedBy: 'USER', verification: 'SELF_REPORTED', confirmedAt: Date.now() }
}
export function isSensitiveLabel(text: string) {
  return /诊断|抑郁症|人格|危险人物|智力|智商|能力低下|diagnos|personality|dangerousness|intelligence|incapable/i.test(text)
}
export async function confirmMemory(cache: LocalCacheStore, item: MemoryItem, text: string, consent: boolean): Promise<MemoryItem> {
  if (!consent) throw new Error('MEMORY_CONSENT_REQUIRED')
  if (!isMemoryItem(item)) throw new Error('INVALID_MEMORY_PROPOSAL')
  if (!text.trim() || text.length > 240 || isSensitiveLabel(text)) throw new Error('STRATEGY_ONLY')
  const confirmed: MemoryItem = { ...item, text: text.trim(), kind: 'CONFIRMED_PATTERN',
    origin: text.trim() === item.text.trim() ? item.origin : 'USER_AUTHORED', confirmedBy: 'USER' }
  await cache.put(confirmed) // Success is returned only after transaction commit.
  return confirmed
}
export async function loadActiveMemories(cache: LocalCacheStore, now = Date.now()): Promise<MemoryItem[]> {
  const all = await cache.list()
  if (!Array.isArray(all) || !all.every(isMemoryItem)) throw new Error('INVALID_CACHE_RECORD')
  const active = activeMemories(all, now)
  const keep = new Set(active.map(m => m.id))
  await Promise.all(all.filter(m => !keep.has(m.id)).map(m => cache.delete(m.id)))
  return active
}
export function isMemoryItem(value: unknown): value is MemoryItem {
  if (!value || typeof value !== 'object') return false
  const m = value as Record<string, unknown>
  return typeof m.id === 'string' && typeof m.text === 'string' && m.text.length <= 240 &&
    !isSensitiveLabel(m.text) && ['WORKING_HYPOTHESIS', 'CONFIRMED_PATTERN'].includes(String(m.kind)) &&
    typeof m.createdAt === 'number' && Number.isFinite(m.createdAt) && m.category === 'strategy' &&
    Array.isArray(m.relevantSessionIds) && m.relevantSessionIds.every(id => typeof id === 'string') &&
    (m.origin === undefined || m.origin === 'AI_INFERENCE' || m.origin === 'USER_AUTHORED') &&
    (m.confirmedBy === undefined || m.confirmedBy === 'USER') &&
    (m.kind !== 'CONFIRMED_PATTERN' || m.confirmedBy === 'USER')
}
export interface CoachingHistory {
  interventionHistory: Array<{ interventionId: string; accepted: boolean }>
  resourceHistory: Array<{ resourceId: string; completed: boolean; transferred: boolean }>
  actionOutcome: Array<{ accepted: boolean; completed: boolean }>
}
