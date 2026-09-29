<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Bookmark, RotateCcw, Trash2, BookOpen, CheckCircle2 } from '@lucide/vue'
import { useData } from '../composables/useData'
import { categories } from '../data/lessons'
import type { Exercise } from '../types'
import { refreshExercise } from '../lib/dictionary'
import RootGlyph from '../components/RootGlyph.vue'
const router = useRouter()
const { saved, dictionary, toggleFavorite, pendingReview } = useData()
function review(exercises: Exercise[]) {
  pendingReview.value = exercises
  router.push({ name: 'practice' })
}
function lookup(char: string) {
  router.push({ name: 'lookup', query: char ? { q: char } : {} })
}
const tab = ref<'mistakes' | 'favorites' | 'history'>('mistakes')
const favorites = computed(() =>
  saved.favorites.flatMap((char) => dictionary.value.filter((entry) => entry.char === char)),
)
const mistakes = computed(() =>
  saved.mistakes.map((item) => refreshExercise(item, dictionary.value)),
)
const favoriteExercises = computed<Exercise[]>(() =>
  favorites.value.map((entry) => ({
    id: `char-${entry.char}`,
    glyph: entry.char,
    codes: entry.recommendedCodes || entry.codes,
    recommendedSource: entry.recommendedSource,
    hint: `第一碼是 ${(entry.recommendedCodes?.[0] || entry.codes[0])?.[0]?.toUpperCase()}`,
    explanation: '從收藏裡挑出來，再熟悉一次。',
    isRoot: false,
  })),
)
</script>

<template>
  <section>
    <div class="page-intro">
      <div>
        <span class="quiet-label">我的字本</span>
        <h1>不熟的，再熟悉一次。</h1>
        <p>錯過的字與想記住的字，都留在這裡。</p>
      </div>
      <Bookmark class="intro-icon" :size="42" />
    </div>
    <div class="notebook-tabs" role="group" aria-label="字本分類">
      <button :class="{ active: tab === 'mistakes' }" @click="tab = 'mistakes'">
        待複習 <span>{{ saved.mistakes.length }}</span></button
      ><button :class="{ active: tab === 'favorites' }" @click="tab = 'favorites'">
        已收藏 <span>{{ favorites.length }}</span></button
      ><button :class="{ active: tab === 'history' }" @click="tab = 'history'">練習紀錄</button>
    </div>
    <template v-if="tab === 'mistakes'">
      <div v-if="saved.mistakes.length" class="section-heading">
        <p>答錯或跳過的題目會留在這裡，熟悉後可自行移除。</p>
        <button class="primary-button compact" @click="review(mistakes)">
          <RotateCcw :size="16" /> 複習全部
        </button>
      </div>
      <div v-if="saved.mistakes.length" class="notebook-grid">
        <article v-for="item in mistakes" :key="item.id" class="note-card">
          <div>
            <small>{{
              item.isRoot
                ? '字根'
                : item.recommendedSource === 'official'
                  ? '建議碼'
                  : item.recommendedSource === 'imported'
                    ? '指定練習碼'
                    : '一般碼表'
            }}</small
            ><button
              class="icon-button"
              :aria-label="`移除錯題 ${item.glyph}`"
              @click="saved.mistakes = saved.mistakes.filter((value) => value.id !== item.id)"
            >
              <CheckCircle2 :size="18" />
            </button>
          </div>
          <strong><RootGlyph :glyph="item.glyph" :crop="item.rootCrop" /></strong
          ><span class="note-code">{{ item.codes[0]?.toUpperCase() }}</span
          ><button class="text-button" @click="review([item])">再練一次</button>
        </article>
      </div>
      <div v-else class="empty-state">
        <CheckCircle2 :size="38" />
        <h2>目前沒有待複習的字</h2>
        <p>練習時答錯或跳過的題目，會自動收進字本。</p>
      </div>
    </template>
    <template v-if="tab === 'favorites'">
      <div v-if="favorites.length" class="section-heading">
        <p>你想多看一眼的字。</p>
        <button class="primary-button compact" @click="review(favoriteExercises)">
          <BookOpen :size="16" /> 練習收藏
        </button>
      </div>
      <div v-if="favorites.length" class="notebook-grid">
        <article v-for="entry in favorites" :key="entry.char" class="note-card">
          <div>
            <small>{{
              entry.recommendedSource === 'official'
                ? '建議碼'
                : entry.recommendedSource === 'imported'
                  ? '指定練習碼'
                  : '一般碼表'
            }}</small
            ><button
              class="icon-button"
              :aria-label="`取消收藏 ${entry.char}`"
              @click="toggleFavorite(entry.char)"
            >
              <Trash2 :size="16" />
            </button>
          </div>
          <strong>{{ entry.char }}</strong
          ><span class="note-code">{{
            (entry.recommendedCodes?.[0] || entry.codes[0])?.toUpperCase()
          }}</span
          ><button class="text-button" @click="lookup(entry.char)">查看全部字碼</button>
        </article>
      </div>
      <div v-else class="empty-state">
        <Bookmark :size="38" />
        <h2>留一個位置，給想記住的字。</h2>
        <p>查碼時點一下書籤，就能把文字收進這裡。</p>
        <button class="secondary-button" @click="lookup('')">去查碼</button>
      </div>
    </template>
    <template v-if="tab === 'history'">
      <div v-if="saved.sessions.length" class="history-list">
        <article v-for="(record, i) in saved.sessions" :key="i">
          <div>
            <strong>{{ categories.find((item) => item.id === record.category)?.name }}練習</strong
            ><span>{{
              new Date(record.at).toLocaleString('zh-TW', {
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            }}</span>
          </div>
          <div>
            <strong>{{ record.correct }} / {{ record.total }}</strong
            ><span>首次答對</span>
          </div>
          <div>
            <strong>{{ record.seconds }} 秒</strong><span>練習用時</span>
          </div>
        </article>
      </div>
      <div v-else class="empty-state">
        <BookOpen :size="38" />
        <h2>第一回合，等你完成。</h2>
        <p>完成一回合練習後，就能在這裡看到紀錄。</p>
      </div>
    </template>
  </section>
</template>
