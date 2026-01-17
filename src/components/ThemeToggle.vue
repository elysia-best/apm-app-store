<template>
  <div class="theme-toggle-container">
    <span class="theme-label">主题切换</span>
    <label class="theme-toggle">
      <input type="checkbox" :checked="isDark" @change="toggle">
      <span class="theme-slider">
        <i class="fas fa-sun"></i>
        <i class="fas fa-moon"></i>
      </span>
    </label>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  isDark: {
    type: Boolean,
    required: true
  }
});

const emit = defineEmits(['toggle']);

const toggle = () => {
  emit('toggle');
};
</script>

<style scoped>
/* 该组件样式已在全局样式中定义 */
</style>
