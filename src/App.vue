<template>
  <div
    class="flex min-h-screen flex-col bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100 lg:flex-row">
    <aside
      class="w-full border-b border-slate-200/70 bg-white/80 px-5 py-6 backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/70 lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-72 lg:flex-col lg:border-b-0 lg:border-r">
      <AppSidebar :categories="categories" :active-category="activeCategory" :category-counts="categoryCounts"
        :is-dark-theme="isDarkTheme" @toggle-theme="toggleTheme" @select-category="selectCategory" />
    </aside>

    <main class="flex-1 px-4 py-6 lg:px-10">
      <AppHeader :search-query="searchQuery" :apps-count="filteredApps.length" @update-search="handleSearchInput"
        @update="handleUpdate" @list="handleList" />
      <AppGrid :apps="filteredApps" :loading="loading" @open-detail="openDetail" />
    </main>

    <AppDetailModal data-app-modal="detail" :show="showModal" :app="currentApp" :screenshots="screenshots"
      :isinstalled="currentAppIsInstalled" @close="closeDetail" @install="handleInstall" @remove="handleRemove"
      @open-preview="openScreenPreview" />

    <ScreenPreview :show="showPreview" :screenshots="screenshots" :current-screen-index="currentScreenIndex"
      @close="closeScreenPreview" @prev="prevScreen" @next="nextScreen" />

    <DownloadQueue :downloads="downloads" @pause="pauseDownload" @resume="resumeDownload"
      @cancel="cancelDownload" @retry="retryDownload" @clear-completed="clearCompletedDownloads"
      @show-detail="showDownloadDetailModalFunc" />

    <DownloadDetail :show="showDownloadDetailModal" :download="currentDownload" @close="closeDownloadDetail"
      @pause="pauseDownload" @resume="resumeDownload" @cancel="cancelDownload" @retry="retryDownload"
      @open-app="openDownloadedApp" />

    <InstalledAppsModal :show="showInstalledModal" :apps="installedApps" :loading="installedLoading"
      :error="installedError" @close="closeInstalledModal" @refresh="refreshInstalledApps"
      @uninstall="uninstallInstalledApp" />

    <UpdateAppsModal :show="showUpdateModal" :apps="upgradableApps" :loading="updateLoading"
      :error="updateError" :has-selected="hasSelectedUpgrades" @close="closeUpdateModal"
      @refresh="refreshUpgradableApps" @toggle-all="toggleAllUpgrades"
      @upgrade-selected="upgradeSelectedApps" @upgrade-one="upgradeSingleApp" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import axios from 'axios';
import pino from 'pino';
import AppSidebar from './components/AppSidebar.vue';
import AppHeader from './components/AppHeader.vue';
import AppGrid from './components/AppGrid.vue';
import AppDetailModal from './components/AppDetailModal.vue';
import ScreenPreview from './components/ScreenPreview.vue';
import DownloadQueue from './components/DownloadQueue.vue';
import DownloadDetail from './components/DownloadDetail.vue';
import InstalledAppsModal from './components/InstalledAppsModal.vue';
import UpdateAppsModal from './components/UpdateAppsModal.vue';
import { APM_STORE_ARCHITECTURE, APM_STORE_BASE_URL, currentApp, currentAppIsInstalled } from './global/storeConfig';
import { downloads } from './global/downloadStatus';
import { handleInstall, handleRetry, handleRemove, handleUpgrade } from './modeuls/processInstall';

const logger = pino();

// Axios 全局配置
const axiosInstance = axios.create({
  baseURL: APM_STORE_BASE_URL,
  timeout: 1000,
});

// 响应式状态
const isDarkTheme = ref(false);
const categories = ref({});
const apps = ref([]);
const activeCategory = ref('all');
const searchQuery = ref('');
const showModal = ref(false);
const showPreview = ref(false);
const currentScreenIndex = ref(0);
const screenshots = ref([]);
const loading = ref(true);
const showDownloadDetailModal = ref(false);
const currentDownload = ref(null);
const showInstalledModal = ref(false);
const installedApps = ref([]);
const installedLoading = ref(false);
const installedError = ref('');
const showUpdateModal = ref(false);
const upgradableApps = ref([]);
const updateLoading = ref(false);
const updateError = ref('');

