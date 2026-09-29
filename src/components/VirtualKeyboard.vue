<script setup lang="ts">
import { CornerDownLeft, Delete } from '@lucide/vue'
defineProps<{
  value: string
  disabled?: boolean
  canSubmit: boolean
  submitLabel: string
  specialKeys?: string[]
}>()
defineEmits<{ key: [key: string]; submit: []; backspace: [] }>()
const rows = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm']
</script>

<template>
  <div class="virtual-keyboard" aria-label="英文字根螢幕鍵盤">
    <div v-for="(row, i) in rows" :key="row" class="keyboard-row">
      <button
        v-for="key in row"
        :key="key"
        type="button"
        :aria-label="`輸入 ${key.toUpperCase()}`"
        :class="{ pressed: value.toLowerCase().endsWith(key) }"
        :disabled="disabled"
        @click="$emit('key', key)"
      >
        {{ key.toUpperCase() }}
      </button>
      <button
        v-if="i === 2"
        class="key-wide"
        type="button"
        aria-label="刪除一碼"
        :disabled="disabled"
        @click="$emit('backspace')"
      >
        <Delete :size="19" />
      </button>
    </div>
    <div v-if="specialKeys?.length" class="keyboard-row special-keys">
      <button
        v-for="key in specialKeys"
        :key="key"
        type="button"
        :aria-label="`輸入 ${key}`"
        :disabled="disabled"
        @click="$emit('key', key)"
      >
        {{ key }}
      </button>
    </div>
    <div class="keyboard-row keyboard-actions">
      <button type="button" class="key-space" :disabled="!canSubmit" @click="$emit('submit')">
        {{ submitLabel }} <CornerDownLeft :size="15" />
      </button>
    </div>
  </div>
</template>
