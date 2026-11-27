import type { PhoneDetectionMetadata } from '../pages/student/api/student-take-exam.api'

export interface PendingPhoneEvidence {
  id: string
  blob: Blob
  metadata: PhoneDetectionMetadata
}

interface StoredEvidence extends Omit<PendingPhoneEvidence, 'blob'> {
  sessionId: string
  scope: string
  savedAt: number
  size: number
  iv: Uint8Array<ArrayBuffer>
  ciphertext: ArrayBuffer
}

const DATABASE = 'soes-pending-evidence'
const STORE = 'phone'
const KEY_PREFIX = 'soes:evidence-session:'
export const PHONE_EVIDENCE_RETENTION_MS = 30 * 60_000

async function evidenceTransaction<T>(action: (store: IDBObjectStore, complete: (value: T) => void) => void) {
  const database = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1)
    let abandoned = false
    const fail = () => {
      abandoned = true
      window.clearTimeout(timeout)
      reject((request.readyState === 'done' && request.error) || new Error('Evidence storage is unavailable'))
    }
    const timeout = window.setTimeout(fail, 5_000)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id' })
    request.onsuccess = () => {
      window.clearTimeout(timeout)
      if (abandoned) request.result.close()
      else resolve(request.result)
    }
    request.onerror = fail
    request.onblocked = fail
  })
  return new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(STORE, 'readwrite')
    let outcome: T
    transaction.oncomplete = () => { database.close(); resolve(outcome) }
    transaction.onabort = () => { database.close(); reject(transaction.error ?? new Error('Evidence transaction aborted')) }
    try { action(transaction.objectStore(STORE), value => { outcome = value }) }
    catch (error) { transaction.abort(); reject(error) }
  })
}

function activeRecords(store: IDBObjectStore, next: (records: StoredEvidence[]) => void) {
  const request = store.getAll()
  request.onsuccess = () => {
    const records = request.result as StoredEvidence[]
    for (const record of records) if (record.savedAt <= Date.now() - PHONE_EVIDENCE_RETENTION_MS) store.delete(record.id)
    next(records.filter(record => record.savedAt > Date.now() - PHONE_EVIDENCE_RETENTION_MS))
  }
}

export async function openPhoneEvidenceStorage(ownerId: string, scheduleId: string, attemptId: string) {
  const storageKey = `${KEY_PREFIX}${ownerId}`
  let serialized = sessionStorage.getItem(storageKey)
  if (!serialized) {
    const raw = crypto.getRandomValues(new Uint8Array(32))
    serialized = JSON.stringify({ id: crypto.randomUUID(), key: Array.from(raw) })
    sessionStorage.setItem(storageKey, serialized)
  }
  const session = JSON.parse(serialized) as { id: string; key: number[] }
  const key = await crypto.subtle.importKey('raw', new Uint8Array(session.key), 'AES-GCM', false, ['encrypt', 'decrypt'])
  const scope = JSON.stringify([ownerId, scheduleId, attemptId])
  const assertSession = () => {
    if (sessionStorage.getItem(storageKey) !== serialized) throw new Error('Evidence session ended')
  }
  return {
    async load(): Promise<PendingPhoneEvidence[]> {
      assertSession()
      const stored = await evidenceTransaction<StoredEvidence[]>((store, complete) => {
        activeRecords(store, records => complete(records.filter(record => record.sessionId === session.id && record.scope === scope)))
      })
      const pending = await Promise.all(stored.map(async record => ({
        id: record.id, metadata: record.metadata,
        blob: new Blob([await crypto.subtle.decrypt({ name: 'AES-GCM', iv: record.iv }, key, record.ciphertext)], { type: 'image/jpeg' }),
      })))
      assertSession()
      return pending
    },
    async put(evidence: PendingPhoneEvidence) {
      assertSession()
      if (evidence.blob.size > 12 * 1024 * 1024) throw new RangeError('Evidence exceeds queue byte limit')
      const iv = crypto.getRandomValues(new Uint8Array(12))
      const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, await evidence.blob.arrayBuffer())
      assertSession()
      await evidenceTransaction<void>((store, complete) => {
        activeRecords(store, records => {
          const other = records.filter(record => record.id !== evidence.id)
          const scoped = other.filter(record => record.sessionId === session.id && record.scope === scope)
          if (scoped.length >= 20 || scoped.reduce((bytes, record) => bytes + record.size, evidence.blob.size) > 12 * 1024 * 1024 ||
            other.length >= 100 || other.reduce((bytes, record) => bytes + record.size, evidence.blob.size) > 64 * 1024 * 1024) {
            store.transaction.abort()
            return
          }
          store.put({ id: evidence.id, metadata: evidence.metadata, sessionId: session.id, scope,
            savedAt: Date.now(), size: evidence.blob.size, iv, ciphertext } satisfies StoredEvidence)
          complete()
        })
      })
    },
    async remove(id: string) {
      assertSession()
      await evidenceTransaction<void>((store, complete) => { store.delete(id); complete() })
    },
  }
}

/** Destroy keys synchronously so logout cannot leave decryptable images behind. */
export async function clearPhoneEvidenceSessions() {
  const sessions = new Set<string>()
  for (let index = sessionStorage.length - 1; index >= 0; index--) {
    const name = sessionStorage.key(index)
    if (!name?.startsWith(KEY_PREFIX)) continue
    const serialized = sessionStorage.getItem(name)
    sessionStorage.removeItem(name)
    try { sessions.add((JSON.parse(serialized ?? '{}') as { id: string }).id) }
    catch (error) { if (!(error instanceof SyntaxError)) throw error }
  }
  if (!sessions.size) return
  return evidenceTransaction<void>((store, complete) => {
    activeRecords(store, records => {
      for (const record of records) if (sessions.has(record.sessionId)) store.delete(record.id)
      complete()
    })
  })
}
