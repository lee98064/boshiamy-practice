<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowRight, ArrowUpRight } from '@lucide/vue'
import { roots, rootCategories } from '../data/roots'
import type { RootCategory } from '../types'
import RootGlyph from '../components/RootGlyph.vue'
const filter = ref<RootCategory | 'all'>('all')
const letters = [...'abcdefghijklmnopqrstuvwxyz']
const visible = computed(() =>
  roots.filter((root) => filter.value === 'all' || root.category === filter.value),
)
</script>

<template>
  <section class="roots-view">
    <div class="page-intro">
      <div>
        <span class="quiet-label">A–Z 字根索引</span>
        <h1>同一個鍵，有好多種樣子。</h1>
        <p>{{ roots.length }} 筆字根與變形，依形、音、義整理。點選鍵位分類，就能開始練習。</p>
      </div>
      <RouterLink :to="{ name: 'practice', params: { category: 'shape' } }" class="secondary-button"
        >回到練習 <ArrowRight :size="16"
      /></RouterLink>
    </div>
    <div class="notebook-tabs" role="group" aria-label="字根表分類">
      <button :class="{ active: filter === 'all' }" @click="filter = 'all'">
        全部 <span>{{ roots.length }}</span>
      </button>
      <button
        v-for="category in rootCategories"
        :key="category.id"
        :class="{ active: filter === category.id }"
        @click="filter = category.id"
      >
        {{ category.name }}
        <span>{{ roots.filter((root) => root.category === category.id).length }}</span>
      </button>
    </div>
    <p class="root-library-note">
      每一筆是一次「字根 →
      英文字母」練習。同形若出現在不同分類或鍵位會分開列出；右欄數字與特殊記憶字根列於「義」。完整中文字的取碼，請使用「單字」練習。
    </p>
    <div class="root-library">
      <section
        v-for="letter in letters"
        :key="letter"
        class="root-key-row"
        :aria-label="`${letter.toUpperCase()} 鍵字根`"
      >
        <h2>{{ letter.toUpperCase() }}</h2>
        <div class="root-key-groups">
          <template v-for="category in rootCategories" :key="category.id">
            <div
              v-if="visible.some((root) => root.code === letter && root.category === category.id)"
              class="root-group"
            >
              <RouterLink
                :to="{
                  name: 'practice',
                  params: { category: category.id },
                  query: { key: letter },
                }"
                class="root-group-link"
                >{{ category.name }}<ArrowRight :size="13"
              /></RouterLink>
              <div class="root-tiles">
                <span
                  v-for="root in visible.filter(
                    (root) => root.code === letter && root.category === category.id,
                  )"
                  :key="root.id"
                  class="root-tile"
                  :title="root.glyph"
                  :data-root-id="root.id"
                  ><RootGlyph :glyph="root.glyph" :crop="root.rootCrop"
                /></span>
              </div>
            </div>
          </template>
          <p v-if="!visible.some((root) => root.code === letter)" class="root-no-match">
            此分類沒有這個鍵位的字根。
          </p>
        </div>
      </section>
    </div>
    <footer class="data-footnote">
      依收錄的字根總表整理；變形字根使用原圖局部呈現，並非所有擴充字根的完整清單。<a
        href="https://boshiamy.com/tutorial_beginner.php?page=3"
        target="_blank"
        rel="noreferrer"
        >官方字根總表 <ArrowUpRight :size="12"
      /></a>
    </footer>
  </section>
</template>
