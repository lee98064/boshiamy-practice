<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { BookOpen, Shuffle } from '@lucide/vue'
import { sessionLengths } from '../lib/practice-deck'
const props = defineProps<{
  isRoot: boolean
  rootKey: string
  poolSize: number
  sessionLength: number
  singleScope: 'all' | 'recommended'
}>()
defineEmits<{
  'update:rootKey': [value: string]
  'update:sessionLength': [value: number]
  'update:singleScope': [value: 'all' | 'recommended']
  shuffle: []
}>()
const letters = [...'abcdefghijklmnopqrstuvwxyz']
</script>

<template>
  <div class="practice-setup">
    <div class="pool-description">
      <div>
        <strong>{{ poolSize.toLocaleString() }}</strong
        ><span>{{ isRoot ? '筆字根與變形' : '個可練習中文字' }}</span>
      </div>
      <p>每回合抽 {{ Math.min(sessionLength, poolSize) }} 題，同回合不重複。</p>
      <RouterLink v-if="isRoot" :to="{ name: 'roots' }" class="text-button"
        ><BookOpen :size="15" />查看字根表</RouterLink
      >
    </div>
    <div class="pool-controls">
      <label v-if="isRoot"
        >鍵位範圍<select
          aria-label="字根鍵位"
          :value="rootKey"
          @change="$emit('update:rootKey', ($event.target as HTMLSelectElement).value)"
        >
          <option value="">全部 A–Z</option>
          <option v-for="letter in letters" :key="letter" :value="letter">
            {{ letter.toUpperCase() }}
          </option>
        </select></label
      >
      <label v-else
        >抽題範圍<select
          aria-label="單字抽題範圍"
          :value="singleScope"
          @change="
            $emit(
              'update:singleScope',
              ($event.target as HTMLSelectElement).value as typeof props.singleScope,
            )
          "
        >
          <option value="all">全部字碼表</option>
          <option value="recommended">已有建議／指定碼</option>
        </select></label
      >
      <label
        >每回合<select
          aria-label="每回合題數"
          :value="sessionLength"
          @change="
            $emit('update:sessionLength', Number(($event.target as HTMLSelectElement).value))
          "
        >
          <option v-for="n in sessionLengths" :key="n" :value="n">{{ n }} 題</option>
        </select></label
      >
      <button class="secondary-button" @click="$emit('shuffle')">
        <Shuffle :size="16" />換一組
      </button>
    </div>
    <p v-if="!isRoot" class="pool-footnote">
      已核對的字使用建議碼；其餘保留一般碼表練習。也可切換成只抽已有建議／指定碼的字。
    </p>
  </div>
</template>
