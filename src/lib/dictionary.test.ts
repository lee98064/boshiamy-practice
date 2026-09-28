import { describe, expect, it } from 'vitest'
import {
  isCorrect,
  mergeDictionary,
  parseDictionary,
  refreshExercise,
  searchDictionary,
  textExercises,
} from './dictionary'
import dictionary from '../data/dictionary.json'
import recommendations from '../data/recommended-codes.json'
import { articles, wordSets } from '../data/lessons'
import type { DictionaryEntry, Exercise } from '../types'
const entries = mergeDictionary(
  Object.entries(dictionary).map(([char, codes]) => ({ char, codes })),
  Object.entries(recommendations).map(([char, recommendedCodes]) => ({
    char,
    codes: recommendedCodes,
    recommendedCodes,
    recommendedSource: 'official',
  })),
)

describe('answer checking', () => {
  it('accepts uppercase, full codes, and alternative codes without accepting a prefix', () => {
    expect(isCorrect(' GZJ ', ['gz', 'gzj'])).toBe(true)
    expect(isCorrect('gz', ['gz', 'gzj'])).toBe(true)
    expect(isCorrect('g', ['gz', 'gzj'])).toBe(false)
    expect(isCorrect('', ['oo'])).toBe(false)
  })
  it('keeps root answers distinct from complete character codes', () => {
    expect(isCorrect('o', ['oo'])).toBe(false)
    expect(isCorrect('o', ['o'])).toBe(true)
  })
})
describe('dictionary imports', () => {
  it('ignores CIN key-name and comment sections and preserves multiple codes', () => {
    const cin =
      '\uFEFF%keyname begin\no Ｏ\n%keyname end\n%chardef begin\n# comment\noo 口\nGZ 好\ngzj 好\ngz 好\n%chardef end\na 不'
    expect(parseDictionary(cin)).toEqual([
      { char: '口', codes: ['oo'] },
      { char: '好', codes: ['gz', 'gzj'] },
    ])
  })
  it('accepts supplementary Unicode characters and rejects malformed entries', () => {
    expect(
      parseDictionary(
        JSON.stringify([
          { char: '𠮷', codes: ['Yo'] },
          { char: 'two', codes: ['a'] },
          { char: '好', codes: [3] },
        ]),
      ),
    ).toEqual([{ char: '𠮷', codes: ['yo'] }])
  })
  it('rejects invalid, empty and oversized imports', () => {
    expect(() => parseDictionary('[broken')).toThrow('JSON')
    expect(() => parseDictionary('%keyname begin\na A')).toThrow('沒有讀到')
    expect(() => parseDictionary('x'.repeat(5_000_001))).toThrow('5 MB')
  })
  it('merges aliases without losing built-in mappings', () => {
    expect(
      mergeDictionary([{ char: '好', codes: ['gz'] }], [{ char: '好', codes: ['gz', 'gzj'] }]),
    ).toEqual([{ char: '好', codes: ['gz', 'gzj'] }])
  })
  it('preserves official recommendations when adding aliases and honors explicit import choices', () => {
    const base: DictionaryEntry[] = [
      {
        char: '好',
        codes: ['gz', 'gzj'],
        recommendedCodes: ['gzj'],
        recommendedSource: 'official',
      },
    ]
    const aliases = parseDictionary('%chardef begin\ngzn 好\n%chardef end')
    expect(mergeDictionary(base, aliases)[0]).toEqual({ ...base[0], codes: ['gzj', 'gz', 'gzn'] })
    const imported = parseDictionary(
      '[{"char":"好","codes":["gz","gzj"],"recommendedCodes":[" GZ ","gz"]}]',
    )
    expect(mergeDictionary(base, imported)[0]).toEqual({
      char: '好',
      codes: ['gz', 'gzj'],
      recommendedCodes: ['gz'],
      recommendedSource: 'imported',
    })
  })
  it('rejects invalid recommendations without guessing from code length', () => {
    for (const recommendedCodes of [[], ['missing'], [3], 'gzj']) {
      expect(() =>
        parseDictionary(JSON.stringify([{ char: '好', codes: ['gz', 'gzj'], recommendedCodes }])),
      ).toThrow('recommendedCodes')
    }
    expect(
      parseDictionary('[{"char":"好","codes":["gz","gzj"]}]')[0]?.recommendedCodes,
    ).toBeUndefined()
  })
})
describe('lookup and lesson coverage', () => {
  it('returns exact codes before prefix matches and preserves Chinese query order', () => {
    const values = [
      { char: '甲', codes: ['abc'] },
      { char: '乙', codes: ['ab'] },
    ]
    expect(searchDictionary(values, 'AB').map((entry) => entry.char)).toEqual(['乙', '甲'])
    expect(searchDictionary(values, '乙甲乙').map((entry) => entry.char)).toEqual(['乙', '甲'])
  })
  it('skips punctuation and identifies unknown Han characters explicitly', () => {
    const result = textExercises('你，好。𠮷！', [
      { char: '你', codes: ['pns'], recommendedCodes: ['pns'] },
      { char: '好', codes: ['gz', 'gzj'], recommendedCodes: ['gzj'] },
    ])
    expect(result.exercises.map((item) => [item.glyph, item.position])).toEqual([
      ['你', 0],
      ['好', 2],
    ])
    expect(result.missing).toEqual(['𠮷'])
    expect(result.unverified).toEqual([])
  })
  it('uses verified recommendations, which are not necessarily the shortest or longest code', () => {
    const result = textExercises('習好對的', entries)
    expect(result.exercises.map((item) => item.codes)).toEqual([['eepd'], ['gzj'], ['feba'], ['d']])
    for (const [i, shortcut] of ['ed', 'gz', 'a'].entries())
      expect(isCorrect(shortcut, result.exercises[i]!.codes)).toBe(false)
    expect(isCorrect('ee', result.exercises[0]!.codes)).toBe(false)
    expect(isCorrect('D', result.exercises[3]!.codes)).toBe(true)
    expect(searchDictionary(entries, '好')[0]?.codes[0]).toBe('gzj')
  })
  it('retains ordinary dictionary practice for unverified characters with an explicit label', () => {
    const result = textExercises('甲甲', [{ char: '甲', codes: ['qi', 'qj'] }])
    expect(result.unverified).toEqual(['甲'])
    expect(result.missing).toEqual([])
    expect(result.exercises).toHaveLength(2)
    expect(result.exercises[0]?.codes).toEqual(['qi', 'qj'])
    expect(result.exercises[0]?.recommendedSource).toBeUndefined()
    expect(result.exercises[0]?.explanation).toContain('一般碼表')
  })
  it('refreshes old saved shortcuts but leaves radical association exercises unchanged', () => {
    const old: Exercise = {
      id: 'char-習',
      glyph: '習',
      codes: ['ed', 'ee', 'eepd'],
      isRoot: false,
      hint: 'old hint',
      explanation: 'old explanation',
      context: '學習',
      position: 1,
    }
    expect(refreshExercise(old, entries)).toMatchObject({
      codes: ['eepd'],
      recommendedSource: 'official',
      context: '學習',
      position: 1,
    })
    const root: Exercise = { ...old, id: 'shape-mouth', glyph: '口', codes: ['o'], isRoot: true }
    expect(refreshExercise(root, entries)).toEqual(root)
    expect(refreshExercise(old, [])).toMatchObject({
      codes: old.codes,
      recommendedSource: undefined,
    })
  })
  it('covers every character in the bundled words, idioms and original articles', () => {
    for (const text of [
      ...wordSets.words,
      ...wordSets.idioms,
      ...articles.map((item) => item.text),
    ]) {
      const result = textExercises(text, entries)
      expect(result.missing, text).toEqual([])
      expect(result.unverified, text).toEqual([])
      expect(result.exercises.length).toBeGreaterThan(0)
    }
    expect(entries.length).toBe(13565)
    expect(Object.keys(recommendations)).toHaveLength(159)
    expect(textExercises(Object.keys(recommendations).join(''), entries).missing).toEqual([])
    expect(textExercises(Object.keys(recommendations).join(''), entries).unverified).toEqual([])
  })
})