// 计算属性
const filteredApps = computed(() => {
  let result = [...apps.value];

  // 按分类筛选
  if (activeCategory.value !== 'all') {
    result = result.filter(app => app._category === activeCategory.value);
  }

  // 按搜索关键词筛选
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    result = result.filter(app => {
      return (app.Name?.toLowerCase().includes(q) ||
        app.Pkgname?.toLowerCase().includes(q) ||
        app.Tags?.toLowerCase().includes(q) ||
        app.More?.toLowerCase().includes(q));
    });
  }

  return result;
});

const categoryCounts = computed(() => {
  const counts = { all: apps.value.length };
  apps.value.forEach(app => {
    if (!counts[app._category]) counts[app._category] = 0;
    counts[app._category]++;
  });
  return counts;
});

const hasSelectedUpgrades = computed(() => {
  return upgradableApps.value.some(app => app.selected);
});

// 方法
const syncThemePreference = (enabled) => {
  document.documentElement.classList.toggle('dark', enabled);
};

const initTheme = () => {
  const savedTheme = localStorage.getItem('theme');
  isDarkTheme.value = savedTheme === 'dark';
  syncThemePreference(isDarkTheme.value);
};

const toggleTheme = () => {
  isDarkTheme.value = !isDarkTheme.value;
};

const selectCategory = (category) => {
  activeCategory.value = category;
};

const openDetail = (app) => {
  currentApp.value = app;
  currentScreenIndex.value = 0;
  loadScreenshots(app);
  showModal.value = true;

  // 检测本地是否已经安装了该应用
  currentAppIsInstalled.value = false;
  checkAppInstalled(app);

  // 确保模态框显示后滚动到顶部
  nextTick(() => {
    const modal = document.querySelector('[data-app-modal="detail"] .modal-panel');
    if (modal) modal.scrollTop = 0;
  });
};

const checkAppInstalled = (app) => { 
  window.ipcRenderer.invoke('check-installed', app.Pkgname).then((isInstalled) => {
    currentAppIsInstalled.value = isInstalled;
  });
};

const loadScreenshots = (app) => {
  screenshots.value = [];
  for (let i = 1; i <= 5; i++) {
    const screenshotUrl = `${APM_STORE_BASE_URL}/${APM_STORE_ARCHITECTURE}/${app._category}/${app.Pkgname}/screen_${i}.png`;
    const img = new Image();
    img.src = screenshotUrl;
    img.onload = () => {
      screenshots.value.push(screenshotUrl);
    };
  }
};

const closeDetail = () => {
  showModal.value = false;
  currentApp.value = null;
};

const openScreenPreview = (index) => {
  currentScreenIndex.value = index;
  showPreview.value = true;
};

const closeScreenPreview = () => {
  showPreview.value = false;
};

const prevScreen = () => {
  if (currentScreenIndex.value > 0) {
    currentScreenIndex.value--;
  }
};

const nextScreen = () => {
  if (currentScreenIndex.value < screenshots.value.length - 1) {
    currentScreenIndex.value++;
  }
};

const handleUpdate = () => {
  openUpdateModal();
};

const handleList = () => {
  openInstalledModal();
};

const openUpdateModal = () => {
  showUpdateModal.value = true;
  refreshUpgradableApps();
};

const closeUpdateModal = () => {
  showUpdateModal.value = false;
};

const refreshUpgradableApps = async () => {
  updateLoading.value = true;
  updateError.value = '';
  try {
    const result = await window.ipcRenderer.invoke('list-upgradable');
    if (!result?.success) {
      upgradableApps.value = [];
      updateError.value = result?.message || '检查更新失败';
      return;
    }
    upgradableApps.value = (result.apps || []).map(app => ({
      ...app,
      selected: false,
      upgrading: false
    }));
  } catch (error) {
    upgradableApps.value = [];
    updateError.value = error?.message || '检查更新失败';
  } finally {
    updateLoading.value = false;
  }
};

