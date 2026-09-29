import type { DictionaryEntry, SavedData } from '../types'
export const STORAGE_KEY = 'boshiamy-practice:v1'
export const defaults = (): SavedData => ({
  version: 1,
  favorites: [],
  mistakes: [],
  attempts: [],
  sessions: [],
  preferences: {
    showKeyboard: true,
    dailyGoal: 20,
    sessionLength: 10,
    inputMode: 'code',
    singleScope: 'all',
  },
})
export function readSavedData(): SavedData {
  const initial = defaults()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initial
    const data = JSON.parse(raw)
    if (data.version !== 1) return initial
    return {
      version: 1,
      favorites: Array.isArray(data.favorites)
        ? data.favorites.filter((x: unknown) => typeof x === 'string')
        : [],
      mistakes: Array.isArray(data.mistakes)
        ? data.mistakes.filter(
            (x: Record<string, unknown>) =>
              x &&
              typeof x.id === 'string' &&
              typeof x.glyph === 'string' &&
              Array.isArray(x.codes) &&
              x.codes.every((c) => typeof c === 'string'),
          )
        : [],
      attempts: Array.isArray(data.attempts)
        ? data.attempts.filter(
            (x: Record<string, unknown>) =>
              x && typeof x.at === 'string' && typeof x.correct === 'boolean',
          )
        : [],
      sessions: Array.isArray(data.sessions)
        ? data.sessions.filter(
            (x: Record<string, unknown>) =>
              x &&
              typeof x.at === 'string' &&
              typeof x.total === 'number' &&
              typeof x.correct === 'number' &&
              typeof x.seconds === 'number',
          )
        : [],
      preferences: {
        showKeyboard:
          typeof data.preferences?.showKeyboard === 'boolean'
            ? data.preferences.showKeyboard
            : true,
        dailyGoal: [10, 20, 30, 50].includes(data.preferences?.dailyGoal)
          ? data.preferences.dailyGoal
          : 20,
        sessionLength: [5, 10, 20, 50, 100].includes(data.preferences?.sessionLength)
          ? data.preferences.sessionLength
          : 10,
        inputMode: data.preferences?.inputMode === 'text' ? 'text' : 'code',
        singleScope: data.preferences?.singleScope === 'recommended' ? 'recommended' : 'all',
      },
    }
  } catch {
    return initial
  }
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('boshiamy-dictionary', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('dictionary')
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}
export async function readImported(): Promise<DictionaryEntry[]> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('dictionary', 'readonly')
    const request = transaction.objectStore('dictionary').get('entries')
    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(request.error)
    transaction.oncomplete = () => db.close()
  })
}
export async function saveImported(entries: DictionaryEntry[]): Promise<void> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('dictionary', 'readwrite')
    transaction.objectStore('dictionary').put(entries, 'entries')
    transaction.oncomplete = () => {
      db.close()
      resolve()
    }
    transaction.onerror = () => {
      db.close()
      reject(transaction.error)
    }
    transaction.onabort = () => {
      db.close()
      reject(transaction.error)
    }
  })
}
export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
