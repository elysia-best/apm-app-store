<template>
  <Transition enter-active-class="duration-200 ease-out" enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100" leave-active-class="duration-150 ease-in"
      leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95">
      <div v-if="show" v-bind="attrs"
        class="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-slate-900/70 p-4"
        @click.self="closeModal">
      <div class="modal-panel relative w-full max-w-4xl max-h-[85vh] overflow-y-auto scrollbar-nowidth rounded-3xl border border-white/10 bg-white/95 p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div class="flex flex-1 items-center gap-4">
            <div
              class="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-b from-slate-100 to-slate-200 shadow-inner dark:from-slate-800 dark:to-slate-700">
              <img v-if="app" :src="iconPath" alt="icon" class="h-full w-full object-cover" />
            </div>
            <div class="space-y-1">
              <div class="flex items-center gap-3">
                <p class="text-2xl font-bold text-slate-900 dark:text-white">{{ app?.name || '' }}</p>
                <!-- Close button for mobile layout could be considered here if needed, but for now sticking to desktop layout logic mainly -->
              </div>
              <p class="text-sm text-slate-500 dark:text-slate-400">{{ app?.pkgname || '' }} · {{ app?.version || '' }}</p>
            </div>
          </div>
          <div class="flex flex-wrap gap-2 lg:ml-auto">
            <button v-if="!isinstalled" type="button"
              class="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r px-4 py-2 text-sm font-semibold text-white shadow-lg disabled:opacity-40 transition hover:-translate-y-0.5"
              :class="installFeedback ? 'from-emerald-500 to-emerald-600' : 'from-brand to-brand-dark'"
              @click="handleInstall"
              :disabled="installFeedback || isCompleted">
              <i class="fas" :class="installFeedback ? 'fa-check' : 'fa-download'"></i>
              <span>{{ installBtnText }}</span>
            </button>
            <template v-else>
              <button type="button"
                class="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand to-brand-dark px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5"
                @click="emit('open-app', app?.pkgname || '')">
                <i class="fas fa-external-link-alt"></i>
                <span>打开</span>
              </button>
              <button type="button"
                class="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-rose-500/30 disabled:opacity-40 transition hover:-translate-y-0.5"
                @click="handleRemove">
                <i class="fas fa-trash"></i>
                <span>卸载</span>
              </button>
            </template>
            <button type="button"
              class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/70 text-slate-500 transition hover:text-slate-900 dark:border-slate-700"
              @click="closeModal" aria-label="关闭">
              <i class="fas fa-xmark"></i>
            </button>
          </div>
        </div>

        <div
          class="mt-4 rounded-2xl border border-slate-200/60 bg-slate-50/70 px-4 py-3 text-sm text-slate-600 dark:border-slate-800/60 dark:bg-slate-900/60 dark:text-slate-300">
          首次安装 APM 后需要重启系统以在启动器中看到应用入口。可前往
          <a href="https://gitee.com/amber-ce/amber-pm/releases" target="_blank"
            class="font-semibold text-brand hover:underline">APM Releases</a>
          获取 APM。
        </div>

        <div v-if="screenshots.length" class="mt-6 grid gap-3 sm:grid-cols-2">
          <img v-for="(screen, index) in screenshots" :key="index" :src="screen" alt="screenshot"
            class="h-40 w-full cursor-pointer rounded-2xl border border-slate-200/60 object-cover shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800/60"
            @click="openPreview(index)" @error="hideImage" />
        </div>

        <div class="mt-6 grid gap-4 sm:grid-cols-2">
          <div v-if="app?.author" class="rounded-2xl border border-slate-200/60 p-4 dark:border-slate-800/60">
            <p class="text-xs uppercase tracking-wide text-slate-400">作者</p>
            <p class="text-sm font-medium text-slate-800 dark:text-slate-200">{{ app.author }}</p>
          </div>
          <div v-if="app?.contributor" class="rounded-2xl border border-slate-200/60 p-4 dark:border-slate-800/60">
            <p class="text-xs uppercase tracking-wide text-slate-400">贡献者</p>
            <p class="text-sm font-medium text-slate-800 dark:text-slate-200">{{ app.contributor }}</p>
          </div>
          <div v-if="app?.size" class="rounded-2xl border border-slate-200/60 p-4 dark:border-slate-800/60">
            <p class="text-xs uppercase tracking-wide text-slate-400">大小</p>
            <p class="text-sm font-medium text-slate-800 dark:text-slate-200">{{ app.size }}</p>
          </div>
          <div v-if="app?.update" class="rounded-2xl border border-slate-200/60 p-4 dark:border-slate-800/60">
            <p class="text-xs uppercase tracking-wide text-slate-400">更新时间</p>
            <p class="text-sm font-medium text-slate-800 dark:text-slate-200">{{ app.update }}</p>
          </div>
          <div v-if="app?.website" class="rounded-2xl border border-slate-200/60 p-4 dark:border-slate-800/60">
            <p class="text-xs uppercase tracking-wide text-slate-400">网站</p>
            <a :href="app.website" target="_blank"
              class="text-sm font-medium text-brand hover:underline">{{ app.website }}</a>
          </div>
          <div v-if="app?.version" class="rounded-2xl border border-slate-200/60 p-4 dark:border-slate-800/60">
            <p class="text-xs uppercase tracking-wide text-slate-400">版本</p>
            <p class="text-sm font-medium text-slate-800 dark:text-slate-200">{{ app.version }}</p>
          </div>
          <div v-if="app?.tags" class="rounded-2xl border border-slate-200/60 p-4 dark:border-slate-800/60">
            <p class="text-xs uppercase tracking-wide text-slate-400">标签</p>
            <p class="text-sm font-medium text-slate-800 dark:text-slate-200">{{ app.tags }}</p>
          </div>
        </div>

        <div v-if="app?.more && app.more.trim() !== ''" class="mt-6 space-y-3">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white">应用详情</h3>
          <div
            class="max-h-60 space-y-2 overflow-y-auto rounded-2xl border border-slate-200/60 bg-slate-50/80 p-4 text-sm leading-relaxed text-slate-600 dark:border-slate-800/60 dark:bg-slate-900/60 dark:text-slate-300"
            v-html="app.more.replace(/\n/g, '<br>')"></div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed,useAttrs } from 'vue';
