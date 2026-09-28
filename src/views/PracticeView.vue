<script setup lang="ts">
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  CornerDownLeft,
  Keyboard,
  Lightbulb,
  RotateCcw,
  Search,
  SkipForward,
  Sparkles,
  Target,
} from '@lucide/vue'
import { articles, categories, wordSets } from '../data/lessons'
import VirtualKeyboard from '../components/VirtualKeyboard.vue'
import CodeAnswerSlots from '../components/CodeAnswerSlots.vue'
import { usePracticePage } from '../composables/usePracticePage'
const {
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
} = usePracticePage()
</script>

<template>
  <section class="practice-view">
    <div class="page-intro">
      <div>
        <span class="quiet-label">你的嘸蝦米練習時間</span>
        <h1>把字形，練成手感。</h1>
        <p>從一個字根開始，不用快，慢慢就會了。</p>
      </div>
      <button class="today-summary" @click="navigate('notebook')">
        <span class="today-icon"><Target :size="22" /></span
        ><span
          ><small>今天已練習</small><strong>{{ today.length }}<em> 題</em></strong></span
        ><ChevronRight :size="17" />
      </button>
    </div>
    <div class="category-tabs" role="group" aria-label="練習分類">
      <button
        v-for="item in categories"
        :key="item.id"
        :class="{ active: category === item.id && !isReview }"
        :aria-pressed="category === item.id && !isReview"
        @click="selectCategory(item.id)"
      >
        <span>{{ item.name }}</span
        ><small>{{
          item.id === 'shape'
            ? '看字形'
            : item.id === 'sound'
              ? '讀發音'
              : item.id === 'meaning'
                ? '懂意思'
                : item.id === 'words'
                  ? '練日常'
                  : item.id === 'idioms'
                    ? '記四字'
                    : '找節奏'
        }}</small>
      </button>
    </div>
    <div v-if="!isRootCategory && !isReview" class="lesson-picker">
      <label :for="category === 'article' ? 'article-select' : 'word-select'"
        >選擇{{ category === 'article' ? '文章' : category === 'idioms' ? '成語' : '詞語' }}</label
      ><select
        v-if="category === 'article'"
        id="article-select"
        v-model="selectedArticle"
        @change="makeLesson"
      >
        <option v-for="article in articles" :key="article.id" :value="article.id">
          {{ article.title }}
        </option>
        <option value="custom">自己的文章</option></select
      ><select v-else id="word-select" v-model="selectedWord" @change="makeLesson">
        <option v-for="word in wordSets[category as 'words' | 'idioms']" :key="word" :value="word">
          {{ word }}
        </option></select
      ><span>逐字輸入，自動略過標點。</span>
    </div>
    <div
      v-if="category === 'article' && selectedArticle === 'custom' && !isReview"
      class="custom-article"
    >
      <textarea
        v-model="customText"
        aria-label="自訂文章"
        placeholder="貼上想練習的文章（最多 2,000 字）"
        maxlength="2000"
      ></textarea
      ><button class="secondary-button" @click="makeLesson">使用這篇文章</button>
    </div>
    <div v-if="missing.length" class="inline-warning">
      字庫未收錄「{{ missing.join('、') }}」。請到偏好設定匯入碼表，或調整文章後重試。
    </div>
    <div class="practice-layout">
      <div class="practice-main">
        <div class="exercise-card">
          <div class="exercise-toolbar">
            <span
              ><i class="lesson-dot"></i>{{ isReview ? '字本複習' : activeCategory.label }}</span
            >
            <div class="exercise-tools">
              <button
                class="icon-button"
                aria-label="重新開始本回合"
                @click="isReview ? practice.start(queue.slice(), 'words') : makeLesson()"
              >
                <RotateCcw :size="16" /></button
              ><span
                >{{ complete ? queue.length : Math.min(index + 1, queue.length)
                }}<small> / {{ queue.length }}</small></span
              >
            </div>
          </div>
          <div
            class="session-progress"
            role="progressbar"
            aria-label="本回合進度"
            :aria-valuenow="answered"
            :aria-valuemin="0"
            :aria-valuemax="queue.length || 1"
          >
            <i :style="{ width: `${progress}%` }"></i>
          </div>
          <div v-if="complete" class="completion-screen">
            <span class="completion-symbol"><Check :size="42" /></span
            ><span class="quiet-label">這一回合，完成了。</span>
            <h2>手感，又多了一點。</h2>
            <p>共練習 {{ queue.length }} 題，{{ firstTryCorrect }} 題首次答對，用時 {{ time }}。</p>
            <div class="completion-stats">
              <strong>{{ accuracy }}<span>% 首次正確率</span></strong>
            </div>
            <div class="completion-actions">
              <button
                class="primary-button"
                @click="isReview ? practice.start(queue.slice(), 'words') : makeLesson()"
              >
                <RotateCcw :size="17" /> 再練一回合</button
              ><button class="secondary-button" @click="navigate('notebook')">查看我的字本</button>
            </div>
          </div>
          <div v-else-if="current" class="exercise-body">
            <div v-if="current.context" class="article-text" aria-label="本題文章">
              <span
                v-for="(char, i) in [...current.context]"
                :key="i"
                :class="{
                  'current-char': i === current.position,
                  'finished-char': i < (current.position ?? 0),
                }"
                >{{ char }}</span
              >
            </div>
            <div class="exercise-instruction">
              <span class="pill">{{ current.isRoot ? '字根聯想' : '完整字碼' }}</span
              ><span>{{
                saved.preferences.inputMode === 'text'
                  ? '使用你的嘸蝦米輸入法，輸入這個字。'
                  : current.isRoot
                    ? category === 'sound'
                      ? '念一念，它的發音讓你想到什麼？'
                      : category === 'meaning'
                        ? '想想意思，會聯想到哪個字母？'
                        : '看一看，它像哪個字母？'
                    : '試著拆出這個字。'
              }}</span>
            </div>
            <div class="character-stage">
              <div class="character-grid">
                <div class="grid-diagonal" aria-hidden="true"></div>
                <span class="practice-character" data-testid="practice-character">{{
                  current.glyph
                }}</span>
              </div>
              <span class="character-caption">{{
                current.isRoot ? '認識字根，先從輪廓開始。' : '一個字，一個字，慢慢來。'
              }}</span>
            </div>
            <div class="answer-area">
              <div class="input-mode-control" role="group" aria-label="輸入方式">
                <button
                  :class="{ active: answerMode === 'onscreen' }"
                  :aria-pressed="answerMode === 'onscreen'"
                  @click="setAnswerMode('onscreen')"
                >
                  網頁鍵盤</button
                ><button
                  :class="{ active: answerMode === 'keyboard' }"
                  :aria-pressed="answerMode === 'keyboard'"
                  @click="setAnswerMode('keyboard')"
                >
                  鍵盤輸入</button
                ><button
                  :class="{ active: answerMode === 'text' }"
                  :aria-pressed="answerMode === 'text'"
                  @click="setAnswerMode('text')"
                >
                  中文字
                </button>
              </div>
              <CodeAnswerSlots
                v-if="answerMode === 'onscreen'"
                :value="input"
                :length="answerLength"
                :invalid="status === 'wrong'"
                :disabled="hasAnswered"
              />
              <template v-else>
                <label class="sr-only" for="practice-answer">{{
                  saved.preferences.inputMode === 'code' ? '輸入字根答案' : '輸入中文字答案'
                }}</label>
                <div class="answer-input-row" :class="{ 'is-wrong': status === 'wrong' }">
                  <input
                    id="practice-answer"
                    ref="practice-answer"
                    :value="input"
                    :placeholder="
                      saved.preferences.inputMode === 'code' ? '輸入字根' : '輸入中文字'
                    "
                    :readonly="hasAnswered"
                    :maxlength="saved.preferences.inputMode === 'code' ? 8 : 4"
                    inputmode="text"
                    autocomplete="off"
                    autocapitalize="off"
                    autocorrect="off"
                    :spellcheck="false"
                    :aria-invalid="status === 'wrong'"
                    aria-describedby="answer-feedback"
                    @input="onInput"
                    @keydown="onKeydown"
                    @compositionstart="composing = true"
                    @compositionend="onCompositionEnd"
                  /><button
                    class="primary-button answer-button"
                    :disabled="!hasAnswered && !input.trim()"
                    @click="submit"
                  >
                    {{ submitLabel }}<ArrowRight v-if="hasAnswered" :size="19" /><CornerDownLeft
                      v-else
                      :size="18"
                    />
                  </button>
                </div>
              </template>
              <div id="answer-feedback" class="answer-feedback" :class="status" role="status">
                <template v-if="status === 'wrong'"
                  >再試一次。{{
                    saved.preferences.inputMode === 'code'
                      ? '還沒想起來的話，可以看看提示。'
                      : '送出的文字與題目不同。'
                  }}</template
                ><template v-else-if="status === 'skipped'"
                  >已加入待複習。答案是 {{ current.codes[0]?.toUpperCase() }}。</template
                ><template v-else
                  ><span v-if="answerMode === 'onscreen'"
                    >點選下方鍵盤，一格一碼，答對自動換題。</span
                  ><span v-else-if="saved.preferences.inputMode === 'code'"
                    >切換英文輸入，答對後自動進入下一題。</span
                  ><span v-else>完成選字後自動對答，答對後自動下一題。</span></template
                >
              </div>
            </div>
            <div v-if="hintShown || status === 'skipped'" class="hint-note">
              <Lightbulb :size="18" />
              <p>{{ hasAnswered ? current.explanation : current.hint }}</p>
            </div>
            <div class="exercise-actions">
              <button
                class="text-button"
                :aria-expanded="hintShown"
                @click="hintShown = !hintShown"
              >
                <Lightbulb :size="17" /> {{ hintShown ? '收起提示' : '給我一點提示' }}</button
              ><button v-if="!hasAnswered" class="text-button muted" @click="practice.skip()">
                先跳過 <SkipForward :size="16" /></button
              ><button v-else class="text-button muted" @click="openLookup(current.glyph)">
                查這個字 <Search :size="16" />
              </button>
            </div>
            <div v-if="answerMode === 'onscreen'" class="keyboard-wrap">
              <VirtualKeyboard
                :value="input"
                :disabled="hasAnswered"
                :can-submit="hasAnswered || !!input.trim()"
                :submit-label="submitLabel"
                @key="virtualKey"
                @backspace="backspace"
                @submit="submit"
              />
            </div>
          </div>
          <div v-else class="empty-state">
            <BookOpen :size="36" />
            <h2>準備一段想練習的文字。</h2>
            <p>選擇一篇文章，或貼上自己的文字後開始。</p>
          </div>
        </div>
        <div class="under-exercise">
          <span><Keyboard :size="16" /> {{ sessionLabel }}，照自己的速度就好。</span>
        </div>
      </div>
      <aside class="learning-aside">
        <section class="lesson-note">
          <div class="note-heading"><BookOpen :size="18" /><span>字根小筆記</span></div>
          <h2>
            {{
              isReview
                ? '再看一眼，再記一次。'
                : category === 'shape'
                  ? '像，就記住了。'
                  : category === 'sound'
                    ? '先念一遍，再找字母。'
                    : category === 'meaning'
                      ? '用意思，把字根串起來。'
                      : '先拆對，再打快。'
            }}
          </h2>
          <p>
            {{
              isReview
                ? '複習會保留原本的字根或單字題型。熟悉後，可以在字本裡移除。'
                : activeCategory.description
            }}
          </p>
          <div class="root-connection">
            <span>{{
              category === 'sound'
                ? '米'
                : category === 'meaning'
                  ? '木'
                  : category === 'shape'
                    ? '口'
                    : '明'
            }}</span
            ><span class="connection-line"></span
            ><kbd>{{
              category === 'sound'
                ? 'M'
                : category === 'meaning'
                  ? 'T'
                  : category === 'shape'
                    ? 'O'
                    : 'DU'
            }}</kbd>
          </div>
          <p class="root-note">
            {{
              category === 'shape'
                ? '「口」的輪廓像 O，這就是形的聯想。'
                : category === 'sound'
                  ? '「米」的發音從 ㄇ 開始，字根就是 M。'
                  : category === 'meaning'
                    ? '木 → tree → T，讓英文成為記憶的線索。'
                    : '「明」由日（D）與月（U）組合，取碼為 DU。'
            }}
          </p>
          <div class="note-divider"></div>
          <p class="learning-tip">
            <Sparkles :size="16" />
            {{
              current?.isRoot
                ? '字根不等於完整字碼。例如「口」字根是 O，完整字碼是 OO。'
                : '完整碼與已收錄的簡碼都能作答。先練正確，速度自然會跟上。'
            }}
          </p>
          <a
            href="https://boshiamy.com/tutorial_beginner.php?page=2"
            target="_blank"
            rel="noreferrer"
            class="text-button"
            >看看官方字根教學 <ArrowUpRight :size="15"
          /></a>
        </section>
        <section class="session-summary">
          <h2>這一回合</h2>
          <div>
            <span>已完成</span
            ><strong
              >{{ answered }}<small> / {{ queue.length }} 題</small></strong
            >
          </div>
          <div>
            <span>首次正確率</span><strong>{{ accuracy === null ? '—' : `${accuracy}%` }}</strong>
          </div>
          <div>
            <span>練習用時</span><strong>{{ time }}</strong>
          </div>
          <p>停留在其他頁面時，用時會暫停。</p>
        </section>
        <button class="lookup-shortcut" @click="openLookup()">
          <span class="shortcut-icon"><Search :size="19" /></span
          ><span><strong>遇到不會的字？</strong><small>查一下，再繼續。</small></span
          ><ChevronRight :size="17" />
        </button>
      </aside>
    </div>
    <div class="practice-footer">
      <span>不用一次記住所有字根。今天，比昨天熟悉一點就好。</span
      ><span v-if="todayAccuracy !== null">今日首次正確率 {{ todayAccuracy }}%</span>
    </div>
  </section>
</template>
