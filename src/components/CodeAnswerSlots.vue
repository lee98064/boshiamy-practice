<script setup lang="ts">
defineProps<{ value: string; length: number; invalid: boolean; disabled: boolean }>()
</script>

<template>
  <div
    class="code-answer-slots"
    :class="{ 'is-wrong': invalid }"
    :style="{ '--slot-count': length }"
    role="group"
    :aria-label="`字根答案，共 ${length} 碼`"
    aria-describedby="answer-feedback"
    data-testid="code-answer-slots"
  >
    <span
      v-for="position in length"
      :key="position"
      class="answer-slot"
      :class="{
        'is-filled': !!value[position - 1],
        'is-current': !disabled && position === value.length + 1,
      }"
      aria-hidden="true"
      >{{ value[position - 1]?.toUpperCase() }}</span
    >
    <span class="sr-only" role="status" aria-atomic="true">{{
      value ? `已輸入 ${value.toUpperCase().split('').join('、')}` : `尚未輸入，共 ${length} 碼`
    }}</span>
  </div>
</template>

<style scoped>
.code-answer-slots {
  display: grid;
  grid-template-columns: repeat(var(--slot-count), minmax(0, 48px));
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 54px;
  width: 100%;
}
.answer-slot {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 50px;
  border: 1px solid var(--line);
  border-radius: 7px;
  background: var(--canvas);
  color: var(--ink);
  font: 500 23px/1 var(--mono);
}
.answer-slot.is-filled {
  background: var(--blue-soft);
  border-color: #cbd6f6;
}
.answer-slot.is-current {
  border-color: var(--blue);
  background: var(--paper);
}
.is-wrong .answer-slot.is-filled {
  border-color: var(--danger);
  color: var(--danger);
}
</style>
