<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search, Bookmark, ArrowUpRight, Copy, BookOpen } from '@lucide/vue'
import { useData } from '../composables/useData'
import { searchDictionary } from '../lib/dictionary'
const route = useRoute(),
  router = useRouter()
function practiceText(text: string) {
  router.push({ name: 'practice', params: { category: 'article' }, query: { text } })
}
const { dictionary, saved, toggleFavorite, notify } = useData()
const query = ref(typeof route.query.q === 'string' ? route.query.q : ''),
  limit = ref(40)
watch(query, () => (limit.value = 40))
watch(query, (value) => router.replace({ name: 'lookup', query: value ? { q: value } : {} }))
watch(
  () => route.query.q,
  (value) => {
    query.value = typeof value === 'string' ? value : ''
  },
)
const results = computed(() => searchDictionary(dictionary.value, query.value))
const missing = computed(() =>
  [...new Set([...query.value.trim()])].filter(
    (char) => /\p{Script=Han}/u.test(char) && !results.value.some((entry) => entry.char === char),
  ),
)
async function copy(char: string, codes: string[]) {
  try {
    await navigator.clipboard.writeText(`${char} ${codes.join(' / ').toUpperCase()}`)
    notify('已複製字碼')
  } catch {
    notify('無法存取剪貼簿，請選取字碼後手動複製。')
  }
}
</script>

<template>
  <section class="lookup-view">
    <div class="page-intro">
      <div>
        <span class="quiet-label">嘸蝦米查碼</span>
        <h1>卡住的字，來這裡找。</h1>
        <p>輸入中文字查字碼，或輸入英文字碼反查文字。</p>
      </div>
      <span class="count-label">{{ dictionary.length.toLocaleString() }} 個字元</span>
    </div>
    <div class="search-box">
      <Search :size="23" /><input
        v-model="query"
        aria-label="查詢中文字或字碼"
        type="search"
        placeholder="試試「學習」，或字碼 snz"
        autocomplete="off"
        autocapitalize="off"
        :spellcheck="false"
        maxlength="100"
      /><kbd>/</kbd>
    </div>
    <div class="search-suggestions">
      <span>試著查</span
      ><button v-for="item in ['嘸蝦米', '學習', '你好', 'snz']" :key="item" @click="query = item">
        {{ item }}
      </button>
    </div>
    <template v-if="query.trim()">
      <div class="section-heading">
        <h2>
          查詢結果 <span>{{ results.length }}</span>
        </h2>
        <button
          v-if="results.length && !/^[a-z]+$/i.test(query) && !missing.length"
          class="text-button"
          @click="practiceText(query)"
        >
          <BookOpen :size="17" /> 練習這些字
        </button>
      </div>
      <p v-if="missing.length" class="inline-warning">
        字庫未收錄：{{ missing.join('、') }}。可匯入個人碼表，或前往官方查碼。
      </p>
      <div v-if="results.length" class="dictionary-results">
        <article v-for="entry in results.slice(0, limit)" :key="entry.char" class="dictionary-row">
          <span class="result-character">{{ entry.char }}</span>
          <div class="result-codes">
            <span v-if="!entry.recommendedCodes?.length" class="unverified-code"
              >建議碼待核對，以下為收錄字碼。</span
            >
            <span v-for="(code, i) in entry.codes" :key="code" class="code-group"
              ><kbd v-for="(key, ki) in code" :key="ki">{{ key.toUpperCase() }}</kbd
              ><small v-if="entry.recommendedCodes?.includes(code)">{{
                entry.recommendedSource === 'imported' ? '指定碼' : '建議碼'
              }}</small
              ><small v-else-if="i === 0 || entry.recommendedCodes?.length">{{
                entry.recommendedCodes?.length ? '其他碼' : '字碼'
              }}</small></span
            >
          </div>
          <div class="result-actions">
            <button
              class="icon-button"
              :aria-label="`複製 ${entry.char} 的字碼`"
              @click="copy(entry.char, entry.codes)"
            >
              <Copy :size="17" /></button
            ><button
              class="icon-button"
              :class="{ bookmarked: saved.favorites.includes(entry.char) }"
              :aria-label="`${saved.favorites.includes(entry.char) ? '取消收藏' : '收藏'} ${entry.char}`"
              :aria-pressed="saved.favorites.includes(entry.char)"
              @click="toggleFavorite(entry.char)"
            >
              <Bookmark :size="19" />
            </button>
          </div>
        </article>
      </div>
      <div v-else class="empty-state">
        <Search :size="36" />
        <h2>這次沒有找到相符的字碼</h2>
        <p>請縮短字碼，或輸入單一中文字。較新的字形可改用官方查碼。</p>
        <a
          href="https://boshiamy.com/liuquery.php"
          target="_blank"
          rel="noreferrer"
          class="text-button"
          >開啟官方查碼 <ArrowUpRight :size="17"
        /></a>
      </div>
      <button v-if="results.length > limit" class="secondary-button load-more" @click="limit += 40">
        再顯示 40 筆
      </button>
    </template>
    <div v-else class="lookup-welcome">
      <div class="lookup-sample">
        <span>學</span>
        <div><kbd>S</kbd><kbd>N</kbd><kbd>Z</kbd></div>
      </div>
      <div>
        <h2>認識一個字，從它的字根開始。</h2>
        <p>也可以一次貼上一句話，逐字查看收錄的拆碼。把還不熟的字收進字本，下次再練。</p>
        <p class="fine-print">
          內建查碼為 liu57a_ersu 舊版資料；練習使用另行核對的建議碼，未核對的字會明確標示。
        </p>
      </div>
    </div>
    <footer class="data-footnote">
      內建字碼表限非商業使用。<a
        href="https://github.com/chinese-opendesktop/cin-tables/blob/master/boshiamy.cin"
        target="_blank"
        rel="noreferrer"
        >資料來源</a
      ><a href="https://boshiamy.com/liuquery.php" target="_blank" rel="noreferrer"
        >官方查碼 <ArrowUpRight :size="12"
      /></a>
    </footer>
  </section>
</template>
