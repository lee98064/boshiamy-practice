<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, provide, ref } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { CheckCircle2, CircleHelp, WifiOff, X } from '@lucide/vue'
import AppNavigation from './components/layout/AppNavigation.vue'
import InstallDialog from './components/InstallDialog.vue'
import { useData } from './composables/useData'
import { usePwa } from './composables/usePwa'

const route = useRoute(),
  router = useRouter()
const { notice, storageWarning, loadDictionary, refreshDate } = useData()
const { online, needRefresh, updateServiceWorker } = usePwa()
const installDialog = ref<InstanceType<typeof InstallDialog>>()
provide('openInstall', () => installDialog.value?.open())
const context = computed(
  () =>
    ({
      practice: '練習，是記住最好的方式。',
      lookup: '每個字，都有線索。',
      notebook: '把還不熟悉的，留給下一次。',
      settings: '留一點時間，給自己。',
      roots: '一個鍵位，一組熟悉的輪廓。',
    })[String(route.name)] || '',
)
function focusMain() {
  document.getElementById('main-content')?.focus()
}
function shortcut(event: KeyboardEvent) {
  if (
    event.key !== '/' ||
    event.metaKey ||
    event.ctrlKey ||
    event.altKey ||
    /INPUT|TEXTAREA|SELECT/.test((event.target as HTMLElement)?.tagName) ||
    document.querySelector('dialog[open]')
  )
    return
  event.preventDefault()
  router
    .push({ name: 'lookup' })
    .then(() =>
      nextTick(() => document.querySelector<HTMLInputElement>('.search-box input')?.focus()),
    )
}
onMounted(() => {
  loadDictionary()
  window.addEventListener('keydown', shortcut)
  window.addEventListener('focus', refreshDate)
})
onUnmounted(() => {
  window.removeEventListener('keydown', shortcut)
  window.removeEventListener('focus', refreshDate)
})
</script>

<template>
  <a class="skip-link" href="#main-content" @click.prevent="focusMain">跳到主要內容</a>
  <div class="app-shell">
    <AppNavigation />
    <div class="main-shell">
      <header class="topbar">
        <div class="mobile-brand">
          <span class="brand-mark" aria-hidden="true">米</span><strong>蝦米練習室</strong>
        </div>
        <span class="desktop-context">{{ context }}</span>
        <div class="topbar-actions">
          <span class="connection-status"
            ><i :class="{ offline: !online }"></i
            >{{ online ? '在這裡，專心練習' : '正在離線練習' }}</span
          ><button class="icon-button" aria-label="安裝與使用說明" @click="installDialog?.open()">
            <CircleHelp :size="21" />
          </button>
        </div>
      </header>
      <main id="main-content" tabindex="-1">
        <div v-if="storageWarning" class="storage-warning" role="alert">{{ storageWarning }}</div>
        <div v-if="!online" class="offline-note">
          <WifiOff :size="16" /> 已快取的查碼與練習可繼續使用。
        </div>
        <RouterView v-slot="{ Component }"
          ><KeepAlive include="PracticeView"><component :is="Component" /></KeepAlive
        ></RouterView>
      </main>
    </div>
    <InstallDialog ref="installDialog" />
    <div v-if="notice" class="toast" role="status"><CheckCircle2 :size="18" />{{ notice }}</div>
    <div v-if="needRefresh" class="update-banner" role="status">
      <span>練習室有新版本，準備好再更新。</span
      ><button class="primary-button compact" @click="updateServiceWorker(true)">
        更新並重新載入</button
      ><button class="icon-button" aria-label="稍後更新" @click="needRefresh = false">
        <X :size="17" />
      </button>
    </div>
  </div>
</template>
