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
      :isinstalled="currentAppIsInstalled" @close="closeDetail" @install="handleInstall" @remove="requestUninstallFromDetail"
      @open-preview="openScreenPreview" @open-app="openDownloadedApp" />

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

    <UninstallConfirmModal :show="showUninstallModal" :app="uninstallTargetApp" @close="closeUninstallModal"
      @success="onUninstallSuccess" />
  </div>
</template>

<script setup lang="ts">
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
import UninstallConfirmModal from './components/UninstallConfirmModal.vue';
import { APM_STORE_BASE_URL, currentApp, currentAppIsInstalled } from './global/storeConfig';
import { downloads, removeDownloadItem, watchDownloadsChange } from './global/downloadStatus';
import { handleInstall, handleRetry, handleUpgrade } from './modeuls/processInstall';
import type { App, AppJson, DownloadItem, UpdateAppItem, InstalledAppInfo, ChannelPayload } from './global/typedefinition';
import type { Ref } from 'vue';
const logger = pino();

// Axios 全局配置
const axiosInstance = axios.create({
  baseURL: APM_STORE_BASE_URL,
  timeout: 1000,
});

// 响应式状态
const isDarkTheme = ref(false);
const categories: Ref<Record<string, string>> = ref({});
const apps: Ref<App[]> = ref([]);
const activeCategory = ref('all');
const searchQuery = ref('');
const showModal = ref(false);
const showPreview = ref(false);
const currentScreenIndex = ref(0);
const screenshots = ref<string[]>([]);
const loading = ref(true);
const showDownloadDetailModal = ref(false);
const currentDownload: Ref<DownloadItem | null> = ref(null);
const showInstalledModal = ref(false);
const installedApps = ref<App[]>([]);
const installedLoading = ref(false);
const installedError = ref('');
const showUpdateModal = ref(false);
const upgradableApps = ref<(App & { selected: boolean; upgrading: boolean })[]>([]);
const updateLoading = ref(false);
const updateError = ref('');
const showUninstallModal = ref(false);
const uninstallTargetApp: Ref<App | null> = ref(null);

// 计算属性
const filteredApps = computed(() => {
  let result = [...apps.value];

  // 按分类筛选
  if (activeCategory.value !== 'all') {
    result = result.filter(app => app.category === activeCategory.value);
  }

  // 按搜索关键词筛选
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    result = result.filter(app => {
      // 兼容可能为 undefined 的情况，虽然类型定义是 string
      return ((app.name || '').toLowerCase().includes(q) ||
        (app.pkgname || '').toLowerCase().includes(q) ||
        (app.tags || '').toLowerCase().includes(q) ||
        (app.more || '').toLowerCase().includes(q));
    });
  }

  return result;
});

const categoryCounts = computed(() => {
  const counts: Record<string, number> = { all: apps.value.length };
  apps.value.forEach(app => {
    if (!counts[app.category]) counts[app.category] = 0;
    counts[app.category]++;
  });
  return counts;
});

const hasSelectedUpgrades = computed(() => {
  return upgradableApps.value.some(app => app.selected);
});

