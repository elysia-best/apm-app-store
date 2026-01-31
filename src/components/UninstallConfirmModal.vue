<template>
  <Transition enter-active-class="duration-200 ease-out" enter-from-class="opacity-0 scale-95"
    enter-to-class="opacity-100 scale-100" leave-active-class="duration-150 ease-in"
    leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95">
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4"
      @click.self="handleClose">
      <div class="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-white/95 p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        
        <div class="mb-6 flex items-center gap-4">
          <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-100 to-rose-50 shadow-inner dark:from-rose-900/30 dark:to-rose-800/20">
            <i class="fas fa-trash-alt text-2xl text-rose-500"></i>
          </div>
          <div>
            <h3 class="text-xl font-bold text-slate-900 dark:text-white">卸载应用</h3>
            <p class="text-sm text-slate-500 dark:text-slate-400">
              您确定要卸载 <span class="font-semibold text-slate-700 dark:text-slate-200">{{ appName }}</span> 吗？
            </p>
            <p class="text-xs text-slate-400 mt-1">{{ appPkg }}</p>
          </div>
        </div>

        <!-- Terminal Output -->
        <div v-if="uninstalling || completed" 
          class="mb-6 max-h-48 overflow-y-auto rounded-xl border border-slate-200/50 bg-slate-900 p-3 font-mono text-xs text-slate-300 shadow-inner scrollbar-muted dark:border-slate-700">
          <div v-for="(line, index) in logs" :key="index" class="whitespace-pre-wrap break-all">{{ line }}</div>
          <div ref="logEnd"></div>
        </div>

        <div v-if="error" class="mb-4 rounded-xl border border-rose-200/50 bg-rose-50 p-3 text-sm text-rose-600 dark:border-rose-900/30 dark:bg-rose-900/20 dark:text-rose-400">
          {{ error }}
        </div>

        <div class="flex items-center justify-end gap-3">
          <button v-if="!uninstalling" type="button"
            class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            @click="handleClose">
            取消
          </button>
          
          <button v-if="!uninstalling && !completed" type="button"
            class="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-rose-500/30 transition hover:bg-rose-600 hover:-translate-y-0.5"
            @click="confirmUninstall">
            <i class="fas fa-trash"></i>
            确认卸载
          </button>

          <button v-if="completed" type="button"
            class="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600"
            @click="handleFinish">
            完成
          </button>
        </div>

      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick, onUnmounted } from 'vue';
import type { App } from '../global/typedefinition';

const props = defineProps<{
  show: boolean;
  app: App | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'success'): void;
}>();

const uninstalling = ref(false);
const completed = ref(false);
const logs = ref<string[]>([]);
const error = ref('');
const logEnd = ref<HTMLElement | null>(null);

const appName = computed(() => props.app?.name || '未知应用');
const appPkg = computed(() => props.app?.pkgname || '');

const handleClose = () => {
  if (uninstalling.value && !completed.value) return; // Prevent closing while uninstalling
  reset();
  emit('close');
};

const handleFinish = () => {
  reset();
  emit('success'); // Parent should refresh list
  emit('close'); 
};

const reset = () => {
  uninstalling.value = false;
  completed.value = false;
  logs.value = [];
  error.value = '';
};

const confirmUninstall = () => {
  if (!appPkg.value) {
    error.value = '无效的包名';
    return;
  }
  
  uninstalling.value = true;
  logs.value = ['正在请求卸载: ' + appPkg.value + '...'];
  
  window.ipcRenderer.send('remove-installed', appPkg.value);
};

// Listeners
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const onProgress = (_event: any, chunk: string) => {
  if (!uninstalling.value) return;
  // Split by newline but handle chunks correctly? 
  // For simplicity, just appending lines if chunk contains newlines, or appending to last line?
  // Let's just push lines. The backend output might come in partial chunks.
  // A simple way is just to push the chunk and let CSS whitespace-pre-wrap handle it.
  // But strictly, we might want to split lines.
  logs.value.push(chunk);
  scrollToBottom();
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const onComplete = (_event: any, result: { success: boolean; message: any }) => {
  if (!uninstalling.value) return; // Ignore if not current session
  
  const msgObj = typeof result.message === 'string' ? JSON.parse(result.message) : result.message;
  
  if (result.success) {
    logs.value.push('\n[完成] ' + (msgObj.message || '卸载成功'));
    completed.value = true;
  } else {
    logs.value.push('\n[错误] ' + (msgObj.message || '卸载失败'));
    error.value = msgObj.message || '卸载失败';
    // Allow trying again or closing?
    // We stay in "uninstalling" state visually or switch to completed=true but with error?
    // Let's set completed=true so user can click "Finish" (Close).
    completed.value = true;
  }
  scrollToBottom();
};

const scrollToBottom = () => {
  nextTick(() => {
    if (logEnd.value) {
      logEnd.value.scrollIntoView({ behavior: 'smooth' });
    }
  });
};

watch(() => props.show, (val) => {
  if (val) {
    // specific setup if needed
    window.ipcRenderer.on('remove-progress', onProgress);
    window.ipcRenderer.on('remove-complete', onComplete);
  } else {
    window.ipcRenderer.off('remove-progress', onProgress);
    window.ipcRenderer.off('remove-complete', onComplete);
  }
});

onUnmounted(() => {
  window.ipcRenderer.off('remove-progress', onProgress);
  window.ipcRenderer.off('remove-complete', onComplete);
});

</script>
