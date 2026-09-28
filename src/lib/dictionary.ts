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
  const index = new Map(base.map((entry) => [entry.char, { ...entry }]))
  for (const entry of imported) {
    const previous = index.get(entry.char)
    index.set(entry.char, {
      ...previous,
      ...entry,
      codes: [...new Set([...(previous?.codes || []), ...entry.codes])],
    })
  }
  return [...index.values()].map((entry) => ({
    ...entry,
    codes: [...new Set([...(entry.recommendedCodes || []), ...entry.codes])],
  }))
}

// UTF-8 CIN and [{ char, codes, recommendedCodes? }] JSON. Never evaluate imported content.
export function parseDictionary(text: string): DictionaryEntry[] {
  if (text.length > 5_000_000) throw new Error('檔案超過 5 MB，請使用較小的字碼表。')
  const clean = text.replace(/^\uFEFF/, '').trim()
  const entries = new Map<string, Set<string>>()
  const recommendations = new Map<string, string[]>()
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
    for (const item of data) {
      if (item && typeof item === 'object' && Array.isArray(item.codes)) {
        for (const code of item.codes) add(item.char, code)
        if (item.recommendedCodes !== undefined) {
          if (
            !Array.isArray(item.recommendedCodes) ||
            !item.recommendedCodes.length ||
            !item.recommendedCodes.every(
              (code: unknown) =>
                typeof code === 'string' && entries.get(item.char)?.has(normalizeCode(code)),
            )
          )
            throw new Error('recommendedCodes 必須是 codes 中的有效字碼陣列。')
          recommendations.set(item.char, [
            ...new Set<string>(item.recommendedCodes.map(normalizeCode)),
          ])
        }
      }
    }
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
  return [...entries].map(([char, codes]) => ({
    char,
    codes: [...codes],
    ...(recommendations.has(char)
      ? { recommendedCodes: recommendations.get(char)!, recommendedSource: 'imported' as const }
      : {}),
  }))
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
): { exercises: Exercise[]; missing: string[]; unverified: string[] } {
  const map = new Map(entries.map((entry) => [entry.char, entry]))
  const exercises: Exercise[] = [],
    missing: string[] = [],
    unverified: string[] = []
  ;[...text].forEach((glyph, position) => {
    if (!/\p{Script=Han}/u.test(glyph)) return
    const entry = map.get(glyph)
    if (!entry) {
      missing.push(glyph)
      return
    }
    const hasRecommendation = !!entry.recommendedCodes?.length
    if (!hasRecommendation) unverified.push(glyph)
    exercises.push({ ...exerciseFromEntry(entry), context: text, position })
  })
  return { exercises, missing: [...new Set(missing)], unverified: [...new Set(unverified)] }
}

function exerciseFromEntry(entry: DictionaryEntry): Exercise {
  const hasRecommendation = !!entry.recommendedCodes?.length
  const codes = hasRecommendation ? entry.recommendedCodes! : entry.codes
  return {
    id: `char-${entry.char}`,
    glyph: entry.char,
    codes,
    hint: `第一碼是 ${codes[0]![0]!.toUpperCase()}`,
    explanation: !hasRecommendation
      ? '一般碼表練習：建議碼尚未核對，接受所有收錄字碼。'
      : entry.recommendedSource === 'imported'
        ? '使用匯入碼表指定的練習碼。'
        : '本題依官方建議碼練習；其他碼不會提早完成題目。',
    isRoot: false,
    recommendedSource: hasRecommendation ? entry.recommendedSource : undefined,
  }
}

export function refreshExercise(exercise: Exercise, entries: DictionaryEntry[]): Exercise {
  if (exercise.isRoot) return exercise
  const entry = entries.find((entry) => entry.char === exercise.glyph)
  return entry
    ? { ...exercise, ...exerciseFromEntry(entry) }
    : {
        ...exercise,
        recommendedSource: undefined,
        explanation: '一般碼表練習：使用此錯題先前保存的字碼，建議碼尚未核對。',
      }
}
