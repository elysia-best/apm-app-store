<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center">
      <TopActions @update="$emit('update')" @list="$emit('list')" />
      <div class="w-full flex-1">
        <label for="searchBox" class="sr-only">搜索应用</label>
        <div class="relative">
          <i class="fas fa-search pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input id="searchBox" v-model="localSearchQuery"
            class="w-full rounded-2xl border border-slate-200/70 bg-white/80 py-3 pl-12 pr-4 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand/50 focus:ring-4 focus:ring-brand/10 dark:border-slate-800/70 dark:bg-slate-900/60 dark:text-slate-200"
            placeholder="搜索应用名 / 包名 / 标签" @input="debounceSearch" />
        </div>
      </div>
    </div>
    <div class="text-sm text-slate-500 dark:text-slate-400" id="currentCount">
      共 {{ appsCount }} 个应用 · 在任何主流 Linux 发行上安装应用
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import TopActions from './TopActions.vue';

const props = defineProps<{
  searchQuery: string;
  appsCount: number;
}>();

const emit = defineEmits<{
  (e: 'update-search', query: string): void;
  (e: 'update'): void;
  (e: 'list'): void;
}>();

const localSearchQuery = ref(props.searchQuery || '');
const timeoutId = ref<ReturnType<typeof setTimeout> | null>(null);

const debounceSearch = () => {
  if (timeoutId.value) clearTimeout(timeoutId.value);
  timeoutId.value = setTimeout(() => {
    emit('update-search', localSearchQuery.value);
  }, 220);
};

watch(() => props.searchQuery, (newVal) => {
  localSearchQuery.value = newVal || '';
});
</script>
