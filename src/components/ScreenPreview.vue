<template>
  <div class="screen-preview-backdrop" :style="{ display: show ? 'flex' : 'none' }">
    <div class="screen-preview">
      <div class="screen-preview-controls">
        <div class="screen-preview-nav">
          <button class="screen-preview-btn" @click="prevScreen" :disabled="currentScreenIndex === 0" aria-label="上一张">
            <i class="fas fa-chevron-left"></i>
          </button>
          <button class="screen-preview-btn" @click="nextScreen" :disabled="currentScreenIndex === screenshots.length - 1" aria-label="下一张">
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
        <button class="screen-preview-btn close-preview" @click="closePreview" aria-label="关闭">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <img :src="currentScreenshot" alt="应用截图预览">
      <div class="screen-preview-counter">{{ previewCounterText }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed, defineProps, defineEmits } from 'vue';

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  screenshots: {
    type: Array,
    required: true
  },
  currentScreenIndex: {
    type: Number,
    required: true
  }
});

const emit = defineEmits(['close', 'prev', 'next']);

const currentScreenshot = computed(() => {
  return props.screenshots[props.currentScreenIndex] || '';
});

const previewCounterText = computed(() => {
  return `${props.currentScreenIndex + 1} / ${props.screenshots.length}`;
});

const closePreview = () => {
  emit('close');
};

const prevScreen = () => {
  emit('prev');
};

const nextScreen = () => {
  emit('next');
};
</script>

<style scoped>
/* 该组件样式已在全局样式中定义 */
</style>
