<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center">
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200/70 bg-white/80 text-slate-500 shadow-sm transition hover:bg-slate-50 lg:hidden dark:border-slate-800/70 dark:bg-slate-900/60 dark:text-slate-400 dark:hover:bg-slate-800"
          @click="$emit('toggle-sidebar')"
          title="切换侧边栏"
        >
          <i class="fas fa-bars"></i>
        </button>
        <TopActions @update="$emit('update')" @list="$emit('list')" />
        <div class="relative">
          <button
            type="button"
            class="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200/70 bg-white/80 text-slate-500 shadow-sm transition hover:bg-slate-50 dark:border-slate-800/70 dark:bg-slate-900/60 dark:text-slate-400 dark:hover:bg-slate-800"
            @click="$emit('toggle-downloads')"
            title="下载列表"
          >
            <i class="fas fa-arrow-down"></i>
            <span
              v-if="activeDownloadsCount > 0"
              class="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900"
            >
              {{ activeDownloadsCount }}
            </span>
          </button>
          <DownloadQueue
            :show="showDownloadQueue"
            :downloads="downloads"
            @close="$emit('toggle-downloads')"
            @pause="(d) => $emit('pause-download', d)"
            @resume="(d) => $emit('resume-download', d)"
            @cancel="(d) => $emit('cancel-download', d)"
            @retry="(d) => $emit('retry-download', d)"
            @clear-completed="$emit('clear-completed')"
            @show-detail="(d) => $emit('show-detail', d)"
          />
        </div>
      </div>
      <div class="w-full flex-1">
        <label for="searchBox" class="sr-only">搜索应用</label>
        <div class="relative">
          <i
            class="fas fa-search pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          ></i>
          <input
            id="searchBox"
            v-model="localSearchQuery"
            class="w-full rounded-2xl border border-slate-200/70 bg-white/80 py-3 pl-12 pr-4 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand/50 focus:ring-4 focus:ring-brand/10 dark:border-slate-800/70 dark:bg-slate-900/60 dark:text-slate-200"
            placeholder="搜索应用名 / 包名 / 标签，按回车键搜索"
            @keydown.enter="handleSearch"
          />
        </div>
      </div>
    </div>
    <div class="text-sm text-slate-500 dark:text-slate-400" id="currentCount">
      共 {{ appsCount }} 个应用 · 在任何主流 Linux 发行上安装应用
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import TopActions from "./TopActions.vue";
import DownloadQueue from "./DownloadQueue.vue";
import type { DownloadItem } from "../global/typedefinition";

const props = defineProps<{
  searchQuery: string;
  activeCategory: string;
  appsCount: number;
  activeDownloadsCount: number;
  showDownloadQueue: boolean;
  downloads: DownloadItem[];
}>();

const emit = defineEmits<{
  (e: "update-search", query: string): void;
  (e: "update"): void;
  (e: "list"): void;
  (e: "toggle-sidebar"): void;
  (e: "toggle-downloads"): void;
  (e: "pause-download", download: DownloadItem): void;
  (e: "resume-download", download: DownloadItem): void;
  (e: "cancel-download", download: DownloadItem): void;
  (e: "retry-download", download: DownloadItem): void;
  (e: "clear-completed"): void;
  (e: "show-detail", download: DownloadItem): void;
}>();

const localSearchQuery = ref(props.searchQuery || "");

const handleSearch = () => {
  emit("update-search", localSearchQuery.value);
};

watch(
  () => props.searchQuery,
  (newVal) => {
    localSearchQuery.value = newVal || "";
  },
);

watch(
  () => props.activeCategory,
  () => {
    localSearchQuery.value = "";
  },
);
</script>
