<template>
  <button type="button"
    class="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-3 text-sm font-medium text-slate-600 shadow-sm transition hover:border-brand/40 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 dark:border-slate-800/70 dark:bg-slate-900/60 dark:text-slate-300"
    :aria-pressed="isDark" @click="toggle">
    <span class="flex items-center gap-2">
      <i class="fas" :class="isDark ? 'fa-moon text-amber-200' : 'fa-sun text-amber-400'"></i>
      <span>{{ isDark ? '深色主题' : '浅色主题' }}</span>
    </span>
    <span class="relative inline-flex h-6 w-12 items-center rounded-full bg-slate-300/80 transition dark:bg-slate-700">
      <span :class="['inline-block h-4 w-4 rounded-full bg-white shadow transition', isDark ? 'translate-x-6' : 'translate-x-1']"></span>
    </span>
  </button>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

defineProps({
  isDark: {
    type: Boolean,
    required: true
  }
});

const emit = defineEmits(['toggle']);

const toggle = () => {
  emit('toggle');
};
</script>
