<script setup lang="ts">
import type { RootCrop } from '../types'
defineProps<{ glyph: string; crop?: RootCrop }>()
const chartUrl = `${import.meta.env.BASE_URL}reference/root-chart.png`
</script>

<template>
  <svg
    v-if="crop"
    class="root-glyph-image"
    :viewBox="crop.join(' ')"
    role="img"
    :aria-label="glyph"
  >
    <image :href="chartUrl" width="1953" height="2685" />
  </svg>
  <template v-else>{{ glyph }}</template>
</template>