// 方法
const syncThemePreference = (enabled: boolean) => {
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

const selectCategory = (category: string) => {
  activeCategory.value = category;
};

const openDetail = (app: App) => {
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

const checkAppInstalled = (app: App) => {
  window.ipcRenderer.invoke('check-installed', app.pkgname).then((isInstalled: boolean) => {
    currentAppIsInstalled.value = isInstalled;
  });
};

const loadScreenshots = (app: App) => {
  screenshots.value = [];
  for (let i = 1; i <= 5; i++) {
    const screenshotUrl = `${APM_STORE_BASE_URL}/${window.apm_store.arch}/${app.category}/${app.pkgname}/screen_${i}.png`;
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

const openScreenPreview = (index: number) => {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    upgradableApps.value = (result.apps || []).map((app: any) => ({
      ...app,
      // Map properties if needed or assume main matches App interface except field names might differ
      // For now assuming result.apps returns objects compatible with App for core fields,
      // but let's normalize just in case if main returns different structure.
      name: app.name || app.Name || '',
      pkgname: app.pkgname || app.Pkgname || '',
      version: app.newVersion || app.version || '',
      category: app.category || 'unknown',
      selected: false,
      upgrading: false
    }));
  } catch (error: any) {
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

const upgradeSingleApp = (app: UpdateAppItem) => {
  if (!app?.pkgname) return;
  const target = apps.value.find(a => a.pkgname === app.pkgname);
  if (target) {
    handleUpgrade(target);
  } else {
    // If we can't find it in the list (e.g. category not loaded?), use the info we have
    // But handleUpgrade expects App. Let's try to construct minimal App
    let minimalApp: App = {
      name: app.pkgname,
      pkgname: app.pkgname,
      version: app.newVersion || '',
      category: 'unknown',
      tags: '',
      more: '',
      filename: '',
      torrent_address: '',
      author: '',
      contributor: '',
      website: '',
      update: '',
      size: '',
      img_urls: [],
      icons: '',
      currentStatus: 'installed'
    }
    handleUpgrade(minimalApp);
  }
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
     // eslint-disable-next-line @typescript-eslint/no-explicit-any
    installedApps.value = []
    for (const app of result.apps) {
      let appInfo = apps.value.find(a => a.pkgname === app.pkgname);
      if (appInfo) {
        appInfo.flags = app.flags;
        appInfo.arch = app.arch;
        appInfo.currentStatus = 'installed';
      } else {
        // 如果在当前应用列表中找不到该应用，创建一个最小的 App 对象
        appInfo = {
          name: app.name || app.pkgname,
          pkgname: app.pkgname,
          version: app.version,
          category: 'unknown',
          tags: '',
          more: '',
          filename: '',
          torrent_address: '',
          author: '',
          contributor: '',
          website: '',
          update: '',
          size: '',
          img_urls: [],
          icons: '',
          currentStatus: 'installed',
          arch: app.arch,
          flags: app.flags
        };
      }
      installedApps.value.push(appInfo);
    }
  } catch (error: any) {
    installedApps.value = [];
    installedError.value = error?.message || '读取已安装应用失败';
  } finally {
    installedLoading.value = false;
  }
};

const requestUninstall = (app: App) => {
  let target = null;
  target = apps.value.find(a => a.pkgname === app.pkgname) || app;

  if (target) {
    uninstallTargetApp.value = target as App;
    showUninstallModal.value = true;
    // TODO: 挪到卸载完成ipc回调里面
    removeDownloadItem(app.pkgname);
  }
};

const requestUninstallFromDetail = () => {
  if (currentApp.value) {
    requestUninstall(currentApp.value);
  }
};

const closeUninstallModal = () => {
  showUninstallModal.value = false;
  uninstallTargetApp.value = null;
};

const onUninstallSuccess = () => {
  // 刷新已安装列表（如果在显示）
  if (showInstalledModal.value) {
    refreshInstalledApps();
  }
  // 更新当前详情页状态（如果在显示）
  if (showModal.value && currentApp.value) {
    checkAppInstalled(currentApp.value);
  }
};

const installCompleteCallback = () => {
   if (currentApp.value) {
    checkAppInstalled(currentApp.value);
  }
}

watchDownloadsChange(installCompleteCallback);

const uninstallInstalledApp = (app: App) => {
  requestUninstall(app);
};

const openApmStoreUrl = (url: string, { fallbackText }: { fallbackText: string }) => {
  try {
    window.location.href = url;
  } catch (e) {
    showProtocolFallback(fallbackText);
  }
};

const showProtocolFallback = (cmd: string) => {
  const existing = document.getElementById('protocolFallbackBox');
  if (existing) existing.remove();

  const box = document.createElement('div');
  box.id = 'protocolFallbackBox';
  box.style.position = 'fixed';
  box.style.right = '18px';
  box.style.bottom = '18px';
  box.style.zIndex = '2000';
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

  document.getElementById('copyApmCmd')?.addEventListener('click', () => {
    navigator.clipboard?.writeText(cmd).then(() => {
      alert('命令已复制到剪贴板');
    }).catch(() => {
      prompt('请手动复制命令：', cmd);
    });
  });

  document.getElementById('dismissApmCmd')?.addEventListener('click', () => {
    box.remove();
  });

  // 自动消失
  setTimeout(() => {
    try { box.remove(); } catch (e) { }
  }, 30000);
};

const escapeHtml = (s: string) => {
  if (!s) return '';
  return s.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[c as '&' | '<' | '>' | '"' | "'"]);
};

// 目前 APM 商店不能暂停下载（因为 APM 本身不支持），但保留这些方法以备将来使用
const pauseDownload = (id: DownloadItem) => {
  const download = downloads.value.find(d => d.id === id.id);
  if (download && download.status === 'installing') { // 'installing' matches type definition, previously 'downloading'
    download.status = 'paused';
    download.logs.push({
      time: Date.now(),
      message: '下载已暂停'
    });
  }
};

// 同理
const resumeDownload = (id: DownloadItem) => {
  const download = downloads.value.find(d => d.id === id.id);
  if (download && download.status === 'paused') {
    download.status = 'installing'; // previously 'downloading'
    download.logs.push({
      time: Date.now(),
      message: '继续下载...'
    });
    // simulateDownload(download); // removed or undefined?
  }
};

// 同理
const cancelDownload = (id: DownloadItem) => {
  const index = downloads.value.findIndex(d => d.id === id.id);
  if (index !== -1) {
    const download = downloads.value[index];
    // download.status = 'cancelled'; // 'cancelled' not in DownloadItem type union? Check type
    download.status = 'failed'; // Use 'failed' or add 'cancelled' to type if needed. User asked to keep type simple.
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

const retryDownload = (id: DownloadItem) => {
  const download = downloads.value.find(d => d.id === id.id);
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

const showDownloadDetailModalFunc = (download: DownloadItem) => {
  currentDownload.value = download;
  showDownloadDetailModal.value = true;
};

const closeDownloadDetail = () => {
  showDownloadDetailModal.value = false;
  currentDownload.value = null;
};

const openDownloadedApp = (pkgname: string) => {
  // const encodedPkg = encodeURIComponent(download.pkgname);
  // openApmStoreUrl(`apmstore://launch?pkg=${encodedPkg}`, {
  //   fallbackText: `打开应用: ${download.pkgname}`
  // });
  window.ipcRenderer.invoke('launch-app', pkgname);
};

const loadCategories = async () => {
  try {
    const response = await axiosInstance.get(`/${window.apm_store.arch}/categories.json`);
    categories.value = response.data;
  } catch (error) {
    logger.error(`读取 categories.json 失败: ${error}`);
  }
};

const loadApps = async () => {
  loading.value = true;
  try {
    logger.info('开始加载应用数据...');
    const promises = Object.keys(categories.value).map(async category => {
      try {
        const response = await axiosInstance.get<AppJson[]>(`/${window.apm_store.arch}/${category}/applist.json`);
        return response.status === 200 ? response.data : [];
      } catch {
        return [];
      }
    });

    const results = await Promise.all(promises);

    apps.value = [];
    Object.keys(categories.value).forEach((category, index) => {
      const categoryApps = Array.isArray(results[index]) ? results[index] : [];
      categoryApps.forEach((appJson) => {
        // Convert AppJson to App here
        const normalizedApp: App = {
          name: appJson.Name,
          pkgname: appJson.Pkgname,
          version: appJson.Version,
          filename: appJson.Filename,
          torrent_address: appJson.Torrent_address,
          author: appJson.Author,
          contributor: appJson.Contributor,
          website: appJson.Website,
          update: appJson.Update,
          size: appJson.Size,
          more: appJson.More,
          tags: appJson.Tags,
          img_urls: typeof appJson.img_urls === 'string' ? JSON.parse(appJson.img_urls) : appJson.img_urls,
          icons: appJson.icons,
          category: category,
          currentStatus: 'not-installed',
        };
        apps.value.push(normalizedApp);
      });
    });
  } catch (error) {
    logger.error(`加载应用数据失败: ${error}`);
  } finally {
    loading.value = false;
  }
};

const handleSearchInput = (value: string) => {
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

  // Deep link Handlers
  window.ipcRenderer.on('deep-link-update', () => {
    if (loading.value) {
      const stop = watch(loading, (val) => {
        if (!val) {
          openUpdateModal();
          stop();
        }
      });
    } else {
      openUpdateModal();
    }
  });

  window.ipcRenderer.on('deep-link-installed', () => {
    if (loading.value) {
      const stop = watch(loading, (val) => {
        if (!val) {
          openInstalledModal();
          stop();
        }
      });
    } else {
      openInstalledModal();
    }
  });

  window.ipcRenderer.on('deep-link-install', (_event: Electron.IpcRendererEvent, pkgname: string) => {
    const tryOpen = () => {
      const target = apps.value.find(a => a.pkgname === pkgname);
      if (target) {
        openDetail(target);
      } else {
        logger.warn(`Deep link: app ${pkgname} not found`);
      }
    };

    if (loading.value) {
      const stop = watch(loading, (val) => {
        if (!val) {
          tryOpen();
          stop();
        }
      });
    } else {
      tryOpen();
    }
  });

  window.ipcRenderer.on('remove-complete', (_event: Electron.IpcRendererEvent, payload: ChannelPayload) => {
    const pkgname = currentApp.value?.pkgname
    if(payload.success && pkgname){
      removeDownloadItem(pkgname);
    }
  });


  window.ipcRenderer.send('renderer-ready', { status: true });
  logger.info('Renderer process is ready!');
});

// 观察器
watch(isDarkTheme, (newVal) => {
  localStorage.setItem('theme', newVal ? 'dark' : 'light');
  syncThemePreference(newVal);
});
</script>
