<template>
  <div
    v-if="!loading"
    class="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
  >
    <AppCard
      v-for="(app, index) in visibleApps"
      :key="index"
      :app="app"
      @open-detail="$emit('open-detail', app)"
    />
    <div
      ref="sentinel"
      class="col-span-full h-4 w-full opacity-0 pointer-events-none"
    ></div>
  </div>
  <div
    v-else
    class="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
  >
    <div
      v-for="n in 8"
      :key="n"
      class="flex gap-4 rounded-2xl border border-slate-200/60 bg-white/80 p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50"
    >
      <div
        class="h-16 w-16 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"
      ></div>
      <div class="flex flex-1 flex-col justify-center gap-2">
        <div
          class="h-4 w-2/3 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800"
        ></div>
        <div
          class="h-3 w-1/2 animate-pulse rounded-full bg-slate-200/80 dark:bg-slate-800/80"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import AppCard from "./AppCard.vue";
import type { App } from "../global/typedefinition";

const props = defineProps<{
  apps: App[];
  loading: boolean;
}>();

defineEmits<{
  (e: "open-detail", app: App): void;
}>();

// 懒加载控制
const visibleCount = ref(50);
const visibleApps = computed(() => {
  return props.apps.slice(0, visibleCount.value);
});

const sentinel = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;

const createObserver = () => {
  if (observer) {
    observer.disconnect();
  }

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !props.loading) {
          loadMore();
        }
      });
    },
    {
      rootMargin: "200px", // 提前加载
      threshold: 0.1,
    },
  );

  if (sentinel.value) {
    observer.observe(sentinel.value);
  }
};

const loadMore = () => {
  if (visibleCount.value < props.apps.length) {
    visibleCount.value += 50; // 每次加载 50 个
  }
};

// 监听 loading 变化，重新初始化
watch(
  () => props.loading,
  (val) => {
    if (!val) {
      nextTick(() => {
        createObserver();
      });
    }
  },
);

// 监听 apps 变化，重置 visibleCount
watch(
  () => props.apps,
  () => {
    visibleCount.value = 50;
    // 如果当前不 loading，也尝试重新观察
    if (!props.loading) {
      nextTick(() => {
        createObserver();
      });
    }
  },
);

onMounted(() => {
  createObserver();
});

onUnmounted(() => {
  if (observer) {
    observer.disconnect();
  }
});
</script>
