<template>
  <div class="top-actions">
    <button class="apm-btn" @click="handleUpdate" title="启动 apm-update-tool">
      <i class="fas fa-sync-alt"></i> 软件更新
    </button>
    <button class="apm-btn" @click="handleList" title="启动 apm-installer --list">
      <i class="fas fa-download"></i> 应用管理
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

<style scoped>
/* 该组件样式已在全局样式中定义 */
</style>