const toggleAllUpgrades = () => {
  const shouldSelectAll = !hasSelectedUpgrades.value || upgradableApps.value.some(app => !app.selected);
  upgradableApps.value = upgradableApps.value.map(app => ({
    ...app,
    selected: shouldSelectAll ? true : false
  }));
};

const upgradeSingleApp = (app) => {
  if (!app?.pkgname) return;
  handleUpgrade(app.pkgname, app.newVersion || '');
};

const upgradeSelectedApps = () => {
  const selectedApps = upgradableApps.value.filter(app => app.selected);
  selectedApps.forEach(app => {
    upgradeSingleApp(app);
  });
};

const openInstalledModal = () => {
  showInstalledModal.value = true;
  refreshInstalledApps();
};

const closeInstalledModal = () => {
  showInstalledModal.value = false;
};

const refreshInstalledApps = async () => {
  installedLoading.value = true;
  installedError.value = '';
  try {
    const result = await window.ipcRenderer.invoke('list-installed');
    if (!result?.success) {
      installedApps.value = [];
      installedError.value = result?.message || '读取已安装应用失败';
      return;
    }
    installedApps.value = (result.apps || []).map((app) => ({
      ...app,
      removing: false
    }));
  } catch (error) {
    installedApps.value = [];
    installedError.value = error?.message || '读取已安装应用失败';
  } finally {
    installedLoading.value = false;
  }
};

const uninstallInstalledApp = async (app) => {
  if (!app?.pkgname) return;
  const target = installedApps.value.find(item => item.pkgname === app.pkgname);
  if (target) target.removing = true;
  try {
    const result = await window.ipcRenderer.invoke('uninstall-installed', app.pkgname);
    if (!result?.success) {
      installedError.value = result?.message || '卸载失败';
    } else {
      installedApps.value = installedApps.value.filter(item => item.pkgname !== app.pkgname);
    }
  } catch (error) {
    installedError.value = error?.message || '卸载失败';
  } finally {
    const restore = installedApps.value.find(item => item.pkgname === app.pkgname);
    if (restore) restore.removing = false;
  }
};

const openApmStoreUrl = (url, { fallbackText } = {}) => {
  try {
    window.location.href = url;
  } catch (e) {
    showProtocolFallback(fallbackText);
  }
};

const showProtocolFallback = (cmd) => {
  const existing = document.getElementById('protocolFallbackBox');
  if (existing) existing.remove();

  const box = document.createElement('div');
  box.id = 'protocolFallbackBox';
  box.style.position = 'fixed';
  box.style.right = '18px';
  box.style.bottom = '18px';
  box.style.zIndex = 2000;
  box.style.boxShadow = 'var(--shadow)';
  box.style.background = 'var(--card)';
  box.style.borderRadius = '12px';
  box.style.padding = '12px';
  box.style.maxWidth = '420px';
  box.style.fontSize = '13px';
  box.innerHTML = `
    <div style="font-weight:600;margin-bottom:6px;">无法直接启动本地应用？</div>
    <div style="color:var(--muted);margin-bottom:8px;">请在终端执行下列命令，或检查系统是否已将 <code>apmstore://</code> 协议关联到 APM 处理程序。</div>
    <div style="display:flex;gap:8px;align-items:center;">
      <code style="padding:6px 8px;border-radius:8px;background:var(--glass);flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(cmd)}</code>
      <button id="copyApmCmd" class="action-btn secondary" title="复制命令">复制</button>
      <button id="dismissApmCmd" class="action-btn" title="关闭">关闭</button>
    </div>
  `;
  document.body.appendChild(box);

  document.getElementById('copyApmCmd').addEventListener('click', () => {
    navigator.clipboard?.writeText(cmd).then(() => {
      alert('命令已复制到剪贴板');
    }).catch(() => {
      prompt('请手动复制命令：', cmd);
    });
  });

  document.getElementById('dismissApmCmd').addEventListener('click', () => {
    box.remove();
  });

  // 自动消失
  setTimeout(() => {
    try { box.remove(); } catch (e) { }
  }, 30000);
};

