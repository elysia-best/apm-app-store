<template>
  <transition name="modal-fade">
    <div v-if="show" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-content download-detail" @click.stop>
        <!-- 头部 -->
        <div class="detail-header">
          <button class="close-btn" @click="close">
            <i class="fas fa-times"></i>
          </button>
          <h2>下载详情</h2>
        </div>

        <!-- 内容 -->
        <div class="detail-body" v-if="download">
          <!-- 应用信息 -->
          <div class="app-section">
            <div class="app-icon-large">
              <img :src="download.icon" :alt="download.name" />
            </div>
            <div class="app-info-detail">
              <h3 class="app-name">{{ download.name }}</h3>
              <div class="app-meta">
                <span>{{ download.pkgname }}</span>
                <span class="separator">·</span>
                <span>{{ download.version }}</span>
              </div>
            </div>
          </div>

          <!-- 下载状态 -->
          <div class="status-section">
            <div class="status-header">
              <span class="status-label">状态</span>
              <span class="status-value" :class="download.status">
                {{ getStatusText(download.status) }}
              </span>
            </div>
            
            <!-- 进度条 -->
            <div v-if="download.status === 'downloading'" class="progress-section">
              <div class="progress-bar-large">
                <div class="progress-fill" :style="{ width: download.progress + '%' }"></div>
              </div>
              <div class="progress-info">
                <span>{{ download.progress }}%</span>
                <span v-if="download.downloadedSize && download.totalSize">
                  {{ formatSize(download.downloadedSize) }} / {{ formatSize(download.totalSize) }}
                </span>
              </div>
              <div v-if="download.speed" class="download-speed">
                <i class="fas fa-tachometer-alt"></i>
                <span>{{ formatSpeed(download.speed) }}</span>
                <span v-if="download.timeRemaining" class="time-remaining">
                  剩余 {{ formatTime(download.timeRemaining) }}
                </span>
              </div>
            </div>
          </div>

          <!-- 下载信息 -->
          <div class="info-section">
            <div class="info-item">
              <span class="info-label">下载源</span>
              <span class="info-value">{{ download.source || 'APM Store' }}</span>
            </div>
            <div class="info-item" v-if="download.startTime">
              <span class="info-label">开始时间</span>
              <span class="info-value">{{ formatDate(download.startTime) }}</span>
            </div>
            <div class="info-item" v-if="download.endTime">
              <span class="info-label">完成时间</span>
              <span class="info-value">{{ formatDate(download.endTime) }}</span>
            </div>
            <div class="info-item" v-if="download.error">
              <span class="info-label">错误信息</span>
              <span class="info-value error">{{ download.error }}</span>
            </div>
          </div>

          <!-- 日志 -->
          <div v-if="download.logs && download.logs.length > 0" class="logs-section">
            <div class="logs-header">
              <span>下载日志</span>
              <button @click="copyLogs" class="copy-logs-btn">
                <i class="fas fa-copy"></i>
                复制日志
              </button>
            </div>
            <div class="logs-content">
              <div v-for="(log, index) in download.logs" :key="index" class="log-entry">
                <span class="log-time">{{ formatLogTime(log.time) }}</span>
                <span class="log-message">{{ log.message }}</span>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="actions-section">
            <button
              v-if="download.status === 'downloading'"
              @click="pause"
              class="action-btn secondary"
            >
              <i class="fas fa-pause"></i>
              暂停下载
            </button>
            <button
              v-else-if="download.status === 'paused'"
              @click="resume"
              class="action-btn primary"
            >
              <i class="fas fa-play"></i>
              继续下载
            </button>
            <button
              v-if="download.status === 'failed'"
              @click="retry"
              class="action-btn primary"
            >
              <i class="fas fa-redo"></i>
              重试下载
            </button>
            <button
              v-if="download.status !== 'completed'"
              @click="cancel"
              class="action-btn danger"
            >
              <i class="fas fa-times"></i>
              取消下载
            </button>
            <button
              v-if="download.status === 'completed'"
              @click="openApp"
              class="action-btn primary"
            >
              <i class="fas fa-external-link-alt"></i>
              打开应用
            </button>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  download: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['close', 'pause', 'resume', 'cancel', 'retry', 'open-app']);

const close = () => {
  emit('close');
};

const handleOverlayClick = () => {
  close();
};

const pause = () => {
  emit('pause', props.download.id);
};

const resume = () => {
  emit('resume', props.download.id);
};

const cancel = () => {
  emit('cancel', props.download.id);
};

const retry = () => {
  emit('retry', props.download.id);
};

