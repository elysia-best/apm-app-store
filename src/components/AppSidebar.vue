<template>
  <div class="flex h-full flex-col gap-6">
    <div class="flex items-center gap-3">
      <img :src="amberLogo" alt="Amber PM" class="h-11 w-11 rounded-2xl bg-white/70 p-2 shadow-sm ring-1 ring-slate-900/5 dark:bg-slate-800" />
      <div class="flex flex-col">
        <span class="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">APM Store</span>
        <span class="text-lg font-semibold text-slate-900 dark:text-white">APM 客户端商店</span>
      </div>
    </div>

    <ThemeToggle :is-dark="isDarkTheme" @toggle="toggleTheme" />

    <div class="flex-1 space-y-2 overflow-y-auto scrollbar-muted pr-2">
      <button type="button" class="flex w-full items-center gap-3 rounded-2xl border border-transparent px-4 py-3 text-left text-sm font-medium text-slate-600 transition hover:border-brand/30 hover:bg-brand/5 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 dark:text-slate-300 dark:hover:bg-slate-800"
        :class="activeCategory === 'all' ? 'border-brand/40 bg-brand/10 text-brand dark:bg-brand/15' : ''"
        @click="selectCategory('all')">
        <span>全部应用</span>
        <span class="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500 dark:bg-slate-800/70 dark:text-slate-300">{{ categoryCounts.all || 0 }}</span>
      </button>

      <button v-for="(category, key) in categories" :key="key" type="button"
        class="flex w-full items-center gap-3 rounded-2xl border border-transparent px-4 py-3 text-left text-sm font-medium text-slate-600 transition hover:border-brand/30 hover:bg-brand/5 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 dark:text-slate-300 dark:hover:bg-slate-800"
        :class="activeCategory === key ? 'border-brand/40 bg-brand/10 text-brand dark:bg-brand/15' : ''"
        @click="selectCategory(key)">
        <span class="flex flex-col">
          <span>
            <div class="text-left">{{ category.zh }}</div>
          </span>
        </span>
        <span class="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500 dark:bg-slate-800/70 dark:text-slate-300">{{ categoryCounts[key] || 0 }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import ThemeToggle from './ThemeToggle.vue';
import amberLogo from '../assets/imgs/amber-pm-logo.png';

defineProps<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  categories: Record<string, any>;
  activeCategory: string;
  categoryCounts: Record<string, number>;
  isDarkTheme: boolean;
}>();

const emit = defineEmits<{
  (e: 'toggle-theme'): void;
  (e: 'select-category', category: string): void;
}>();

const toggleTheme = () => {
  emit('toggle-theme');
};

const selectCategory = (category: string) => {
  emit('select-category', category);
};
</script>