import { useDownloadItemStatus,useInstallFeedback } from '../global/downloadStatus';
import { APM_STORE_BASE_URL } from '../global/storeConfig';
import type { App } from '../global/typedefinition';

const attrs = useAttrs();

const props = defineProps<{
  show: boolean;
  app: App | null;
  screenshots: string[];
  isinstalled: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'install'): void;
  (e: 'remove'): void;
  (e: 'open-preview', index: number): void;
  (e: 'open-app', pkgname: string ): void;
}>();


const appPkgname = computed(() => props.app?.pkgname);
const { installFeedback } = useInstallFeedback(appPkgname);
const { isCompleted } = useDownloadItemStatus(appPkgname);
const installBtnText = computed(() => {
  if (isCompleted.value) {
  // TODO: 似乎有一个时间差，安装好了之后并不是立马就可以从已安装列表看见
    return "已安装";
  }
  return installFeedback.value ? "已加入队列" : "安装";
});
const iconPath = computed(() => {
  if (!props.app) return '';
  return `${APM_STORE_BASE_URL}/${window.apm_store.arch}/${props.app.category}/${props.app.pkgname}/icon.png`;
});

const closeModal = () => {
  emit('close');
};

const handleInstall = () => {
  emit('install');
};

const handleRemove = () => {
    emit('remove');
}

const openPreview = (index: number) => {
  emit('open-preview', index);
};

const hideImage = (e: Event) => {
  (e.target as HTMLElement).style.display = 'none';
};
</script>
