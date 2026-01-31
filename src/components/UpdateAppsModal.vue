<template>
  <Transition enter-active-class="duration-200 ease-out" enter-from-class="opacity-0 scale-95"
    enter-to-class="opacity-100 scale-100" leave-active-class="duration-150 ease-in"
    leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95">
    <div v-if="show"
      class="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/70 px-4 py-10">
      <div class="w-full max-w-4xl max-h-[85vh] overflow-y-auto scrollbar-nowidth rounded-3xl border border-white/10 bg-white/95 p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div class="flex flex-wrap items-center gap-3">
          <div class="flex-1">
            <p class="text-2xl font-semibold text-slate-900 dark:text-white">软件更新</p>
            <p class="text-sm text-slate-500 dark:text-slate-400">可更新的 APM 应用</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button type="button"
              class="inline-flex items-center gap-2 rounded-2xl border border-slate-200/70 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200"
              :disabled="loading" @click="$emit('refresh')">
              <i class="fas fa-sync-alt"></i>
              刷新
            </button>
            <button type="button"
              class="inline-flex items-center gap-2 rounded-2xl border border-slate-200/70 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200"
              :disabled="loading || apps.length === 0" @click="$emit('toggle-all')">
              <i class="fas fa-check-square"></i>
              全选/全不选
            </button>
            <button type="button"
              class="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand to-brand-dark px-4 py-2 text-sm font-semibold text-white shadow-lg disabled:opacity-40"
              :disabled="loading || !hasSelected" @click="$emit('upgrade-selected')">
              <i class="fas fa-upload"></i>
              更新选中
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
            正在检查可更新应用…
          </div>
          <div v-else-if="error"
            class="rounded-2xl border border-rose-200/70 bg-rose-50/60 px-4 py-6 text-center text-sm text-rose-600 dark:border-rose-500/40 dark:bg-rose-500/10">
            {{ error }}
          </div>
          <div v-else-if="apps.length === 0"
            class="rounded-2xl border border-slate-200/70 px-4 py-10 text-center text-slate-500 dark:border-slate-800/70 dark:text-slate-400">
            暂无可更新应用
          </div>
          <div v-else class="space-y-3">
            <label v-for="app in apps" :key="app.pkgname"
              class="flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70 sm:flex-row sm:items-center sm:gap-4">
              <div class="flex items-start gap-3">
                <input type="checkbox" class="mt-1 h-4 w-4 rounded border-slate-300 accent-brand focus:ring-brand"
                  v-model="app.selected" :disabled="app.upgrading" />
                <div>
                  <p class="font-semibold text-slate-900 dark:text-white">{{ app.pkgname }}</p>
                  <p class="text-sm text-slate-500 dark:text-slate-400">
                    当前 {{ app.currentVersion || '-' }} · 更新至 {{ app.newVersion || '-' }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2 sm:ml-auto">
                <button type="button"
                  class="inline-flex items-center gap-2 rounded-2xl border border-slate-200/70 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200"
                  :disabled="app.upgrading" @click.prevent="$emit('upgrade-one', app)">
                  <i class="fas fa-arrow-up"></i>
                  {{ app.upgrading ? '更新中…' : '更新' }}
                </button>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { UpdateAppItem } from '../global/typedefinition';

defineProps<{
  show: boolean;
  apps: UpdateAppItem[];
  loading: boolean;
  error: string;
  hasSelected: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'refresh'): void;
  (e: 'toggle-all'): void;
  (e: 'upgrade-selected'): void;
  (e: 'upgrade-one', app: UpdateAppItem): void;
}>();
</script>

