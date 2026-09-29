export type RootCategory = 'shape' | 'sound' | 'meaning'
export type Category = RootCategory | 'single' | 'words' | 'idioms' | 'article'
export type Page = 'practice' | 'lookup' | 'notebook' | 'settings' | 'roots'
export type RootCrop = [x: number, y: number, width: number, height: number]
export interface Root {
  id: string
  glyph: string
  code: string
  category: RootCategory
  rootCrop?: RootCrop
  hint: string
  explanation: string
}
export interface DictionaryEntry {
  char: string
  codes: string[]
  recommendedCodes?: string[]
  recommendedSource?: 'official' | 'imported'
}
export interface Exercise {
  id: string
  glyph: string
  codes: string[]
  hint: string
  explanation: string
  isRoot: boolean
  rootCrop?: RootCrop
  recommendedSource?: 'official' | 'imported'
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
  singleScope: 'all' | 'recommended'
}
export interface SavedData {
  version: 1
  favorites: string[]
  mistakes: Exercise[]
  attempts: Attempt[]
  sessions: SessionRecord[]
  preferences: Preferences
}
