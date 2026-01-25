<template>
  <div class="modal-backdrop" :style="{ display: show ? 'flex' : 'none' }" role="dialog" aria-hidden="false">
    <div class="modal">
      <div class="modal-header">
        <div class="modal-icon-title" v-if="app">
          <div class="modal-icon">
            <img 
              :src="iconPath" 
              alt="icon" 
            />
          </div>
          <div class="modal-title-section">
            <div class="modal-title">{{ app.Name || '' }}</div>
            <div class="modal-subtitle">{{ app.Pkgname || '' }} · {{ app.Version || '' }}</div>
          </div>
        </div>
        <div class="modal-actions">
          <button class="install-btn" @click="handleInstall">
            <i class="fas fa-download"></i> 安装
          </button>
          <button class="close-modal" @click="closeModal" aria-label="关闭">×</button>
        </div>
      </div>
      
      <div class="apm-note">
        首次安装APM后需要重启系统以在启动器中看到应用入口。可前往 
        <a href="https://gitee.com/amber-ce/amber-pm/releases" target="_blank">APM Releases</a> 获取 APM。
      </div>
      
      <div class="screens">
        <img 
          v-for="(screen, index) in screenshots" 
          :key="index" 
          :src="screen" 
          alt="screenshot"
          @click="openPreview(index)"
          @error="e => e.target.style.display = 'none'"
        >
      </div>
      
      <div class="info">
        <div class="info-item" v-if="app?.Author">
          <div class="info-label">作者</div>
          <div class="info-value">{{ app.Author }}</div>
        </div>
        <div class="info-item" v-if="app?.Contributor">
          <div class="info-label">贡献者</div>
          <div class="info-value">{{ app.Contributor }}</div>
        </div>
        <div class="info-item" v-if="app?.Size">
          <div class="info-label">大小</div>
          <div class="info-value">{{ app.Size }}</div>
        </div>
        <div class="info-item" v-if="app?.Update">
          <div class="info-label">更新时间</div>
          <div class="info-value">{{ app.Update }}</div>
        </div>
        <div class="info-item" v-if="app?.Website">
          <div class="info-label">网站</div>
          <div class="info-value">
            <a :href="app.Website" target="_blank">{{ app.Website }}</a>
          </div>
        </div>
        <div class="info-item" v-if="app?.Version">
          <div class="info-label">版本</div>
          <div class="info-value">{{ app.Version }}</div>
        </div>
        <div class="info-item" v-if="app?.Tags">
          <div class="info-label">标签</div>
          <div class="info-value">{{ app.Tags }}</div>
        </div>
      </div>
      
      <div class="more-details" v-if="app?.More && app.More.trim() !== ''">
        <div class="more-details-title">应用详情</div>
        <div class="more-details-content" v-html="app.More.replace(/\n/g, '<br>')"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, defineProps, defineEmits } from 'vue';
import { APM_STORE_ARCHITECTURE, APM_STORE_BASE_URL } from '../global/storeConfig';

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  app: {
    type: Object,
    default: null
  },
  screenshots: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['close', 'install', 'open-preview']);

const iconPath = computed(() => {
  return props.app ? `${APM_STORE_BASE_URL}/${APM_STORE_ARCHITECTURE}/${props.app._category}/${props.app.Pkgname}/icon.png` : '';
});

const closeModal = () => {
  emit('close');
};

const handleInstall = () => {
  emit('install');
};

const openPreview = (index) => {
  emit('open-preview', index);
};
</script>

<style scoped>
/* 该组件样式已在全局样式中定义 */
</style>
