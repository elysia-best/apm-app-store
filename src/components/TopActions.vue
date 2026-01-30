<template>
  <div class="flex flex-wrap gap-3">
    <button type="button"
      class="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand to-brand-dark px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      @click="handleUpdate" title="启动 apm-update-tool">
      <i class="fas fa-sync-alt"></i>
      <span>软件更新</span>
    </button>
    <button type="button"
      class="inline-flex items-center gap-2 rounded-2xl bg-slate-900/90 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/40 transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/40 dark:bg-white/90 dark:text-slate-900"
      @click="handleList" title="启动 apm-installer --list">
      <i class="fas fa-download"></i>
      <span>应用管理</span>
    </button>
  </div>
</template>

<script setup>
import { defineEmits } from 'vue';

const emit = defineEmits(['update', 'list']);

const handleUpdate = () => {
  emit('update');
};

const handleList = () => {
  emit('list');
};
</script>
