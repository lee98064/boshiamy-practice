import type { DictionaryEntry, Exercise, Root } from '../types'
import { exerciseFromEntry } from './dictionary'

export const sessionLengths = [5, 10, 20, 50, 100]

// Fisher–Yates, with the remaining deck carried into the next round.
// IDs, not objects, are retained so imported code updates are never stale.
export function createPracticeDeck(random = Math.random) {
  let signature = ''
  let remaining: string[] = []
  const shuffle = (ids: string[]) => {
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1))
      ;[ids[i], ids[j]] = [ids[j]!, ids[i]!]
    }
    return ids
  }
  return {
    draw<T extends { id: string }>(pool: T[], requested: number): T[] {
      const entries = new Map(pool.map((item) => [item.id, item]))
      const ids = [...entries.keys()]
      const nextSignature = JSON.stringify(ids)
      if (signature !== nextSignature) {
        signature = nextSignature
        remaining = []
      }
      const count = Math.min(ids.length, Math.max(0, Math.floor(requested)))
      const picked: string[] = []
      while (picked.length < count) {
        if (!remaining.length) {
          const fresh = shuffle([...ids])
          // A round that straddles a reshuffle still contains no duplicates.
          remaining = [
            ...fresh.filter((id) => !picked.includes(id)),
            ...fresh.filter((id) => picked.includes(id)),
          ]
        }
        picked.push(remaining.shift()!)
      }
      return picked.map((id) => entries.get(id)!)
    },
  }
}

export function rootExercise(root: Root): Exercise {
  return {
    id: root.id,
    glyph: root.glyph,
    codes: [root.code],
    rootCrop: root.rootCrop,
    hint: root.hint,
    explanation: root.explanation,
    isRoot: true,
  }
}

export function singleCharacterPool(
  entries: DictionaryEntry[],
  scope: 'all' | 'recommended',
): Exercise[] {
  return entries
    .filter(
      (entry) =>
        /^\p{Script=Han}$/u.test(entry.char) &&
        entry.codes.length &&
        (scope === 'all' || !!entry.recommendedCodes?.length),
    )
    .map(exerciseFromEntry)
}
