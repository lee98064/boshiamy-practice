<script setup lang="ts">
import { computed, inject } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ArrowUpRight, Bookmark, Download, Keyboard, Search, Settings2, Sprout } from '@lucide/vue'
import { useData } from '../../composables/useData'
const route = useRoute()
const { saved, today } = useData()
const openInstall = inject<() => void>('openInstall', () => {})
const dailyProgress = computed(() =>
  Math.min(100, (today.value.length / saved.preferences.dailyGoal) * 100),
)
const links = [
  { name: 'practice', label: '開始練習', short: '練習', icon: Keyboard },
  { name: 'lookup', label: '字碼查詢', short: '查碼', icon: Search },
  { name: 'notebook', label: '我的字本', short: '字本', icon: Bookmark },
  { name: 'settings', label: '偏好設定', short: '設定', icon: Settings2 },
]
</script>

<template>
  <aside class="sidebar">
    <RouterLink :to="{ name: 'practice' }" class="brand"
      ><span class="brand-mark" aria-hidden="true">米</span
      ><span><strong>蝦米練習室</strong><small>一字一字，練成日常。</small></span></RouterLink
    >
    <nav class="main-nav" aria-label="主要導覽">
      <RouterLink
        v-for="item in links"
        :key="item.name"
        :to="{ name: item.name }"
        :class="{ active: route.name === item.name }"
        :aria-current="route.name === item.name ? 'page' : undefined"
        ><component :is="item.icon" :size="20" /><span>{{ item.label }}</span
        ><span v-if="item.name === 'practice' && route.name === 'practice'" class="nav-dot"></span
        ><kbd v-if="item.name === 'lookup'">/</kbd
        ><span v-if="item.name === 'notebook' && saved.mistakes.length" class="nav-count">{{
          saved.mistakes.length
        }}</span></RouterLink
      >
    </nav>
    <div class="sidebar-bottom">
      <div class="daily-goal">
        <div><Sprout :size="20" /><span>每天一點，就會不一樣。</span></div>
        <p>
          今日練習
          <strong
            >{{ today.length }} <span>/ {{ saved.preferences.dailyGoal }} 題</span></strong
          >
        </p>
        <div
          class="progress-track"
          role="progressbar"
          :aria-valuenow="Math.min(today.length, saved.preferences.dailyGoal)"
          :aria-valuemax="saved.preferences.dailyGoal"
          :aria-valuemin="0"
          aria-label="今日練習目標"
        >
          <i :style="{ width: `${dailyProgress}%` }"></i>
        </div>
      </div>
      <button class="install-sidebar" @click="openInstall">
        <Download :size="18" /><span>安裝到主畫面</span><ArrowUpRight :size="16" /></button
      ><span class="sidebar-footer">給每一雙正在練習的手。</span>
    </div>
  </aside>
  <nav class="mobile-nav" aria-label="手機主要導覽">
    <RouterLink
      v-for="item in links"
      :key="item.name"
      :to="{ name: item.name }"
      :class="{ active: route.name === item.name }"
      :aria-current="route.name === item.name ? 'page' : undefined"
      ><component :is="item.icon" :size="21" /><span>{{ item.short }}</span></RouterLink
    >
  </nav>
</template>
