<template>
  <div class="grid" v-if="!loading">
    <AppCard 
      v-for="(app, index) in apps" 
      :key="index"
      :app="app"
      @open-detail="$emit('open-detail', app)"
    />
  </div>
  <div v-else class="loading">
    <div class="grid">
      <div v-for="n in 8" :key="n" class="card loading">
        <div class="icon"></div>
        <div class="meta">
          <div class="title">加载中...</div>
          <div class="muted">正在获取应用数据</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';
import AppCard from './AppCard.vue';

defineProps({
  apps: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    required: true
  }
});

defineEmits(['open-detail']);
</script>

<style scoped>
/* 该组件样式已在全局样式中定义 */
</style>
