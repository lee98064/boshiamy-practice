import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import type { Category, Exercise, SavedData, SessionRecord } from '../types'
import { isCorrect, normalizeCode } from '../lib/dictionary'

const ANSWER_SETTLE_MS = 220

export function usePractice(
  onAttempt: (exercise: Exercise, correct: boolean, skipped: boolean, category: Category) => void,
  onComplete: (record: SessionRecord) => void,
  saved: SavedData,
  onWrong: (exercise: Exercise) => void,
) {
  const queue = ref<Exercise[]>([]),
    index = ref(0),
    input = ref(''),
    status = ref<'ready' | 'wrong' | 'correct' | 'skipped'>('ready')
  const category = ref<Category>('shape'),
    complete = ref(false),
    hintShown = ref(false),
    wrongOnCurrent = ref(false)
  const firstTryCorrect = ref(0),
    answered = ref(0),
    elapsed = ref(0),
    started = ref(false),
    composing = ref(false),
    active = ref(true)
  let checkTimer: ReturnType<typeof setTimeout> | undefined
  function clearPending() {
    clearTimeout(checkTimer)
  }
  function canAutoProceed() {
    return active.value && !complete.value && document.visibilityState === 'visible'
  }
  let lastTick = Date.now()
  const timer = setInterval(() => {
    const now = Date.now()
    if (started.value && active.value && !complete.value && document.visibilityState === 'visible')
      elapsed.value += Math.min((now - lastTick) / 1000, 2)
    lastTick = now
  }, 500)
  onMounted(() => document.addEventListener('visibilitychange', reschedule))
  onUnmounted(() => {
    clearInterval(timer)
    clearPending()
    document.removeEventListener('visibilitychange', reschedule)
  })
  const current = computed(() => queue.value[index.value])
  const accuracy = computed(() =>
    answered.value ? Math.round((firstTryCorrect.value / answered.value) * 100) : null,
  )
  const time = computed(
    () =>
      `${Math.floor(elapsed.value / 60)
        .toString()
        .padStart(2, '0')}:${Math.floor(elapsed.value % 60)
        .toString()
        .padStart(2, '0')}`,
  )
  const progress = computed(() =>
    queue.value.length ? Math.round((answered.value / queue.value.length) * 100) : 0,
  )
  function start(items: Exercise[], mode: Category) {
    clearPending()
    queue.value = items
    category.value = mode
    index.value = 0
    input.value = ''
    status.value = 'ready'
    complete.value = false
    hintShown.value = false
    wrongOnCurrent.value = false
    firstTryCorrect.value = 0
    answered.value = 0
    elapsed.value = 0
    started.value = false
    composing.value = false
    lastTick = Date.now()
  }
  function submit() {
    if (!current.value || complete.value || !active.value || composing.value) return
    clearPending()
    if (status.value === 'correct' || status.value === 'skipped') {
      next()
      return
    }
    if (!input.value.trim()) return
    started.value = true
    const valid =
      saved.preferences.inputMode === 'text'
        ? input.value.trim() === current.value.glyph
        : isCorrect(input.value, current.value.codes)
    if (valid) {
      status.value = 'correct'
      answered.value++
      if (!wrongOnCurrent.value) firstTryCorrect.value++
      onAttempt(current.value, !wrongOnCurrent.value, false, category.value)
      // Advance in the same update so no intermediate success UI is rendered.
      next()
    } else {
      status.value = 'wrong'
      wrongOnCurrent.value = true
      onWrong(current.value)
    }
  }
  function skip() {
    if (
      !current.value ||
      complete.value ||
      status.value === 'correct' ||
      status.value === 'skipped'
    )
      return
    clearPending()
    started.value = true
    status.value = 'skipped'
    answered.value++
    onAttempt(current.value, false, true, category.value)
  }
  function next() {
    if (
      complete.value ||
      !active.value ||
      (status.value !== 'correct' && status.value !== 'skipped')
    )
      return
    clearPending()
    if (index.value + 1 >= queue.value.length) {
      complete.value = true
      onComplete({
        category: category.value,
        correct: firstTryCorrect.value,
        total: queue.value.length,
        seconds: Math.round(elapsed.value),
        at: new Date().toISOString(),
      })
      return
    }
    index.value++
    input.value = ''
    status.value = 'ready'
    hintShown.value = false
    wrongOnCurrent.value = false
  }
  function scheduleCheck() {
    clearTimeout(checkTimer)
    if (
      !canAutoProceed() ||
      composing.value ||
      status.value === 'correct' ||
      status.value === 'skipped'
    )
      return
    if (!input.value.trim()) {
      status.value = 'ready'
      return
    }
    checkTimer = setTimeout(() => {
      if (!canAutoProceed() || composing.value || !current.value) return
      const code = normalizeCode(input.value)
      // A valid prefix is still being typed, not an incorrect answer.
      if (
        saved.preferences.inputMode === 'code' &&
        !isCorrect(code, current.value.codes) &&
        current.value.codes.some((value) => value.startsWith(code))
      ) {
        status.value = 'ready'
        return
      }
      submit()
    }, ANSWER_SETTLE_MS)
  }
  function reschedule() {
    clearPending()
    scheduleCheck()
  }
  watch([input, composing, active], scheduleCheck)
  watch(input, (value) => {
    if (value && !started.value) {
      started.value = true
      lastTick = Date.now()
    }
  })
  return {
    queue,
    index,
    input,
    status,
    category,
    complete,
    hintShown,
    firstTryCorrect,
    answered,
    elapsed,
    current,
    accuracy,
    time,
    progress,
    active,
    composing,
    start,
    submit,
    skip,
    next,
  }
}
