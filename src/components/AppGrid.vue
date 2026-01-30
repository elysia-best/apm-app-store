<template>
  <div v-if="!loading" class="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
    <AppCard v-for="(app, index) in apps" :key="index" :app="app" @open-detail="$emit('open-detail', app)" />
  </div>
  <div v-else class="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
    <div v-for="n in 8" :key="n"
      class="flex gap-4 rounded-2xl border border-slate-200/60 bg-white/80 p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
      <div class="h-16 w-16 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"></div>
      <div class="flex flex-1 flex-col justify-center gap-2">
        <div class="h-4 w-2/3 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800"></div>
        <div class="h-3 w-1/2 animate-pulse rounded-full bg-slate-200/80 dark:bg-slate-800/80"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';
import AppCard from './AppCard.vue';

defineProps({
  apps: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    required: true
  }
});

defineEmits(['open-detail']);
</script>
