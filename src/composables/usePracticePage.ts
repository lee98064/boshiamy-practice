import { computed, nextTick, onActivated, onDeactivated, ref, useTemplateRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Category, Page } from '../types'
import { articles, categories, roots, wordSets } from '../data/lessons'
import { textExercises } from '../lib/dictionary'
import { useData } from './useData'
import { usePractice } from './usePractice'

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
    missing = ref<string[]>([])
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
  const hasAnswered = computed(() => status.value === 'correct' || status.value === 'skipped')
  const sessionLabel = computed(() =>
    isReview.value ? '字本複習' : isRootCategory.value ? '字根練習' : '逐字練習',
  )
  function navigate(name: Page) {
    router.push({ name })
  }
  function makeLesson() {
    isReview.value = false
    missing.value = []
    if (isRootCategory.value) {
      const pool = roots.filter((root) => root.category === category.value)
      practice.start(
        Array.from({ length: saved.preferences.sessionLength }, (_, i) => {
          const root = pool[i % pool.length]!
          return {
            id: root.id,
            glyph: root.glyph,
            codes: [root.code],
            hint: root.hint,
            explanation: root.explanation,
            isRoot: true,
          }
        }),
        category.value,
      )
    } else {
      const content =
        category.value === 'article'
          ? selectedArticle.value === 'custom'
            ? customText.value
            : articles.find((item) => item.id === selectedArticle.value)?.text || ''
          : selectedWord.value
      const result = textExercises(content, dictionary.value)
      missing.value = result.missing
      practice.start(result.missing.length ? [] : result.exercises, category.value)
    }
  }
  function selectCategory(value: Category) {
    if (value === category.value && !isReview.value) return
    category.value = value
    if (value === 'words' || value === 'idioms') selectedWord.value = wordSets[value][0]!
    makeLesson()
    router.push({ name: 'practice', params: { category: value } })
  }
  function focusAnswer() {
    nextTick(() => inputEl.value?.focus({ preventScroll: true }))
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
    if (!hasAnswered.value && input.value.length < 8) input.value += key
    focusAnswer()
  }
  function onCompositionEnd(event: Event) {
    composing.value = false
    onInput(event)
  }
  function backspace() {
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
      practice.start(pendingReview.value, 'words')
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
    if (nextCategory !== category.value) {
      category.value = nextCategory
      if (nextCategory === 'words' || nextCategory === 'idioms')
        selectedWord.value = wordSets[nextCategory][0]!
      makeLesson()
    }
  }
  watch(() => [route.name, route.params.category, route.query.text], readRoute)
  watch(
    () => saved.preferences.inputMode,
    () => {
      input.value = ''
      composing.value = false
    },
  )
  watch(
    () => saved.preferences.sessionLength,
    () => {
      if (!isReview.value && isRootCategory.value) makeLesson()
    },
  )
  watch(dictionary, () => {
    if (!answered.value && !isReview.value) makeLesson()
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
    hasAnswered,
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
