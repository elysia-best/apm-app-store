<template>
  <div class="brand">APM x86客户端商店</div>
  <ThemeToggle :is-dark="isDarkTheme" @toggle="toggleTheme" />
  <div class="categories">
    <div class="category" :class="{ 'active': activeCategory === 'all' }" @click="selectCategory('all')">
      <div>全部应用</div>
      <div class="count">{{ categoryCounts.all || 0 }}</div>
    </div>
    <div v-for="(category, key) in categories" :key="key" class="category" :class="{ 'active': activeCategory === key }"
      @click="selectCategory(key)">
      <div>{{ category.zh }} <span class="muted">({{ category.en }})</span></div>
      <div class="count">{{ categoryCounts[key] || 0 }}</div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';
import ThemeToggle from './ThemeToggle.vue';

const props = defineProps({
  categories: {
    type: Object,
    required: true
  },
  activeCategory: {
    type: String,
    required: true
  },
  categoryCounts: {
    type: Object,
    required: true
  },
  isDarkTheme: {
    type: Boolean,
    required: true
  }
});

const emit = defineEmits(['toggle-theme', 'select-category']);

const toggleTheme = () => {
  emit('toggle-theme');
};

const selectCategory = (category) => {
  emit('select-category', category);
};
</script>

<style scoped>
/* 该组件样式已在全局样式中定义 */
</style>