const openApp = () => {
  emit('open-app', props.download);
};

const getStatusText = (status) => {
  const statusMap = {
    'pending': '等待中',
    'downloading': '下载中',
    'installing': '安装中',
    'completed': '已完成',
    'failed': '失败',
    'paused': '已暂停',
    'cancelled': '已取消'
  };
  return statusMap[status] || status;
};

const formatSize = (bytes) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + units[i];
};

const formatSpeed = (bytesPerSecond) => {
  return formatSize(bytesPerSecond) + '/s';
};

const formatTime = (seconds) => {
  if (seconds < 60) return `${seconds}秒`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟`;
  return `${Math.floor(seconds / 3600)}小时${Math.floor((seconds % 3600) / 60)}分钟`;
};

const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN');
};

const formatLogTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN');
};

const copyLogs = () => {
  if (!props.download?.logs) return;
  const logsText = props.download.logs
    .map(log => `[${formatLogTime(log.time)}] ${log.message}`)
    .join('\n');
  navigator.clipboard?.writeText(logsText).then(() => {
    alert('日志已复制到剪贴板');
  }).catch(() => {
    prompt('请手动复制日志：', logsText);
  });
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.modal-content {
  background: var(--card);
  border-radius: 16px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.detail-header {
  padding: 24px;
  border-bottom: 1px solid var(--border);
  position: relative;
}

.detail-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.close-btn {
  position: absolute;
  top: 24px;
  right: 24px;
  background: transparent;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: var(--muted);
  padding: 4px;
  transition: color 0.2s;
}

.close-btn:hover {
  color: var(--text);
}

.detail-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.app-section {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border);
}

.app-icon-large {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
}

.app-icon-large img {
  width: 100%;
  height: 100%;
  border-radius: 16px;
  object-fit: cover;
}

.app-info-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.app-name {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
}

.app-meta {
  color: var(--muted);
  font-size: 14px;
}

.separator {
  margin: 0 8px;
}

.status-section {
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border);
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.status-label {
  font-weight: 600;
  color: var(--muted);
}

.status-value {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
}

.status-value.downloading {
  background: rgba(0, 122, 255, 0.1);
  color: #007AFF;
}

.status-value.completed {
  background: rgba(52, 199, 89, 0.1);
  color: #34C759;
}

.status-value.failed {
  background: rgba(255, 59, 48, 0.1);
  color: #FF3B30;
}

.status-value.paused {
  background: rgba(255, 149, 0, 0.1);
  color: #FF9500;
}

.progress-section {
  margin-top: 16px;
}

.progress-bar-large {
  width: 100%;
  height: 8px;
  background: var(--glass);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: var(--primary);
  transition: width 0.3s ease;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: var(--muted);
  margin-bottom: 8px;
}

.download-speed {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text);
}

.download-speed i {
  color: var(--primary);
}

.time-remaining {
  margin-left: auto;
  color: var(--muted);
}

.info-section {
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border);
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
}

.info-label {
  color: var(--muted);
  font-weight: 500;
}

.info-value {
  text-align: right;
  max-width: 60%;
  word-break: break-word;
}

.info-value.error {
  color: #FF3B30;
}

.logs-section {
  margin-bottom: 24px;
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-weight: 600;
}

.copy-logs-btn {
  background: transparent;
  border: 1px solid var(--border);
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.copy-logs-btn:hover {
  background: var(--glass);
  border-color: var(--primary);
  color: var(--primary);
}

.logs-content {
  background: var(--glass);
  border-radius: 8px;
  padding: 12px;
  max-height: 200px;
  overflow-y: auto;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
}

.log-entry {
  display: flex;
  gap: 12px;
  padding: 4px 0;
  color: var(--text);
}

.log-time {
  color: var(--muted);
  flex-shrink: 0;
}

.log-message {
  flex: 1;
}

.actions-section {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.action-btn {
  flex: 1;
  min-width: 140px;
  padding: 12px 20px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
}

.action-btn.primary {
  background: var(--primary);
  color: white;
}

.action-btn.primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.action-btn.secondary {
  background: var(--glass);
  color: var(--text);
}

.action-btn.secondary:hover {
  background: var(--border);
}

.action-btn.danger {
  background: rgba(255, 59, 48, 0.1);
  color: #FF3B30;
}

.action-btn.danger:hover {
  background: rgba(255, 59, 48, 0.2);
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-active .modal-content,
.modal-fade-leave-active .modal-content {
  transition: transform 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .modal-content,
.modal-fade-leave-to .modal-content {
  transform: scale(0.9);
}
</style>
