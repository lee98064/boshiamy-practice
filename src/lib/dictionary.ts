import type { DictionaryEntry, Exercise } from '../types'

export function normalizeCode(code: string): string {
  return code.trim().toLowerCase().replace(/\s+/g, '')
}
export function isCorrect(input: string, codes: string[]): boolean {
  return codes.some((code) => normalizeCode(code) === normalizeCode(input))
}
export function mergeDictionary(
  base: DictionaryEntry[],
  imported: DictionaryEntry[],
): DictionaryEntry[] {
  const index = new Map(base.map((entry) => [entry.char, [...entry.codes]]))
  for (const entry of imported)
    index.set(entry.char, [...new Set([...(index.get(entry.char) || []), ...entry.codes])])
  return [...index].map(([char, codes]) => ({ char, codes }))
}

// UTF-8 CIN and [{ char, codes }] JSON. Never evaluate imported content.
export function parseDictionary(text: string): DictionaryEntry[] {
  if (text.length > 5_000_000) throw new Error('檔案超過 5 MB，請使用較小的字碼表。')
  const clean = text.replace(/^\uFEFF/, '').trim()
  const entries = new Map<string, Set<string>>()
  const add = (char: unknown, code: unknown) => {
    if (
      typeof char !== 'string' ||
      [...char].length !== 1 ||
      /\s/u.test(char) ||
      typeof code !== 'string'
    )
      return
    const normalized = normalizeCode(code)
    if (!/^[a-z,.'\[\];=-]{1,8}$/.test(normalized)) return
    if (!entries.has(char)) entries.set(char, new Set())
    entries.get(char)!.add(normalized)
  }
  if (clean.startsWith('[')) {
    let data: unknown
    try {
      data = JSON.parse(clean)
    } catch {
      throw new Error('JSON 格式不正確，請檢查檔案內容。')
    }
    if (!Array.isArray(data)) throw new Error('JSON 必須是包含 char 和 codes 的陣列。')
    for (const item of data)
      if (item && typeof item === 'object' && Array.isArray(item.codes))
        for (const code of item.codes) add(item.char, code)
  } else {
    let inside = false
    for (const raw of clean.split(/\r?\n/)) {
      const line = raw.trim()
      if (/^%chardef\s+begin$/i.test(line)) {
        inside = true
        continue
      }
      if (/^%chardef\s+end$/i.test(line)) {
        inside = false
        break
      }
      if (!inside || !line || line.startsWith('#') || line.startsWith('%')) continue
      const [code, char] = line.split(/\s+/)
      add(char, code)
    }
  }
  if (!entries.size)
    throw new Error(
      '沒有讀到有效字碼。請使用 UTF-8 CIN（含 %chardef）或 char / codes 格式的 JSON。',
    )
  return [...entries].map(([char, codes]) => ({ char, codes: [...codes] }))
}

export function searchDictionary(entries: DictionaryEntry[], query: string): DictionaryEntry[] {
  const trimmed = query.trim()
  if (!trimmed) return []
  if (/^[a-z,.'\[\];=\-]+$/i.test(trimmed)) {
    const code = normalizeCode(trimmed)
    return entries
      .filter((entry) => entry.codes.some((value) => value.startsWith(code)))
      .sort((a, b) => Number(b.codes.includes(code)) - Number(a.codes.includes(code)))
  }
  return [...new Set([...trimmed])].flatMap((char) =>
    entries.filter((entry) => entry.char === char),
  )
}

export function textExercises(
  text: string,
  entries: DictionaryEntry[],
): { exercises: Exercise[]; missing: string[] } {
  const map = new Map(entries.map((entry) => [entry.char, entry.codes]))
  const exercises: Exercise[] = [],
    missing: string[] = []
  ;[...text].forEach((glyph, position) => {
    if (!/\p{Script=Han}/u.test(glyph)) return
    const codes = map.get(glyph)
    if (!codes) {
      missing.push(glyph)
      return
    }
    exercises.push({
      id: `char-${glyph}`,
      glyph,
      codes,
      hint: `第一碼是 ${codes[0]![0]!.toUpperCase()}`,
      explanation: '依照書寫順序拆碼；本題接受已收錄的完整碼與簡碼。',
      isRoot: false,
      context: text,
      position,
    })
  })
  return { exercises, missing: [...new Set(missing)] }
}
