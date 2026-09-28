<script setup lang="ts">
import { inject, ref } from 'vue'
import { Upload, Download, ArrowUpRight, CheckCircle2, Smartphone } from '@lucide/vue'
import { useData } from '../composables/useData'
import { parseDictionary } from '../lib/dictionary'
const openInstall = inject<() => void>('openInstall', () => {})
const dataNoticesUrl = `${import.meta.env.BASE_URL}data-notices.txt`
const { saved, imported, dictionary, importDictionary, notify } = useData()
const importMessage = ref(''),
  importing = ref(false),
  importError = ref(false),
  fileInput = ref<HTMLInputElement>()
async function onImport(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  importing.value = true
  importMessage.value = ''
  importError.value = false
  try {
    if (file.size > 5_000_000) throw new Error('檔案超過 5 MB，請使用較小的字碼表。')
    const entries = parseDictionary(await file.text())
    await importDictionary(entries)
    importMessage.value = `已匯入 ${entries.length.toLocaleString()} 個字元。碼表只儲存在這個裝置。`
  } catch (error) {
    importError.value = true
    importMessage.value =
      error instanceof Error ? error.message : '匯入失敗，請確認瀏覽器允許儲存資料。'
  } finally {
    importing.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}
async function removeImported() {
  try {
    await importDictionary([])
    importMessage.value = '已移除匯入碼表，保留內建資料。'
    importError.value = false
  } catch {
    importMessage.value = '無法移除碼表，請稍後再試。'
    importError.value = true
  }
}
function exportProgress() {
  const blob = new Blob([JSON.stringify(saved, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob),
    anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'boshiamy-progress.json'
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  notify('已匯出練習紀錄（不含匯入碼表）')
}
</script>

<template>
  <section>
    <div class="page-intro">
      <div>
        <span class="quiet-label">偏好設定</span>
        <h1>照你的節奏練習。</h1>
        <p>調整練習方式，讓每次打開都剛剛好。</p>
      </div>
    </div>
    <div class="settings-panel">
      <h2>練習偏好</h2>
      <div class="setting-row">
        <div>
          <label for="input-mode">預設輸入方式</label>
          <p>中文字模式需要你自行安裝輸入法。</p>
        </div>
        <select id="input-mode" v-model="saved.preferences.inputMode">
          <option value="code">輸入英文字根</option>
          <option value="text">輸入中文字</option>
        </select>
      </div>
      <div class="setting-row">
        <div>
          <label for="daily-goal">每日練習目標</label>
          <p>以完成的題目計算，跳過也會記錄。</p>
        </div>
        <select id="daily-goal" v-model="saved.preferences.dailyGoal">
          <option v-for="n in [10, 20, 30, 50]" :key="n" :value="n">{{ n }} 題</option>
        </select>
      </div>
      <div class="setting-row">
        <div>
          <label for="session-length">字根每回合題數</label>
          <p>不足題數時會重新輪替；文章會練完整篇。</p>
        </div>
        <select id="session-length" v-model="saved.preferences.sessionLength">
          <option v-for="n in [5, 10, 20]" :key="n" :value="n">{{ n }} 題</option>
        </select>
      </div>
      <div class="setting-row">
        <div>
          <label for="show-keyboard">顯示螢幕鍵盤</label>
          <p>直接點選英文字母，手機不必切換輸入法。</p>
        </div>
        <input
          id="show-keyboard"
          v-model="saved.preferences.showKeyboard"
          class="switch"
          type="checkbox"
          role="switch"
        />
      </div>
    </div>
    <div class="settings-panel">
      <h2>本機字碼表</h2>
      <p>
        目前可查 {{ dictionary.length.toLocaleString() }} 個字元。可匯入自己有權使用的 UTF-8 CIN 或
        JSON 碼表；檔案不會上傳。再次匯入會取代前一次的個人碼表。
      </p>
      <div class="setting-buttons">
        <button class="secondary-button" :disabled="importing" @click="fileInput?.click()">
          <Upload :size="17" /> {{ importing ? '正在匯入…' : '匯入字碼表' }}</button
        ><button v-if="imported.length" class="text-button" @click="removeImported">
          移除個人碼表（{{ imported.length }} 字）</button
        ><input
          ref="fileInput"
          class="sr-only"
          type="file"
          accept=".cin,.json,.txt"
          aria-label="選擇字碼表檔案"
          @change="onImport"
        />
      </div>
      <p
        v-if="importMessage"
        role="status"
        :class="importError ? 'inline-warning' : 'success-note'"
      >
        {{ importMessage }}
      </p>
      <details>
        <summary>查看匯入格式</summary>
        <p>JSON 範例：</p>
        <pre>[{ "char": "你", "codes": ["pns"] }]</pre>
        <p>
          CIN 檔需包含 %chardef begin / end 區段，一行一組「字碼 文字」。僅支援
          UTF-8、單一字元，不匯入自訂詞語。
        </p>
      </details>
    </div>
    <div class="settings-panel">
      <h2>隨身練習</h2>
      <div class="setting-row">
        <div>
          <strong>加入主畫面</strong>
          <p>從 App 圖示開啟，享受沒有網址列的練習空間。</p>
        </div>
        <button class="secondary-button" @click="openInstall()">
          <Smartphone :size="17" /> 安裝說明
        </button>
      </div>
      <div class="setting-row">
        <div>
          <strong>匯出練習紀錄</strong>
          <p>下載收藏、錯題與練習結果作為備份資料。</p>
        </div>
        <button class="secondary-button" @click="exportProgress">
          <Download :size="17" /> 匯出 JSON
        </button>
      </div>
    </div>
    <div class="about-note">
      <CheckCircle2 :size="20" />
      <div>
        <h3>你的練習，留在你的裝置。</h3>
        <p>沒有帳號、沒有追蹤。清除瀏覽器網站資料會刪除紀錄與個人碼表。</p>
        <p>
          本網站為非官方、非商業練習工具。嘸蝦米為行易有限公司之商標。內建字碼來自公開的 liu57a_ersu
          碼表，標示「Free for non-commercial use」；資料較舊，請以官方現行查碼為準。
        </p>
        <a
          href="https://github.com/chinese-opendesktop/cin-tables/blob/master/boshiamy.cin"
          target="_blank"
          rel="noreferrer"
          >查看資料來源與授權 <ArrowUpRight :size="14"
        /></a>
        <p>
          <a :href="dataNoticesUrl" target="_blank" rel="noreferrer">檢視隨站保留的原始授權聲明</a>
        </p>
      </div>
    </div>
  </section>
</template>
