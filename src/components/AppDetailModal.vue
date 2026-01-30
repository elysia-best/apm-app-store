<template>
  <Transition enter-active-class="duration-200 ease-out" enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100" leave-active-class="duration-150 ease-in"
      leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95">
      <div v-if="show" v-bind="attrs"
        class="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/70 px-4 py-10 backdrop-blur-sm"
        @click.self="closeModal">
      <div class="modal-panel relative w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-white/95 p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <button type="button"
          class="absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/60 bg-white/50 text-slate-500 backdrop-blur-sm transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
          @click="closeModal" aria-label="关闭">
          <i class="fas fa-xmark"></i>
        </button>

        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:pr-12">
          <div class="flex items-center gap-4">
            <div
              class="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-b from-slate-100 to-slate-200 shadow-inner dark:from-slate-800 dark:to-slate-700">
              <img v-if="app" :src="iconPath" alt="icon" class="h-full w-full object-cover" />
            </div>
            <div class="space-y-1">
              <p class="text-2xl font-bold text-slate-900 dark:text-white">{{ app?.Name || '' }}</p>
              <p class="text-sm text-slate-500 dark:text-slate-400">{{ app?.Pkgname || '' }} · {{ app?.Version || '' }}</p>
            </div>
          </div>
          <div class="flex flex-wrap gap-3 lg:ml-auto">
            <button v-if="!isinstalled" type="button"
              class="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand to-brand-dark px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5"
              @click="handleInstall">
              <i class="fas fa-download"></i>
              <span>安装</span>
            </button>
            <button v-else type="button"
              class="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-rose-500/30 transition hover:-translate-y-0.5"
              @click="handleRemove">
              <i class="fas fa-trash"></i>
              <span>卸载</span>
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
          <div v-if="app?.Author" class="rounded-2xl border border-slate-200/60 p-4 dark:border-slate-800/60">
            <p class="text-xs uppercase tracking-wide text-slate-400">作者</p>
            <p class="text-sm font-medium text-slate-800 dark:text-slate-200">{{ app.Author }}</p>
          </div>
          <div v-if="app?.Contributor" class="rounded-2xl border border-slate-200/60 p-4 dark:border-slate-800/60">
            <p class="text-xs uppercase tracking-wide text-slate-400">贡献者</p>
            <p class="text-sm font-medium text-slate-800 dark:text-slate-200">{{ app.Contributor }}</p>
          </div>
          <div v-if="app?.Size" class="rounded-2xl border border-slate-200/60 p-4 dark:border-slate-800/60">
            <p class="text-xs uppercase tracking-wide text-slate-400">大小</p>
            <p class="text-sm font-medium text-slate-800 dark:text-slate-200">{{ app.Size }}</p>
          </div>
          <div v-if="app?.Update" class="rounded-2xl border border-slate-200/60 p-4 dark:border-slate-800/60">
            <p class="text-xs uppercase tracking-wide text-slate-400">更新时间</p>
            <p class="text-sm font-medium text-slate-800 dark:text-slate-200">{{ app.Update }}</p>
          </div>
          <div v-if="app?.Website" class="rounded-2xl border border-slate-200/60 p-4 dark:border-slate-800/60">
            <p class="text-xs uppercase tracking-wide text-slate-400">网站</p>
            <a :href="app.Website" target="_blank"
              class="text-sm font-medium text-brand hover:underline">{{ app.Website }}</a>
          </div>
          <div v-if="app?.Version" class="rounded-2xl border border-slate-200/60 p-4 dark:border-slate-800/60">
            <p class="text-xs uppercase tracking-wide text-slate-400">版本</p>
            <p class="text-sm font-medium text-slate-800 dark:text-slate-200">{{ app.Version }}</p>
          </div>
          <div v-if="app?.Tags" class="rounded-2xl border border-slate-200/60 p-4 dark:border-slate-800/60">
            <p class="text-xs uppercase tracking-wide text-slate-400">标签</p>
            <p class="text-sm font-medium text-slate-800 dark:text-slate-200">{{ app.Tags }}</p>
          </div>
        </div>

        <div v-if="app?.More && app.More.trim() !== ''" class="mt-6 space-y-3">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white">应用详情</h3>
          <div
            class="max-h-60 space-y-2 overflow-y-auto rounded-2xl border border-slate-200/60 bg-slate-50/80 p-4 text-sm leading-relaxed text-slate-600 dark:border-slate-800/60 dark:bg-slate-900/60 dark:text-slate-300"
            v-html="app.More.replace(/\n/g, '<br>')"></div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed, defineProps, defineEmits, useAttrs } from 'vue';
import { APM_STORE_ARCHITECTURE, APM_STORE_BASE_URL } from '../global/storeConfig';

defineOptions({ inheritAttrs: false });

const attrs = useAttrs();

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  app: {
    type: Object,
    default: null
  },
  screenshots: {
    type: Array,
    required: true
  },
  isinstalled: {
    type: Boolean,
    required: true 
  }
});

const emit = defineEmits(['close', 'install', 'remove', 'open-preview']);

const iconPath = computed(() => {
  return props.app ? `${APM_STORE_BASE_URL}/${APM_STORE_ARCHITECTURE}/${props.app._category}/${props.app.Pkgname}/icon.png` : '';
});

const closeModal = () => {
  emit('close');
};

const handleInstall = () => {
  emit('install');
};

const handleRemove = () => {
  emit('remove');
};

const openPreview = (index) => {
  emit('open-preview', index);
};

const hideImage = (event) => {
  if (event?.target) {
    event.target.style.display = 'none';
  }
};
</script>
