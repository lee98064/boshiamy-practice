<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { X, Share, PlusSquare, Download, CheckCircle2 } from '@lucide/vue'
interface InstallPrompt extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: string }>
}
const dialog = ref<HTMLDialogElement>(),
  prompt = ref<InstallPrompt | null>(null),
  installed = ref(false)
function onPrompt(event: Event) {
  event.preventDefault()
  prompt.value = event as InstallPrompt
}
function onInstalled() {
  installed.value = true
  prompt.value = null
}
onMounted(() => {
  installed.value =
    matchMedia('(display-mode: standalone)').matches ||
    !!(navigator as Navigator & { standalone?: boolean }).standalone
  window.addEventListener('beforeinstallprompt', onPrompt)
  window.addEventListener('appinstalled', onInstalled)
})
onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', onPrompt)
  window.removeEventListener('appinstalled', onInstalled)
})
async function install() {
  if (!prompt.value) return
  await prompt.value.prompt()
  if ((await prompt.value.userChoice).outcome === 'accepted') installed.value = true
  prompt.value = null
}
defineExpose({ open: () => dialog.value?.showModal() })
</script>

<template>
  <dialog
    ref="dialog"
    class="install-dialog"
    aria-labelledby="install-title"
    @click="$event.target === dialog && dialog?.close()"
  >
    <button class="icon-button close-dialog" aria-label="關閉安裝說明" @click="dialog?.close()">
      <X :size="21" />
    </button>
    <div class="install-logo">米</div>
    <h2 id="install-title">把練習室，放進口袋。</h2>
    <p>加入主畫面，隨時回來練習。首次完成載入後，沒有網路也能使用。</p>
    <div v-if="installed" class="success-note">
      <CheckCircle2 :size="20" /> 已在 App 模式使用，或已完成安裝。
    </div>
    <button v-else-if="prompt" class="primary-button" @click="install">
      <Download :size="18" /> 安裝蝦米練習室
    </button>
    <template v-else>
      <h3>iPhone / iPad</h3>
      <ol class="install-steps">
        <li><Share :size="20" /> 用 Safari 開啟網站，點選「分享」。</li>
        <li><PlusSquare :size="20" /> 選擇「加入主畫面」並確認新增。</li>
        <li>從主畫面的圖示開啟，就能隱藏網址列。</li>
      </ol>
      <h3>Android / 電腦</h3>
      <p>開啟瀏覽器選單，選擇「安裝應用程式」或「新增至主畫面」。選項會依瀏覽器而異。</p>
    </template>
    <p class="fine-print">
      一般 Safari 分頁仍會顯示網址列；請從主畫面圖示啟動。離線資料保留於目前瀏覽器。
    </p>
  </dialog>
</template>
