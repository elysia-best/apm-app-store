<template>
  <Transition
    enter-active-class="duration-200 ease-out"
    enter-from-class="opacity-0 scale-95"
    enter-to-class="opacity-100 scale-100"
    leave-active-class="duration-150 ease-in"
    leave-from-class="opacity-100 scale-100"
    leave-to-class="opacity-0 scale-95"
  >
    <div
      v-if="show"
      class="absolute left-1/2 top-full z-100 mt-2 w-72 -translate-x-1/2 rounded-3xl border border-slate-200/70 bg-white shadow-2xl backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-900 sm:w-96"
    >
      <div
        class="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800"
      >
        <div
          class="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200"
        >
          <i class="fas fa-download text-brand"></i>
          <span>下载任务</span>
          <span
            v-if="downloads.length"
            class="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800/70 dark:text-slate-300"
          >
            ({{ activeDownloadsCount }}/{{ downloads.length }})
          </span>
        </div>
        <div class="flex items-center gap-2">
          <button
            v-if="downloads.length"
            type="button"
            class="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            title="清除已完成"
            @click.stop="clearCompleted"
          >
            <i class="fas fa-broom text-xs"></i>
          </button>
          <button
            type="button"
            class="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            @click="$emit('close')"
          >
            <i class="fas fa-times text-xs"></i>
          </button>
        </div>
      </div>

      <div class="max-h-[32rem] overflow-y-auto p-4 scrollbar-muted">
        <div
          v-if="downloads.length === 0"
          class="flex flex-col items-center justify-center py-12 text-slate-500 dark:text-slate-400"
        >
          <i class="fas fa-inbox text-3xl opacity-20"></i>
          <p class="mt-3 text-sm">暂无下载任务</p>
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="download in downloads"
            :key="download.id"
            class="group relative flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200/50 bg-slate-50/50 p-3 transition hover:border-brand/30 hover:bg-white dark:border-slate-800/50 dark:bg-slate-800/30 dark:hover:bg-slate-800"
            @click="showDownloadDetail(download)"
          >
            <div
              class="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-white shadow-sm dark:bg-slate-800"
            >
              <img
                :src="download.icon"
                :alt="download.name"
                class="h-full w-full object-cover"
              />
              <div
                v-if="
                  download.status === 'downloading' ||
                  download.status === 'installing'
                "
                class="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px]"
              >
                <div
                  class="h-2 w-2 animate-pulse rounded-full bg-brand shadow-lg shadow-brand/50"
                ></div>
              </div>
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between gap-2">
                <p
                  class="truncate text-sm font-semibold text-slate-800 dark:text-slate-100"
                >
                  {{ download.name }}
                </p>
                <span
                  class="shrink-0 text-[10px] font-bold uppercase tracking-wider"
                  :class="{
                    'text-brand': download.status === 'downloading',
                    'text-amber-500': download.status === 'installing',
                    'text-emerald-500': download.status === 'completed',
                    'text-rose-500': download.status === 'failed',
                    'text-slate-400':
                      download.status === 'paused' ||
                      download.status === 'queued',
                  }"
                >
                  <span v-if="download.status === 'downloading'"
                    >{{ Math.floor((download.progress || 0) * 100) }}%</span
                  >
                  <span v-else-if="download.status === 'installing'"
                    >安装中</span
                  >
                  <span v-else-if="download.status === 'completed'">完成</span>
                  <span v-else-if="download.status === 'failed'">失败</span>
                  <span v-else-if="download.status === 'paused'">暂停</span>
                  <span v-else>队列中</span>
                </span>
              </div>
              <div
                class="mt-2 h-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
              >
                <div
                  v-if="download.status === 'downloading'"
                  class="h-full bg-brand transition-all duration-300"
                  :style="{ width: `${(download.progress || 0) * 100}%` }"
                ></div>
                <div
                  v-else-if="download.status === 'installing'"
                  class="h-full animate-progress-stripes bg-amber-500"
                  style="width: 100%"
                ></div>
                <div
                  v-else-if="download.status === 'completed'"
                  class="h-full bg-emerald-500"
                  style="width: 100%"
                ></div>
                <div
                  v-else-if="download.status === 'failed'"
                  class="h-full bg-rose-500"
                  style="width: 100%"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { DownloadItem } from "../global/typedefinition";

const props = defineProps<{
  show: boolean;
  downloads: DownloadItem[];
}>();

const emit = defineEmits<{
  (e: "pause", download: DownloadItem): void;
  (e: "resume", download: DownloadItem): void;
  (e: "cancel", download: DownloadItem): void;
  (e: "retry", download: DownloadItem): void;
  (e: "clear-completed"): void;
  (e: "show-detail", download: DownloadItem): void;
  (e: "close"): void;
}>();

const activeDownloadsCount = computed(() => {
  return props.downloads.filter(
    (d) => d.status === "downloading" || d.status === "installing",
  ).length;
});

const clearCompleted = () => {
  emit("clear-completed");
};

const showDownloadDetail = (download: DownloadItem) => {
  emit("show-detail", download);
};
</script>

<style scoped>
@keyframes progress-stripes {
  from {
    background-position: 1rem 0;
  }
  to {
    background-position: 0 0;
  }
}

.animate-progress-stripes {
  background-image: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.15) 25%,
    transparent 25%,
    transparent 50%,
    rgba(255, 255, 255, 0.15) 50%,
    rgba(255, 255, 255, 0.15) 75%,
    transparent 75%,
    transparent
  );
  background-size: 1rem 1rem;
  animation: progress-stripes 1s linear infinite;
}
</style>
