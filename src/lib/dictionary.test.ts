import { describe, expect, it } from 'vitest'
import {
  isCorrect,
  mergeDictionary,
  parseDictionary,
  searchDictionary,
  textExercises,
} from './dictionary'
import dictionary from '../data/dictionary.json'
import { articles, wordSets } from '../data/lessons'
const entries = Object.entries(dictionary).map(([char, codes]) => ({ char, codes }))

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
      { char: '你', codes: ['pns'] },
      { char: '好', codes: ['gz'] },
    ])
    expect(result.exercises.map((item) => [item.glyph, item.position])).toEqual([
      ['你', 0],
      ['好', 2],
    ])
    expect(result.missing).toEqual(['𠮷'])
  })
  it('covers every character in the bundled words, idioms and original articles', () => {
    for (const text of [
      ...wordSets.words,
      ...wordSets.idioms,
      ...articles.map((item) => item.text),
    ]) {
      const result = textExercises(text, entries)
      expect(result.missing, text).toEqual([])
      expect(result.exercises.length).toBeGreaterThan(0)
    }
    expect(entries.length).toBe(13563)
  })
})
