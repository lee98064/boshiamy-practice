export type Category = 'shape' | 'sound' | 'meaning' | 'words' | 'idioms' | 'article'
export type Page = 'practice' | 'lookup' | 'notebook' | 'settings'
export interface Root {
  id: string
  glyph: string
  code: string
  category: Category
  hint: string
  explanation: string
}
export interface DictionaryEntry {
  char: string
  codes: string[]
}
export interface Exercise {
  id: string
  glyph: string
  codes: string[]
  hint: string
  explanation: string
  isRoot: boolean
  context?: string
  position?: number
}
export interface Attempt {
  id: string
  glyph: string
  correct: boolean
  skipped: boolean
  category: Category
  at: string
}
export interface SessionRecord {
  at: string
  category: Category
  correct: number
  total: number
  seconds: number
}
export interface Preferences {
  showKeyboard: boolean
  dailyGoal: number
  sessionLength: number
  inputMode: 'code' | 'text'
}
export interface SavedData {
  version: 1
  favorites: string[]
  mistakes: Exercise[]
  attempts: Attempt[]
  sessions: SessionRecord[]
  preferences: Preferences
}
