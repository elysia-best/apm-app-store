<template>
  <div
    class="fixed inset-x-4 bottom-4 z-40 rounded-3xl border border-slate-200/70 bg-white/95 shadow-2xl backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/90 sm:left-auto sm:right-6 sm:w-96"
  >
    <div
      class="flex items-center justify-between px-5 py-4"
      @click="toggleExpand"
    >
      <div
        class="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200"
      >
        <i class="fas fa-download text-brand"></i>
        <span>下载队列</span>
        <span
          v-if="downloads.length"
          class="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800/70 dark:text-slate-300"
        >
          ({{ activeDownloads }}/{{ downloads.length }})
        </span>
      </div>
      <div class="flex items-center gap-2">
        <button
          v-if="downloads.length"
          type="button"
          class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/70 text-slate-500 transition hover:text-slate-900 dark:border-slate-700 dark:text-slate-400"
          title="清除已完成"
          @click.stop="clearCompleted"
        >
          <i class="fas fa-broom"></i>
        </button>
        <button
          type="button"
          class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/70 text-slate-500 transition hover:text-slate-900 dark:border-slate-700 dark:text-slate-400"
          @click.stop="toggleExpand"
        >
          <i
            class="fas"
            :class="isExpanded ? 'fa-chevron-down' : 'fa-chevron-up'"
          ></i>
        </button>
      </div>
    </div>

    <Transition
      enter-active-class="duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div v-show="isExpanded" class="max-h-96 overflow-y-auto px-3 pb-4">
        <div
          v-if="downloads.length === 0"
          class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200/80 px-4 py-12 text-slate-500 dark:border-slate-800/80 dark:text-slate-400"
        >
          <i class="fas fa-inbox text-3xl"></i>
          <p class="mt-3 text-sm">暂无下载任务</p>
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="download in downloads"
            :key="download.id"
            class="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/90 p-3 shadow-sm transition hover:border-brand/40 hover:shadow-lg dark:border-slate-800/70 dark:bg-slate-900"
            :class="
              download.status === 'failed'
                ? 'border-rose-300/70 dark:border-rose-500/40'
                : ''
            "
            @click="showDownloadDetail(download)"
          >
            <div
              class="h-12 w-12 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800"
            >
              <img
                :src="download.icon"
                :alt="download.name"
                class="h-full w-full object-cover"
              />
            </div>
            <div class="flex-1">
              <p
                class="truncate text-sm font-semibold text-slate-800 dark:text-slate-100"
              >
                {{ download.name }}
              </p>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                <span v-if="download.status === 'downloading'"
                  >下载中 {{ Math.floor(download.progress * 100) }}%</span
                >
                <span v-else-if="download.status === 'installing'"
                  >安装中...</span
                >
                <span v-else-if="download.status === 'completed'">已完成</span>
                <span v-else-if="download.status === 'failed'"
                  >失败: {{ download.error }}</span
                >
                <span v-else-if="download.status === 'paused'">已暂停</span>
                <span v-else>等待中...</span>
              </p>
              <div
                v-if="download.status === 'downloading'"
                class="mt-2 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800"
              >
                <div
                  class="h-full rounded-full bg-brand"
                  :style="{ width: `${download.progress * 100}%` }"
                ></div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                v-if="download.status === 'failed'"
                type="button"
                class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-200/60 text-rose-500 transition hover:bg-rose-50"
                title="重试"
                @click.stop="retryDownload(download)"
              >
                <i class="fas fa-redo"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { DownloadItem } from "../global/typedefinition";

const props = defineProps<{
  downloads: DownloadItem[];
}>();

const emit = defineEmits<{
  (e: "pause", download: DownloadItem): void;
  (e: "resume", download: DownloadItem): void;
  (e: "cancel", download: DownloadItem): void;
  (e: "retry", download: DownloadItem): void;
  (e: "clear-completed"): void;
  (e: "show-detail", download: DownloadItem): void;
}>();

const isExpanded = ref(false);

const activeDownloads = computed(() => {
  return props.downloads.filter(
    (d) => d.status === "downloading" || d.status === "installing",
  ).length;
});

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;
};

const retryDownload = (download: DownloadItem) => {
  emit("retry", download);
};

const clearCompleted = () => {
  emit("clear-completed");
};

const showDownloadDetail = (download: DownloadItem) => {
  emit("show-detail", download);
};
</script>
