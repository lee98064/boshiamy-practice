import { describe, expect, it } from 'vitest'
import { createPracticeDeck, rootExercise, singleCharacterPool } from './practice-deck'
import { roots } from '../data/roots'
import { readSavedData, STORAGE_KEY } from './storage'
import { vi } from 'vitest'

const pool = Array.from({ length: 12 }, (_, i) => ({ id: String(i), value: i }))
describe('random practice deck', () => {
  it('draws without replacement and carries unseen questions across rounds', () => {
    const deck = createPracticeDeck(() => 0.4)
    const first = deck.draw(pool, 5)
    const second = deck.draw(pool, 5)
    expect(new Set([...first, ...second].map((x) => x.id)).size).toBe(10)
    const third = deck.draw(pool, 5)
    expect(new Set(third.map((x) => x.id)).size).toBe(5)
    expect(new Set([...first, ...second, ...third].map((x) => x.id)).size).toBe(12)
    expect(first.map((x) => x.id)).not.toEqual(pool.slice(0, 5).map((x) => x.id))
  })
  it('caps small pools, handles empty pools, and resets when the available pool changes', () => {
    const deck = createPracticeDeck(() => 0.5)
    expect(deck.draw([], 20)).toEqual([])
    expect(deck.draw(pool.slice(0, 2), 100)).toHaveLength(2)
    const changed = deck.draw([{ id: 'new' }], 10)
    expect(changed).toEqual([{ id: 'new' }])
  })
  it('uses fresh objects when dictionary codes change', () => {
    const deck = createPracticeDeck(() => 0.99)
    deck.draw(pool, 1)
    expect(
      deck.draw(
        pool.map((x) => ({ ...x, value: 100 })),
        1,
      )[0]?.value,
    ).toBe(100)
  })
  it('selects Han characters, preserves recommended-only checking, and labels ordinary entries', () => {
    const entries = [
      {
        char: '好',
        codes: ['gz', 'gzj'],
        recommendedCodes: ['gzj'],
        recommendedSource: 'official' as const,
      },
      { char: '甲', codes: ['qi', 'qj'] },
      { char: '𠮷', codes: ['yo'] },
      { char: '，', codes: [','] },
      { char: 'A', codes: ['a'] },
      { char: '漢字', codes: ['x'] },
    ]
    const all = singleCharacterPool(entries, 'all')
    expect(all.map((x) => x.glyph)).toEqual(['好', '甲', '𠮷'])
    expect(all[0]?.codes).toEqual(['gzj'])
    expect(all[1]?.recommendedSource).toBeUndefined()
    expect(singleCharacterPool(entries, 'recommended').map((x) => x.glyph)).toEqual(['好'])
  })
})
describe('expanded root data', () => {
  it('covers A–Z with unique lesson identities and usable variant image regions', () => {
    expect(roots.length).toBeGreaterThan(300)
    expect(new Set(roots.map((x) => x.code)).size).toBe(26)
    expect(new Set(roots.map((x) => x.id)).size).toBe(roots.length)
    for (const root of roots) {
      expect(root.code).toMatch(/^[a-z]$/)
      const exercise = rootExercise(root)
      expect(exercise.codes).toEqual([root.code])
      if (root.rootCrop) {
        const [x, y, width, height] = root.rootCrop
        expect(x).toBeGreaterThanOrEqual(0)
        expect(y).toBeGreaterThanOrEqual(0)
        expect(x + width).toBeLessThanOrEqual(1953)
        expect(y + height).toBeLessThanOrEqual(2685)
        expect(exercise.rootCrop).toEqual(root.rootCrop)
      }
    }
  })
  it('classifies bow by sound, hand-side by shape, and cross by meaning', () => {
    expect(roots.some((x) => x.glyph === '弓' && x.category === 'sound' && x.code === 'q')).toBe(
      true,
    )
    expect(roots.some((x) => x.glyph === '扌' && x.category === 'shape' && x.code === 'j')).toBe(
      true,
    )
    expect(roots.some((x) => x.glyph === '十' && x.category === 'meaning' && x.code === 'j')).toBe(
      true,
    )
  })
  it('loads existing preferences and retains new round lengths', () => {
    vi.stubGlobal('localStorage', {
      getItem: (key: string) =>
        key === STORAGE_KEY
          ? JSON.stringify({ version: 1, preferences: { sessionLength: 100 } })
          : null,
    })
    try {
      expect(readSavedData().preferences).toMatchObject({ sessionLength: 100, singleScope: 'all' })
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
