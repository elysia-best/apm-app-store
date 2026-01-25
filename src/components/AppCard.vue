<template>
  <div class="card" @click="openDetail">
    <div class="icon">
      <img 
        ref="iconImg"
        :src="loadedIcon" 
        alt="icon" 
        class="lazy"
        :class="{ 'loaded': isLoaded }"
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
import { computed, defineProps, defineEmits, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { APM_STORE_ARCHITECTURE, APM_STORE_BASE_URL } from '../global/storeConfig';

const props = defineProps({
  app: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['open-detail']);

const iconImg = ref(null);
const isLoaded = ref(false);
const loadedIcon = ref('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23f0f0f0" width="100" height="100"/%3E%3C/svg%3E');

const iconPath = computed(() => {
  return `${APM_STORE_BASE_URL}/${APM_STORE_ARCHITECTURE}/${props.app._category}/${props.app.Pkgname}/icon.png`;
});

const description = computed(() => {
  const more = props.app.More || '';
  return more.substring(0, 80) + (more.length > 80 ? '...' : '');
});

const openDetail = () => {
  emit('open-detail', props.app);
};

let observer = null;

onMounted(() => {
  // 创建 Intersection Observer
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !isLoaded.value) {
          // 图片进入视口，开始加载
          const img = new Image();
          img.onload = () => {
            loadedIcon.value = iconPath.value;
            isLoaded.value = true;
            observer.unobserve(entry.target);
          };
          img.onerror = () => {
            // 加载失败时使用默认图标
            loadedIcon.value = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23e0e0e0" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%23999" font-size="14"%3ENo Icon%3C/text%3E%3C/svg%3E';
            isLoaded.value = true;
            observer.unobserve(entry.target);
          };
          img.src = iconPath.value;
        }
      });
    },
    {
      rootMargin: '50px', // 提前50px开始加载
      threshold: 0.01
    }
  );

  // 观察图标元素
  if (iconImg.value) {
    observer.observe(iconImg.value);
  }
});

// 当 app 变更时重置懒加载状态并重新观察
watch(iconPath, () => {
  loadedIcon.value = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23f0f0f0" width="100" height="100"/%3E%3C/svg%3E';
  isLoaded.value = false;
  if (observer && iconImg.value) {
    observer.unobserve(iconImg.value);
    observer.observe(iconImg.value);
  }
});

onBeforeUnmount(() => {
  // 清理 observer
  if (observer && iconImg.value) {
    observer.unobserve(iconImg.value);
  }
});
</script>

<style scoped>
/* 该组件样式已在全局样式中定义 */

/* 懒加载过渡效果 */
.lazy {
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
}

.lazy.loaded {
  opacity: 1;
}
</style>
