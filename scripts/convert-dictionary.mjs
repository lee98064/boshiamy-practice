import { readFile, writeFile } from 'node:fs/promises'
// Usage: node scripts/convert-dictionary.mjs /path/to/boshiamy.cin
if (!process.argv[2]) throw new Error('請提供 UTF-8 CIN 檔案路徑。')
const text = await readFile(process.argv[2], 'utf8')
let inside = false
const entries = new Map()
for (const raw of text.split(/\r?\n/)) {
  const line = raw.trim()
  if (line === '%chardef begin') {
    inside = true
    continue
  }
  if (line === '%chardef end') break
  if (!inside || line.startsWith('#')) continue
  const [code, char] = line.split(/\s+/)
  if (!code || !char || [...char].length !== 1 || !/^[a-z,.'\[\];=-]{1,8}$/.test(code)) continue
  if (!entries.has(char)) entries.set(char, new Set())
  entries.get(char).add(code)
}
if (!entries.size) throw new Error('沒有找到字碼。')
const result = Object.fromEntries(
  [...entries].map(([char, codes]) => [
    char,
    [...codes].sort((a, b) => a.length - b.length || a.localeCompare(b, 'en')),
  ]),
)
await writeFile(
  new URL('../src/data/dictionary.json', import.meta.url),
  `${JSON.stringify(result)}\n`,
)
console.log(`已轉換 ${entries.size} 個字元；請保留原始來源與授權標示。`)
