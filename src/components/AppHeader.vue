<template>
  <div class="topbar">
    <TopActions @update="$emit('update')" @list="$emit('list')" />
    <div class="search">
      <input 
        id="searchBox" 
        placeholder="搜索应用名 / 包名 / 标签（回车或自动）"
        @input="debounceSearch"
        v-model="localSearchQuery"
      />
    </div>
    <div class="stats" id="currentCount">
      共 {{ appsCount }} 个应用 · 在任何主流Linux发行上安装应用
    </div>
  </div>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits } from 'vue';
import TopActions from './TopActions.vue';

const props = defineProps({
  searchQuery: {
    type: String,
    required: true
  },
  appsCount: {
    type: Number,
    required: true
  }
});

const emit = defineEmits(['update-search', 'update', 'list']);

const localSearchQuery = ref(props.searchQuery || '');
const timeoutId = ref(null);

const debounceSearch = (e) => {
  clearTimeout(timeoutId.value);
  timeoutId.value = setTimeout(() => {
    emit('update-search', e);
  }, 220);
};

watch(() => props.searchQuery, (newVal) => {
  localSearchQuery.value = newVal || '';
});
</script>

<style scoped>
/* 该组件样式已在全局样式中定义 */
</style>