const escapeHtml = (s) => {
  if (!s) return '';
  return s.replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[c]);
};

// 目前 APM 商店不能暂停下载（因为 APM 本身不支持），但保留这些方法以备将来使用
const pauseDownload = (id) => {
  const download = downloads.value.find(d => d.id === id);
  if (download && download.status === 'downloading') {
    download.status = 'paused';
    download.logs.push({
      time: Date.now(),
      message: '下载已暂停'
    });
  }
};

// 同理
const resumeDownload = (id) => {
  const download = downloads.value.find(d => d.id === id);
  if (download && download.status === 'paused') {
    download.status = 'downloading';
    download.logs.push({
      time: Date.now(),
      message: '继续下载...'
    });
    simulateDownload(download);
  }
};

// 同理
const cancelDownload = (id) => {
  const index = downloads.value.findIndex(d => d.id === id);
  if (index !== -1) {
    const download = downloads.value[index];
    download.status = 'cancelled';
    download.logs.push({
      time: Date.now(),
      message: '下载已取消'
    });
    // 延迟删除，让用户看到取消状态
    setTimeout(() => {
      logger.info(`删除下载: ${download.pkgname}`);
      downloads.value.splice(index, 1);
    }, 1000);
  }
};

const retryDownload = (id) => {
  const download = downloads.value.find(d => d.id === id);
  if (download && download.status === 'failed') {
    download.status = 'queued';
    download.progress = 0;
    download.downloadedSize = 0;
    download.logs.push({
      time: Date.now(),
      message: '重新开始下载...'
    });
    handleRetry(download);
  }
};

const clearCompletedDownloads = () => {
  downloads.value = downloads.value.filter(d => d.status !== 'completed');
};

const showDownloadDetailModalFunc = (download) => {
  currentDownload.value = download;
  showDownloadDetailModal.value = true;
};

const closeDownloadDetail = () => {
  showDownloadDetailModal.value = false;
  currentDownload.value = null;
};

const openDownloadedApp = (download) => {
  const encodedPkg = encodeURIComponent(download.pkgname);
  openApmStoreUrl(`apmstore://launch?pkg=${encodedPkg}`, {
    fallbackText: `打开应用: ${download.pkgname}`
  });
};

const loadCategories = async () => {
  try {
    const response = await axiosInstance.get(`/${APM_STORE_ARCHITECTURE}/categories.json`);
    categories.value = response.data;
  } catch (error) {
    logger.error('读取 categories.json 失败', error);
  }
};

const loadApps = async () => {
  loading.value = true;
  try {
    logger.info('开始加载应用数据...');
    const promises = Object.keys(categories.value).map(async category => {
      try {
        const response = await axiosInstance.get(`/${APM_STORE_ARCHITECTURE}/${category}/applist.json`);
        return response.status === 200 ? response.data : [];
      } catch {
        return [];
      }
    });

    const results = await Promise.all(promises);

    apps.value = [];
    Object.keys(categories.value).forEach((category, index) => {
      const categoryApps = Array.isArray(results[index]) ? results[index] : [];
      categoryApps.forEach(app => {
        app._category = category;
        apps.value.push(app);
      });
    });
  } catch (error) {
    logger.error('加载应用数据失败', error);
  } finally {
    loading.value = false;
  }
};

const handleSearchInput = (value) => {
  searchQuery.value = value;
};

// 生命周期钩子
onMounted(async () => {
  initTheme();

  await loadCategories();
  await loadApps();

  // 设置键盘导航
  document.addEventListener('keydown', (e) => {
    if (showPreview.value) {
      if (e.key === 'Escape') closeScreenPreview();
      if (e.key === 'ArrowLeft') prevScreen();
      if (e.key === 'ArrowRight') nextScreen();
    }
    if (showModal.value && e.key === 'Escape') {
      closeDetail();
    }
  });
});

// 观察器
watch(isDarkTheme, (newVal) => {
  localStorage.setItem('theme', newVal ? 'dark' : 'light');
  syncThemePreference(newVal);
});
</script>