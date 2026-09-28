import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRegisterSW } from 'virtual:pwa-register/vue'
import { useData } from './useData'

export function usePwa() {
  const { notify } = useData()
  const online = ref(navigator.onLine)
  const { needRefresh, offlineReady, updateServiceWorker } = useRegisterSW({
    onRegisterError: () => notify('離線功能尚未啟用，請連上網路後重新整理。'),
  })
  function updateOnline() {
    online.value = navigator.onLine
  }
  watch(offlineReady, (value) => {
    if (value) notify('離線練習已準備好，下次沒有網路也能打開。')
  })
  onMounted(() => {
    window.addEventListener('online', updateOnline)
    window.addEventListener('offline', updateOnline)
  })
  onUnmounted(() => {
    window.removeEventListener('online', updateOnline)
    window.removeEventListener('offline', updateOnline)
  })
  return { online, needRefresh, updateServiceWorker }
}
