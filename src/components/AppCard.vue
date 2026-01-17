<template>
  <div class="card" @click="openDetail">
    <div class="icon">
      <img 
        :data-src="iconPath" 
        src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23f0f3f8'/%3E%3C/svg%3E" 
        alt="icon" 
        class="lazy"
      >
    </div>
    <div class="meta">
      <div class="title">{{ app.Name || '' }}</div>
      <div class="muted">{{ app.Pkgname || '' }} · {{ app.Version || '' }}</div>
      <div class="description">
        {{ description }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, defineProps, defineEmits, onMounted } from 'vue';

const props = defineProps({
  app: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['open-detail']);

const iconPath = computed(() => {
  return `./${props.app._category}/${props.app.Pkgname}/icon.png`;
});

const description = computed(() => {
  const more = props.app.More || '';
  return more.substring(0, 80) + (more.length > 80 ? '...' : '');
});

const openDetail = () => {
  emit('open-detail', props.app);
};

onMounted(() => {
  // 懒加载图片
  const lazyImage = document.querySelector('.lazy');
  if (window.observer && lazyImage) {
    window.observer.observe(lazyImage);
  }
});
</script>

<style scoped>
/* 该组件样式已在全局样式中定义 */
</style>
