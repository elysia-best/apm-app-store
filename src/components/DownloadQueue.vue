<template>
  <div class="download-queue" :class="{ 'expanded': isExpanded }">
    <!-- 队列头部 -->
    <div class="queue-header" @click="toggleExpand">
      <div class="queue-info">
        <i class="fas fa-download"></i>
        <span class="queue-title">下载队列</span>
        <span class="queue-count" v-if="downloads.length > 0">({{ activeDownloads }}/{{ downloads.length }})</span>
      </div>
      <div class="queue-actions">
        <button v-if="downloads.length > 0" @click.stop="clearCompleted" class="clear-btn" title="清除已完成">
          <i class="fas fa-broom"></i>
        </button>
        <button @click.stop="toggleExpand" class="expand-btn">
          <i class="fas" :class="isExpanded ? 'fa-chevron-down' : 'fa-chevron-up'"></i>
        </button>
      </div>
    </div>

    <!-- 队列列表 -->
    <transition name="slide">
      <div v-show="isExpanded" class="queue-list">
        <div v-if="downloads.length === 0" class="empty-state">
          <i class="fas fa-inbox"></i>
          <p>暂无下载任务</p>
        </div>
        <div v-else class="download-items">
          <div
            v-for="download in downloads"
            :key="download.id"
            class="download-item"
            :class="download.status"
            @click="showDownloadDetail(download)"
          >
            <div class="download-icon">
              <img :src="download.icon" :alt="download.name" />
            </div>
            <div class="download-info">
              <div class="download-name">{{ download.name }}</div>
              <div class="download-status-text">
                <span v-if="download.status === 'downloading'">
                  下载中 {{ download.progress }}%
                </span>
                <span v-else-if="download.status === 'installing'">
                  安装中...
                </span>
                <span v-else-if="download.status === 'completed'">
                  已完成
                </span>
                <span v-else-if="download.status === 'failed'">
                  失败: {{ download.error }}
                </span>
                <span v-else-if="download.status === 'paused'">
                  已暂停
                </span>
                <span v-else>
                  等待中...
                </span>
              </div>
              <div v-if="download.status === 'downloading'" class="progress-bar">
                <div class="progress-fill" :style="{ width: download.progress + '%' }"></div>
              </div>
            </div>
            <div class="download-actions">
              <button
                v-if="download.status === 'downloading'"
                @click.stop="pauseDownload(download.id)"
                class="action-icon"
                title="暂停"
              >
                <i class="fas fa-pause"></i>
              </button>
              <button
                v-else-if="download.status === 'paused'"
                @click.stop="resumeDownload(download.id)"
                class="action-icon"
                title="继续"
              >
                <i class="fas fa-play"></i>
              </button>
              <button
                v-if="download.status === 'failed'"
                @click.stop="retryDownload(download.id)"
                class="action-icon"
                title="重试"
              >
                <i class="fas fa-redo"></i>
              </button>
              <button
                @click.stop="cancelDownload(download.id)"
                class="action-icon"
                title="取消"
              >
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue';

const props = defineProps({
  downloads: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits([
  'pause',
  'resume',
  'cancel',
  'retry',
  'clear-completed',
  'show-detail'
]);

const isExpanded = ref(true);

const activeDownloads = computed(() => {
  return props.downloads.filter(d => 
    d.status === 'downloading' || d.status === 'installing'
  ).length;
});

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;
};

const pauseDownload = (id) => {
  emit('pause', id);
};

const resumeDownload = (id) => {
  emit('resume', id);
};

const cancelDownload = (id) => {
  emit('cancel', id);
};

const retryDownload = (id) => {
  emit('retry', id);
};

const clearCompleted = () => {
  emit('clear-completed');
};

const showDownloadDetail = (download) => {
  emit('show-detail', download);
};
</script>

<style scoped>
.download-queue {
  position: fixed;
  bottom: 0;
  right: 20px;
  width: 400px;
  max-height: 500px;
  background: var(--card);
  border-radius: 12px 12px 0 0;
  box-shadow: var(--shadow);
  z-index: 1000;
  transition: all 0.3s ease;
}

.download-queue:not(.expanded) {
  max-height: 60px;
}

.queue-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  cursor: pointer;
  border-bottom: 1px solid var(--border);
  user-select: none;
}

.queue-header:hover {
  background: var(--glass);
}

.queue-info {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
}

.queue-info i {
  color: var(--primary);
}

.queue-count {
  color: var(--muted);
  font-size: 14px;
}

.queue-actions {
  display: flex;
  gap: 8px;
}

.clear-btn,
.expand-btn {
  background: transparent;
  border: none;
  padding: 6px 10px;
  cursor: pointer;
  border-radius: 6px;
  color: var(--text);
  transition: all 0.2s;
}

.clear-btn:hover,
.expand-btn:hover {
  background: var(--glass);
}

.queue-list {
  max-height: 440px;
  overflow-y: auto;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: var(--muted);
}

.empty-state i {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.download-items {
  padding: 8px 0;
}

.download-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  cursor: pointer;
  transition: background 0.2s;
}

.download-item:hover {
  background: var(--glass);
}

.download-item.completed {
  opacity: 0.7;
}

.download-item.failed {
  background: rgba(255, 59, 48, 0.1);
}

.download-icon {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
}

.download-icon img {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  object-fit: cover;
}

.download-info {
  flex: 1;
  min-width: 0;
}

.download-name {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.download-status-text {
  font-size: 13px;
  color: var(--muted);
  margin-bottom: 6px;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: var(--glass);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--primary);
  transition: width 0.3s ease;
}

.download-actions {
  display: flex;
  gap: 4px;
}

.action-icon {
  background: transparent;
  border: none;
  padding: 8px;
  cursor: pointer;
  border-radius: 6px;
  color: var(--text);
  transition: all 0.2s;
}

.action-icon:hover {
  background: var(--glass);
  color: var(--primary);
}

@media (max-width: 768px) {
  .download-queue {
    right: 10px;
    width: calc(100% - 20px);
    max-width: 400px;
  }
}
</style>
