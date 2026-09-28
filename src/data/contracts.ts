import type { CoachingTurn, MemoryItem } from '../coaching/types.ts'
import type { AnalyticsEvent, ResearchRecord } from '../coaching/measurement.ts'

// Identity is deliberately separate from any coaching content.
export interface IdentityRecord { subjectId: string; displayName: string }
export interface IdentityStore { get(subjectId: string): Promise<IdentityRecord | undefined> }
export interface CoachingStore {
  readonly role: 'canonical-server' | 'development'
  save(turn: CoachingTurn): Promise<void>
  get(id: string): Promise<CoachingTurn | undefined>
  delete(id: string): Promise<void>
}
export interface LocalCacheStore {
  readonly role: 'cache'
  list(): Promise<MemoryItem[]>
  put(item: MemoryItem): Promise<void>
  delete(id: string): Promise<void>
  clear(): Promise<void>
}
export interface AnalyticsStore { append(event: AnalyticsEvent): Promise<void> }
export interface ResearchCorpusStore { append(record: ResearchRecord): Promise<void> }
export interface DeIdentificationPipeline {
  derive(input: { text: string; subjectId: string; sessionId: string }): Promise<ResearchRecord>
}
export class DevCoachingStore implements CoachingStore {
  readonly role = 'development' as const
  private turns = new Map<string, CoachingTurn>()
  async save(turn: CoachingTurn) { this.turns.set(turn.id, structuredClone(turn)) }
  async get(id: string) { return structuredClone(this.turns.get(id)) }
  async delete(id: string) { this.turns.delete(id) }
}
