<template>
  <Transition enter-active-class="duration-200 ease-out" enter-from-class="opacity-0 scale-95"
    enter-to-class="opacity-100 scale-100" leave-active-class="duration-150 ease-in"
    leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95">
    <div v-if="show"
      class="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/70 px-4 py-10">
      <div class="w-full max-w-4xl max-h-[85vh] overflow-y-auto scrollbar-nowidth scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 rounded-3xl border border-white/10 bg-white/95 p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-2xl font-semibold text-slate-900 dark:text-white">已安装应用</p>
            <p class="text-sm text-slate-500 dark:text-slate-400">来自本机 APM 安装列表</p>
          </div>
          <div class="flex items-center gap-3">
            <button type="button"
              class="inline-flex items-center gap-2 rounded-2xl border border-slate-200/70 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200"
              :disabled="loading" @click="$emit('refresh')">
              <i class="fas fa-sync-alt"></i>
              刷新
            </button>
            <button type="button"
              class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/70 text-slate-500 transition hover:text-slate-900 dark:border-slate-700"
              @click="$emit('close')" aria-label="关闭">
              <i class="fas fa-xmark"></i>
            </button>
          </div>
        </div>

        <div class="mt-6 space-y-4">
          <div v-if="loading"
            class="rounded-2xl border border-dashed border-slate-200/80 px-4 py-10 text-center text-slate-500 dark:border-slate-800/80 dark:text-slate-400">
            正在读取已安装应用…
          </div>
          <div v-else-if="error"
            class="rounded-2xl border border-rose-200/70 bg-rose-50/60 px-4 py-6 text-center text-sm text-rose-600 dark:border-rose-500/40 dark:bg-rose-500/10">
            {{ error }}
          </div>
          <div v-else-if="apps.length === 0"
            class="rounded-2xl border border-slate-200/70 px-4 py-10 text-center text-slate-500 dark:border-slate-800/70 dark:text-slate-400">
            暂无已安装应用
          </div>
          <div v-else class="space-y-3">
            <div v-for="app in apps" :key="app.pkgname"
              class="flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div class="flex items-center gap-2">
                  <p class="text-base font-semibold text-slate-900 dark:text-white">{{ app.pkgname }}</p>
                  <span v-if="app.flags && app.flags.includes('automatic')"
                    class="rounded-md bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                    依赖项
                  </span>
                </div>
                <div class="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>{{ app.version }}</span>
                  <span>·</span>
                  <span>{{ app.arch }}</span>
                  <template v-if="app.flags && !app.flags.includes('automatic')">
                    <span>·</span>
                    <span>{{ app.flags }}</span>
                  </template>
                </div>
              </div>
              <button type="button"
                class="inline-flex items-center gap-2 rounded-2xl border border-rose-300/60 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                :disabled="app.removing" @click="$emit('uninstall', app)">
                <i class="fas fa-trash"></i>
                {{ app.removing ? '卸载中…' : '卸载' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { App } from '@/global/typedefinition';

defineProps<{
  show: boolean;
  apps: App[];
  loading: boolean;
  error: string;
}>();

defineEmits<{
  (e: 'close'): void;
  (e: 'refresh'): void;
  (e: 'uninstall', app: App): void;
}>();
</script>

