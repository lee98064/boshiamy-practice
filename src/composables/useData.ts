import { computed, reactive, ref, watch } from 'vue'
import bundled from '../data/dictionary.json'
import type { Category, DictionaryEntry, Exercise, SessionRecord } from '../types'
import { mergeDictionary } from '../lib/dictionary'
import { localDate, readImported, readSavedData, saveImported, STORAGE_KEY } from '../lib/storage'

const saved = reactive(readSavedData())
const imported = ref<DictionaryEntry[]>([])
const pendingReview = ref<Exercise[] | null>(null)
const notice = ref('')
let noticeTimer: ReturnType<typeof setTimeout>
function notify(message: string) {
  notice.value = message
  clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => (notice.value = ''), 5000)
}
const storageWarning = ref('')
watch(
  saved,
  () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
      storageWarning.value = ''
    } catch {
      storageWarning.value = '瀏覽器無法儲存紀錄；本次仍可練習，重新整理後可能遺失。'
    }
  },
  { deep: true },
)
const dictionary = computed(() =>
  mergeDictionary(
    Object.entries(bundled).map(([char, codes]) => ({ char, codes })),
    imported.value,
  ),
)
const date = ref(localDate())
function refreshDate() {
  date.value = localDate()
}
const today = computed(() =>
  saved.attempts.filter((attempt) => localDate(new Date(attempt.at)) === date.value),
)
const todayCorrect = computed(() => today.value.filter((attempt) => attempt.correct).length)
const todayAccuracy = computed(() =>
  today.value.length ? Math.round((todayCorrect.value / today.value.length) * 100) : null,
)
function addMistake(exercise: Exercise) {
  if (!saved.mistakes.some((item) => item.id === exercise.id)) saved.mistakes.push({ ...exercise })
}
function recordAttempt(exercise: Exercise, correct: boolean, skipped: boolean, category: Category) {
  refreshDate()
  saved.attempts.push({
    id: exercise.id,
    glyph: exercise.glyph,
    correct,
    skipped,
    category,
    at: new Date().toISOString(),
  })
  saved.attempts = saved.attempts.slice(-10000)
  if (!correct) addMistake(exercise)
}
function recordSession(record: SessionRecord) {
  saved.sessions.unshift(record)
  saved.sessions = saved.sessions.slice(0, 100)
}
function toggleFavorite(char: string) {
  if (saved.favorites.includes(char))
    saved.favorites = saved.favorites.filter((value) => value !== char)
  else saved.favorites.push(char)
}
async function loadDictionary() {
  try {
    imported.value = await readImported()
  } catch {
    storageWarning.value = '無法讀取本機匯入的碼表；內建查碼與練習仍可使用。'
  }
}
async function importDictionary(entries: DictionaryEntry[]) {
  await saveImported(entries)
  imported.value = entries
}

export function useData() {
  return {
    saved,
    dictionary,
    imported,
    pendingReview,
    notice,
    storageWarning,
    today,
    todayCorrect,
    todayAccuracy,
    notify,
    recordAttempt,
    recordSession,
    toggleFavorite,
    addMistake,
    loadDictionary,
    importDictionary,
    refreshDate,
  }
}
