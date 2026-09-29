import { computed, nextTick, onActivated, onDeactivated, ref, useTemplateRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Category, Page } from '../types'
import { articles, categories, roots, wordSets } from '../data/lessons'
import { refreshExercise, textExercises } from '../lib/dictionary'
import { useData } from './useData'
import { usePractice } from './usePractice'
import { createPracticeDeck, rootExercise, singleCharacterPool } from '../lib/practice-deck'

export function usePracticePage() {
  const route = useRoute(),
    router = useRouter()
  const {
    saved,
    dictionary,
    today,
    todayAccuracy,
    pendingReview,
    recordAttempt,
    recordSession,
    addMistake,
  } = useData()
  const category = ref<Category>((route.params.category as Category) || 'shape')
  const selectedArticle = ref('morning'),
    selectedWord = ref(category.value === 'idioms' ? '一心一意' : '日月'),
    customText = ref('')
  const isReview = ref(false),
    missing = ref<string[]>([]),
    unverified = ref<string[]>([])
  const inputEl = useTemplateRef<HTMLInputElement>('practice-answer')
  const practice = usePractice(recordAttempt, recordSession, saved, addMistake)
  const {
    queue,
    index,
    input,
    status,
    complete,
    hintShown,
    firstTryCorrect,
    answered,
    current,
    accuracy,
    time,
    progress,
    composing,
  } = practice
  const activeCategory = computed(() => categories.find((item) => item.id === category.value)!)
  const isRootCategory = computed(() => ['shape', 'sound', 'meaning'].includes(category.value))
  const rootKey = ref(
    typeof route.query.key === 'string' && /^[a-z]$/.test(route.query.key) ? route.query.key : '',
  )
  const rootPool = computed(() =>
    roots.filter(
      (root) => root.category === category.value && (!rootKey.value || root.code === rootKey.value),
    ),
  )
  const characterPool = computed(() =>
    singleCharacterPool(dictionary.value, saved.preferences.singleScope),
  )
  const poolSize = computed(() =>
    isRootCategory.value ? rootPool.value.length : characterPool.value.length,
  )
  const decks = new Map<string, ReturnType<typeof createPracticeDeck>>()
  function deck() {
    const key = `${category.value}-${isRootCategory.value ? rootKey.value : saved.preferences.singleScope}`
    if (!decks.has(key)) decks.set(key, createPracticeDeck())
    return decks.get(key)!
  }
  const specialKeys = computed(() => [
    ...new Set((current.value?.codes || []).join('').replace(/[a-z]/g, '')),
  ])
  const hasAnswered = computed(() => status.value === 'correct' || status.value === 'skipped')
  const answerMode = computed(() =>
    saved.preferences.inputMode === 'text'
      ? 'text'
      : saved.preferences.showKeyboard
        ? 'onscreen'
        : 'keyboard',
  )
  const answerLength = computed(() => {
    const codes = current.value?.codes || []
    const matching = codes.find((code) => code.startsWith(input.value.toLowerCase()))
    return Math.max(1, input.value.length, (matching || codes[0] || '').length)
  })
  const submitLabel = computed(() =>
    status.value === 'skipped'
      ? index.value + 1 === queue.value.length
        ? '看結果'
        : '下一題'
      : '檢查',
  )
  const sessionLabel = computed(() =>
    isReview.value
      ? '字本複習'
      : isRootCategory.value
        ? '字根練習'
        : category.value === 'single'
          ? '隨機單字'
          : '逐字練習',
  )
  function navigate(name: Page) {
    router.push({ name })
  }
  function makeLesson() {
    isReview.value = false
    missing.value = []
    unverified.value = []
    if (isRootCategory.value) {
      practice.start(
        deck().draw(rootPool.value, saved.preferences.sessionLength).map(rootExercise),
        category.value,
      )
    } else if (category.value === 'single') {
      practice.start(deck().draw(characterPool.value, saved.preferences.sessionLength), 'single')
    } else {
      const content =
        category.value === 'article'
          ? selectedArticle.value === 'custom'
            ? customText.value
            : articles.find((item) => item.id === selectedArticle.value)?.text || ''
          : selectedWord.value
      const result = textExercises(content, dictionary.value)
      missing.value = result.missing
      unverified.value = result.unverified
      practice.start(result.missing.length ? [] : result.exercises, category.value)
    }
  }
  function selectCategory(value: Category) {
    if (value === category.value && !isReview.value) return
    category.value = value
    rootKey.value = ''
    if (value === 'words' || value === 'idioms') selectedWord.value = wordSets[value][0]!
    makeLesson()
    router.push({ name: 'practice', params: { category: value } })
  }
  function selectRootKey(value: string) {
    rootKey.value = value
    makeLesson()
    router.replace({
      name: 'practice',
      params: { category: category.value },
      query: value ? { key: value } : {},
    })
  }
  function focusAnswer() {
    if (answerMode.value !== 'onscreen')
      nextTick(() => inputEl.value?.focus({ preventScroll: true }))
  }
  function setAnswerMode(mode: 'onscreen' | 'keyboard' | 'text') {
    composing.value = false
    saved.preferences.inputMode = mode === 'text' ? 'text' : 'code'
    if (mode !== 'text') saved.preferences.showKeyboard = mode === 'onscreen'
    focusAnswer()
  }
  function submit() {
    if (composing.value) return
    practice.submit()
    focusAnswer()
  }
  function onKeydown(event: KeyboardEvent) {
    if (event.isComposing || composing.value || event.keyCode === 229) return
    if (event.key === 'Enter' || (event.key === ' ' && saved.preferences.inputMode === 'code')) {
      event.preventDefault()
      submit()
    }
    if (event.key === 'Escape') {
      input.value = ''
      event.preventDefault()
    }
  }
  function onInput(event: Event) {
    const target = event.target as HTMLInputElement
    if (hasAnswered.value) {
      target.value = input.value
      return
    }
    if (saved.preferences.inputMode === 'code' && !composing.value) {
      input.value = target.value
        .toLowerCase()
        .replace(/[^a-z,.'\[\];=-]/g, '')
        .slice(0, 8)
      target.value = input.value
    } else input.value = target.value
  }
  function virtualKey(key: string) {
    if (hasAnswered.value || answerMode.value !== 'onscreen') return
    const value = input.value + key
    if (
      value.length <= answerLength.value ||
      current.value?.codes.some((code) => code.startsWith(value))
    )
      input.value = value
  }
  function onCompositionEnd(event: Event) {
    composing.value = false
    onInput(event)
  }
  function backspace() {
    if (hasAnswered.value) return
    input.value = input.value.slice(0, -1)
    focusAnswer()
  }
  function openLookup(char = '') {
    router.push({ name: 'lookup', query: char ? { q: char } : {} })
  }
  function readRoute() {
    if (route.name !== 'practice') return
    if (pendingReview.value?.length) {
      isReview.value = true
      missing.value = []
      const exercises = pendingReview.value.map((item) => refreshExercise(item, dictionary.value))
      unverified.value = [
        ...new Set(
          exercises
            .filter((item) => !item.isRoot && !item.recommendedSource)
            .map((item) => item.glyph),
        ),
      ]
      practice.start(exercises, 'words')
      pendingReview.value = null
      return
    }
    if (typeof route.query.text === 'string') {
      category.value = 'article'
      selectedArticle.value = 'custom'
      customText.value = route.query.text.slice(0, 2000)
      makeLesson()
      router.replace({ name: 'practice', params: { category: 'article' } })
      return
    }
    const nextCategory = (route.params.category as Category) || category.value
    const nextKey =
      typeof route.query.key === 'string' && /^[a-z]$/.test(route.query.key) ? route.query.key : ''
    if (nextCategory !== category.value || nextKey !== rootKey.value) {
      category.value = nextCategory
      rootKey.value = nextKey
      if (nextCategory === 'words' || nextCategory === 'idioms')
        selectedWord.value = wordSets[nextCategory][0]!
      makeLesson()
    }
  }
  watch(() => [route.name, route.params.category, route.query.text, route.query.key], readRoute)
  watch(
    () => [current.value?.rootCrop, saved.preferences.inputMode],
    () => {
      if (current.value?.rootCrop && saved.preferences.inputMode === 'text')
        saved.preferences.inputMode = 'code'
    },
  )
  watch(
    () => saved.preferences.inputMode,
    () => {
      input.value = ''
      composing.value = false
    },
  )
  watch(
    () => [saved.preferences.sessionLength, saved.preferences.singleScope],
    () => {
      if (!isReview.value && (isRootCategory.value || category.value === 'single')) makeLesson()
    },
  )
  watch(dictionary, () => {
    if (!answered.value && !isReview.value && !isRootCategory.value) makeLesson()
  })
  onActivated(() => {
    practice.active.value = true
    readRoute()
  })
  onDeactivated(() => {
    practice.active.value = false
  })
  makeLesson()
  return {
    saved,
    today,
    todayAccuracy,
    category,
    selectedArticle,
    selectedWord,
    customText,
    isReview,
    missing,
    unverified,
    composing,
    practice,
    queue,
    index,
    input,
    status,
    complete,
    hintShown,
    firstTryCorrect,
    answered,
    current,
    accuracy,
    time,
    progress,
    activeCategory,
    isRootCategory,
    rootKey,
    poolSize,
    specialKeys,
    selectRootKey,
    hasAnswered,
    answerMode,
    answerLength,
    submitLabel,
    setAnswerMode,
    sessionLabel,
    navigate,
    makeLesson,
    selectCategory,
    onCompositionEnd,
    backspace,
    submit,
    onKeydown,
    onInput,
    virtualKey,
    openLookup,
  }
}
