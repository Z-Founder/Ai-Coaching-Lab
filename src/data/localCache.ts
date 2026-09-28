import type { LocalCacheStore } from './contracts.ts'
import type { MemoryItem } from '../coaching/types.ts'
import { isMemoryItem } from '../coaching/memory.ts'
function assertConfirmedPattern(item: MemoryItem) {
  if (!isMemoryItem(item) || item.kind !== 'CONFIRMED_PATTERN' || item.confirmedBy !== 'USER') {
    throw new Error('USER_CONFIRMATION_REQUIRED_FOR_CACHE')
  }
}
export class IndexedDbLocalCache implements LocalCacheStore {
  readonly role = 'cache' as const
  private factory: IDBFactory
  constructor(factory: IDBFactory = indexedDB) { this.factory = factory }
  private open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = this.factory.open('ai-coaching-lab-v03-cache', 1)
      request.onupgradeneeded = () => request.result.createObjectStore('patterns', { keyPath: 'id' })
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(new Error('CACHE_UNAVAILABLE'))
      request.onblocked = () => reject(new Error('CACHE_BLOCKED'))
    })
  }
  private async transaction<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const db = await this.open()
    return new Promise<T>((resolve, reject) => {
      const tx = db.transaction('patterns', mode)
      const request = action(tx.objectStore('patterns'))
      tx.oncomplete = () => { db.close(); resolve(request.result) }
      tx.onerror = tx.onabort = () => { db.close(); reject(new Error('CACHE_NOT_SAVED')) }
    })
  }
  async list(): Promise<MemoryItem[]> { return this.transaction('readonly', s => s.getAll()) }
  async put(item: MemoryItem) { assertConfirmedPattern(item); await this.transaction('readwrite', s => s.put(item)) }
  async delete(id: string) { await this.transaction('readwrite', s => s.delete(id)) }
  async clear() { await this.transaction('readwrite', s => s.clear()) }
}
export class VolatileCache implements LocalCacheStore {
  readonly role = 'cache' as const
  private items = new Map<string, MemoryItem>()
  async list() { return structuredClone([...this.items.values()]) }
  async put(item: MemoryItem) { assertConfirmedPattern(item); this.items.set(item.id, structuredClone(item)) }
  async delete(id: string) { this.items.delete(id) }
  async clear() { this.items.clear() }
}
