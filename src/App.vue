<template>
  <div
    class="flex min-h-screen flex-col bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100 lg:flex-row"
  >
    <!-- 移动端侧边栏遮罩 -->
    <div
      v-if="isSidebarOpen"
      class="fixed inset-0 z-40 bg-black/50 lg:hidden"
      @click="isSidebarOpen = false"
    ></div>

    <aside
      class="fixed inset-y-0 left-0 z-50 w-72 transform border-r border-slate-200/70 bg-white/95 px-5 py-6 transition-transform duration-300 ease-in-out dark:border-slate-800/70 dark:bg-slate-900 lg:sticky lg:top-0 lg:flex lg:h-screen lg:translate-x-0 lg:flex-col lg:border-b-0"
      :class="
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      "
    >
      <AppSidebar
        :categories="categories"
        :active-category="activeCategory"
        :category-counts="categoryCounts"
        :theme-mode="themeMode"
        @toggle-theme="toggleTheme"
        @select-category="selectCategory"
        @close="isSidebarOpen = false"
      />
    </aside>

    <main class="flex-1 px-4 py-6 lg:px-10">
      <AppHeader
        :search-query="searchQuery"
        :active-category="activeCategory"
        :apps-count="filteredApps.length"
        @update-search="handleSearchInput"
        @update="handleUpdate"
        @list="handleList"
        @toggle-sidebar="isSidebarOpen = !isSidebarOpen"
      />
      <AppGrid :apps="pagedApps" :loading="loading" @open-detail="openDetail" />

      <!-- 分页控制 -->
      <div
        v-if="!loading && totalPages > 1"
        class="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
      >
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-30 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
            :disabled="currentPage === 1"
            title="上一页"
            @click="currentPage > 1 && currentPage--"
          >
            <i class="fas fa-chevron-left"></i>
          </button>
          <div
            class="flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <span>第</span>
            <span class="text-brand font-bold">{{ currentPage }}</span>
            <span class="opacity-40">/</span>
            <span>{{ totalPages }} 页</span>
          </div>
          <button
            type="button"
            class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-30 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
            :disabled="currentPage === totalPages"
            title="下一页"
            @click="currentPage < totalPages && currentPage++"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
        <div class="text-xs text-slate-400 dark:text-slate-500">
          共 {{ filteredApps.length }} 个应用，每页显示 {{ itemsPerPage }} 个
        </div>
      </div>
    </main>

    <AppDetailModal
      data-app-modal="detail"
      :show="showModal"
      :app="currentApp"
      :screenshots="screenshots"
      :isinstalled="currentAppIsInstalled"
      @close="closeDetail"
      @install="handleInstall"
      @remove="requestUninstallFromDetail"
      @open-preview="openScreenPreview"
      @open-app="openDownloadedApp"
    />

    <ScreenPreview
      :show="showPreview"
      :screenshots="screenshots"
      :current-screen-index="currentScreenIndex"
      @close="closeScreenPreview"
      @prev="prevScreen"
      @next="nextScreen"
    />

    <DownloadQueue
      :downloads="downloads"
      @pause="pauseDownload"
      @resume="resumeDownload"
      @cancel="cancelDownload"
      @retry="retryDownload"
      @clear-completed="clearCompletedDownloads"
      @show-detail="showDownloadDetailModalFunc"
    />

    <DownloadDetail
      :show="showDownloadDetailModal"
      :download="currentDownload"
      @close="closeDownloadDetail"
      @pause="pauseDownload"
      @resume="resumeDownload"
      @cancel="cancelDownload"
      @retry="retryDownload"
      @open-app="openDownloadedApp"
    />

    <InstalledAppsModal
      :show="showInstalledModal"
      :apps="installedApps"
      :loading="installedLoading"
      :error="installedError"
      @close="closeInstalledModal"
      @refresh="refreshInstalledApps"
      @uninstall="uninstallInstalledApp"
    />

    <UpdateAppsModal
      :show="showUpdateModal"
      :apps="upgradableApps"
      :loading="updateLoading"
      :error="updateError"
      :has-selected="hasSelectedUpgrades"
      @close="closeUpdateModal"
      @refresh="refreshUpgradableApps"
      @toggle-all="toggleAllUpgrades"
      @upgrade-selected="upgradeSelectedApps"
      @upgrade-one="upgradeSingleApp"
    />

    <UninstallConfirmModal
      :show="showUninstallModal"
      :app="uninstallTargetApp"
      @close="closeUninstallModal"
      @success="onUninstallSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from "vue";
import axios from "axios";
import pino from "pino";
import AppSidebar from "./components/AppSidebar.vue";
import AppHeader from "./components/AppHeader.vue";
import AppGrid from "./components/AppGrid.vue";
import AppDetailModal from "./components/AppDetailModal.vue";
import ScreenPreview from "./components/ScreenPreview.vue";
import DownloadQueue from "./components/DownloadQueue.vue";
import DownloadDetail from "./components/DownloadDetail.vue";
import InstalledAppsModal from "./components/InstalledAppsModal.vue";
import UpdateAppsModal from "./components/UpdateAppsModal.vue";
import UninstallConfirmModal from "./components/UninstallConfirmModal.vue";
import {
  APM_STORE_BASE_URL,
  currentApp,
  currentAppIsInstalled,
} from "./global/storeConfig";
import {
  downloads,
  removeDownloadItem,
  watchDownloadsChange,
} from "./global/downloadStatus";
import {
  handleInstall,
  handleRetry,
  handleUpgrade,
} from "./modules/processInstall";
import type {
  App,
  AppJson,
  DownloadItem,
  UpdateAppItem,
  ChannelPayload,
} from "./global/typedefinition";
import type { Ref } from "vue";
import type { IpcRendererEvent } from "electron";
const logger = pino();

// Axios 全局配置
const axiosInstance = axios.create({
  baseURL: APM_STORE_BASE_URL,
  timeout: 5000, // 增加到 5 秒，避免网络波动导致的超时
});
const cacheBuster = (url: string) => `${url}?cb=${Date.now()}`;

// 响应式状态
const themeMode = ref<"light" | "dark" | "auto">("auto");
const systemIsDark = ref(
  window.matchMedia("(prefers-color-scheme: dark)").matches,
);
const isDarkTheme = computed(() => {
  if (themeMode.value === "auto") return systemIsDark.value;
  return themeMode.value === "dark";
});

const categories: Ref<Record<string, string>> = ref({});
const apps: Ref<App[]> = ref([]);
const activeCategory = ref("all");
const searchQuery = ref("");
const isSidebarOpen = ref(false);
const currentPage = ref(1);
const itemsPerPage = 100; // TODO: 每页显示的应用数量，这个之后加到app设置里
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
const installedError = ref("");
const showUpdateModal = ref(false);
const upgradableApps = ref<(App & { selected: boolean; upgrading: boolean })[]>(
  [],
);
const updateLoading = ref(false);
const updateError = ref("");
const showUninstallModal = ref(false);
const uninstallTargetApp: Ref<App | null> = ref(null);

// 监听页码变化并置顶
watch(currentPage, () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// 计算属性
const filteredApps = computed(() => {
  let result = [...apps.value];

  // 按分类筛选
  if (activeCategory.value !== "all") {
    result = result.filter((app) => app.category === activeCategory.value);
  }

  // 按搜索关键词筛选
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    result = result.filter((app) => {
      // 兼容可能为 undefined 的情况，虽然类型定义是 string
      return (
        (app.name || "").toLowerCase().includes(q) ||
        (app.pkgname || "").toLowerCase().includes(q) ||
        (app.tags || "").toLowerCase().includes(q) ||
        (app.more || "").toLowerCase().includes(q)
      );
    });
  }

  return result;
});

const totalPages = computed(() => {
  return Math.ceil(filteredApps.value.length / itemsPerPage);
});

const pagedApps = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredApps.value.slice(start, end);
});

const categoryCounts = computed(() => {
  const counts: Record<string, number> = { all: apps.value.length };
  apps.value.forEach((app) => {
    if (!counts[app.category]) counts[app.category] = 0;
    counts[app.category]++;
  });
  return counts;
});

const hasSelectedUpgrades = computed(() => {
  return upgradableApps.value.some((app) => app.selected);
});

// 方法
const syncThemePreference = () => {
  document.documentElement.classList.toggle("dark", isDarkTheme.value);
};

const initTheme = () => {
  const savedTheme = localStorage.getItem("theme");
  if (
    savedTheme === "dark" ||
    savedTheme === "light" ||
    savedTheme === "auto"
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    themeMode.value = savedTheme as any;
  } else {
    themeMode.value = "auto";
  }
  window.ipcRenderer.send(
    "set-theme-source",
    themeMode.value === "auto" ? "system" : themeMode.value,
  );
  syncThemePreference();

  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", (e) => {
      systemIsDark.value = e.matches;
    });
};

const toggleTheme = () => {
  if (themeMode.value === "auto") themeMode.value = "light";
  else if (themeMode.value === "light") themeMode.value = "dark";
  else themeMode.value = "auto";
};

const selectCategory = (category: string) => {
  activeCategory.value = category;
  searchQuery.value = "";
  isSidebarOpen.value = false;
  currentPage.value = 1;
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
    const modal = document.querySelector(
      '[data-app-modal="detail"] .modal-panel',
    );
    if (modal) modal.scrollTop = 0;
  });
};

const checkAppInstalled = (app: App) => {
  window.ipcRenderer
    .invoke("check-installed", app.pkgname)
    .then((isInstalled: boolean) => {
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
  updateError.value = "";
  try {
    const result = await window.ipcRenderer.invoke("list-upgradable");
    if (!result?.success) {
      upgradableApps.value = [];
      updateError.value = result?.message || "检查更新失败";
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    upgradableApps.value = (result.apps || []).map((app: any) => ({
      ...app,
      // Map properties if needed or assume main matches App interface except field names might differ
      // For now assuming result.apps returns objects compatible with App for core fields,
      // but let's normalize just in case if main returns different structure.
      name: app.name || app.Name || "",
      pkgname: app.pkgname || app.Pkgname || "",
      version: app.newVersion || app.version || "",
      category: app.category || "unknown",
      selected: false,
      upgrading: false,
    }));
  } catch (error: unknown) {
    upgradableApps.value = [];
    updateError.value = (error as Error)?.message || "检查更新失败";
  } finally {
    updateLoading.value = false;
  }
};

const toggleAllUpgrades = () => {
  const shouldSelectAll =
    !hasSelectedUpgrades.value ||
    upgradableApps.value.some((app) => !app.selected);
  upgradableApps.value = upgradableApps.value.map((app) => ({
    ...app,
    selected: shouldSelectAll ? true : false,
  }));
};

const upgradeSingleApp = (app: UpdateAppItem) => {
  if (!app?.pkgname) return;
  const target = apps.value.find((a) => a.pkgname === app.pkgname);
  if (target) {
    handleUpgrade(target);
  } else {
    // If we can't find it in the list (e.g. category not loaded?), use the info we have
    // But handleUpgrade expects App. Let's try to construct minimal App
    let minimalApp: App = {
      name: app.pkgname,
      pkgname: app.pkgname,
      version: app.newVersion || "",
      category: "unknown",
      tags: "",
      more: "",
      filename: "",
      torrent_address: "",
      author: "",
      contributor: "",
      website: "",
      update: "",
      size: "",
      img_urls: [],
      icons: "",
      currentStatus: "installed",
    };
    handleUpgrade(minimalApp);
  }
};

const upgradeSelectedApps = () => {
  const selectedApps = upgradableApps.value.filter((app) => app.selected);
  selectedApps.forEach((app) => {
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
  installedError.value = "";
  try {
    const result = await window.ipcRenderer.invoke("list-installed");
    if (!result?.success) {
      installedApps.value = [];
      installedError.value = result?.message || "读取已安装应用失败";
      return;
    }

    installedApps.value = [];
    for (const app of result.apps) {
      let appInfo = apps.value.find((a) => a.pkgname === app.pkgname);
      if (appInfo) {
        appInfo.flags = app.flags;
        appInfo.arch = app.arch;
        appInfo.currentStatus = "installed";
      } else {
        // 如果在当前应用列表中找不到该应用，创建一个最小的 App 对象
        appInfo = {
          name: app.name || app.pkgname,
          pkgname: app.pkgname,
          version: app.version,
          category: "unknown",
          tags: "",
          more: "",
          filename: "",
          torrent_address: "",
          author: "",
          contributor: "",
          website: "",
          update: "",
          size: "",
          img_urls: [],
          icons: "",
          currentStatus: "installed",
          arch: app.arch,
          flags: app.flags,
        };
      }
      installedApps.value.push(appInfo);
    }
  } catch (error: unknown) {
    installedApps.value = [];
    installedError.value = (error as Error)?.message || "读取已安装应用失败";
  } finally {
    installedLoading.value = false;
  }
};

const requestUninstall = (app: App) => {
  let target = null;
  target = apps.value.find((a) => a.pkgname === app.pkgname) || app;

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
};

watchDownloadsChange(installCompleteCallback);

const uninstallInstalledApp = (app: App) => {
  requestUninstall(app);
};

// TODO: 目前 APM 商店不能暂停下载
const pauseDownload = (id: DownloadItem) => {
  const download = downloads.value.find((d) => d.id === id.id);
  if (download && download.status === "installing") {
    // 'installing' matches type definition, previously 'downloading'
    download.status = "paused";
    download.logs.push({
      time: Date.now(),
      message: "下载已暂停",
    });
  }
};

// TODO: 同理，暂未实现
const resumeDownload = (id: DownloadItem) => {
  const download = downloads.value.find((d) => d.id === id.id);
  if (download && download.status === "paused") {
    download.status = "installing"; // previously 'downloading'
    download.logs.push({
      time: Date.now(),
      message: "继续下载...",
    });
    // simulateDownload(download); // removed or undefined?
  }
};

const cancelDownload = (id: DownloadItem) => {
  const index = downloads.value.findIndex((d) => d.id === id.id);
  if (index !== -1) {
    const download = downloads.value[index];
    // 发送到主进程取消
    window.ipcRenderer.send("cancel-install", download.id);

    download.status = "failed"; // TODO: Use 'cancelled'instead of failed to type will be better though
    download.logs.push({
      time: Date.now(),
      message: "下载已取消",
    });
    // TODO: Remove from the list，but is it really necessary?
    // Maybe keep it with 'cancelled' status for user reference
    const idx = downloads.value.findIndex((d) => d.id === id.id);
    if (idx !== -1) downloads.value.splice(idx, 1);
  }
};

const retryDownload = (id: DownloadItem) => {
  const download = downloads.value.find((d) => d.id === id.id);
  if (download && download.status === "failed") {
    download.status = "queued";
    download.progress = 0;
    download.downloadedSize = 0;
    download.logs.push({
      time: Date.now(),
      message: "重新开始下载...",
    });
    handleRetry(download);
  }
};

const clearCompletedDownloads = () => {
  downloads.value = downloads.value.filter((d) => d.status !== "completed");
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
  window.ipcRenderer.invoke("launch-app", pkgname);
};

const loadCategories = async () => {
  try {
    const response = await axiosInstance.get(
      cacheBuster(`/${window.apm_store.arch}/categories.json`),
    );
    categories.value = response.data;
  } catch (error) {
    logger.error(`读取 categories.json 失败: ${error}`);
  }
};

const loadApps = async () => {
  try {
    logger.info("开始加载应用数据...");

    const categoriesList = Object.keys(categories.value || {});
    const concurrency = 4; // 同时并发请求数量，可根据网络条件调整

    for (let i = 0; i < categoriesList.length; i += concurrency) {
      const batch = categoriesList.slice(i, i + concurrency);
      await Promise.all(
        batch.map(async (category) => {
          try {
            logger.info(`加载分类: ${category}`);
            const response = await axiosInstance.get<AppJson[]>(
              cacheBuster(`/${window.apm_store.arch}/${category}/applist.json`),
            );
            const categoryApps = response.status === 200 ? response.data : [];
            categoryApps.forEach((appJson) => {
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
                img_urls:
                  typeof appJson.img_urls === "string"
                    ? JSON.parse(appJson.img_urls)
                    : appJson.img_urls,
                icons: appJson.icons,
                category: category,
                currentStatus: "not-installed",
              };
              apps.value.push(normalizedApp);
            });
          } catch (error) {
            logger.warn(`加载分类 ${category} 失败: ${error}`);
          }
        }),
      );

      // 首批完成回调（用于隐藏首屏 loading）
      if (i === 0) loading.value = false;
    }
  } catch (error) {
    logger.error(`加载应用数据失败: ${error}`);
  }
};

const handleSearchInput = (value: string) => {
  searchQuery.value = value;
  currentPage.value = 1;
};

// 生命周期钩子
onMounted(async () => {
  initTheme();

  await loadCategories();
  await loadApps();

  // 设置键盘导航
  document.addEventListener("keydown", (e) => {
    if (showPreview.value) {
      if (e.key === "Escape") closeScreenPreview();
      if (e.key === "ArrowLeft") prevScreen();
      if (e.key === "ArrowRight") nextScreen();
    }
    if (showModal.value && e.key === "Escape") {
      closeDetail();
    }
  });

  // Deep link Handlers
  window.ipcRenderer.on("deep-link-update", () => {
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

  window.ipcRenderer.on("deep-link-installed", () => {
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

  window.ipcRenderer.on(
    "deep-link-install",
    (_event: IpcRendererEvent, pkgname: string) => {
      const tryOpen = () => {
        const target = apps.value.find((a) => a.pkgname === pkgname);
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
    },
  );

  window.ipcRenderer.on(
    "remove-complete",
    (_event: IpcRendererEvent, payload: ChannelPayload) => {
      const pkgname = currentApp.value?.pkgname;
      if (payload.success && pkgname) {
        removeDownloadItem(pkgname);
      }
    },
  );

  window.ipcRenderer.send("renderer-ready", { status: true });
  logger.info("Renderer process is ready!");
});

// 观察器
watch(themeMode, (newVal) => {
  localStorage.setItem("theme", newVal);
  window.ipcRenderer.send(
    "set-theme-source",
    newVal === "auto" ? "system" : newVal,
  );
});

watch(isDarkTheme, () => {
  syncThemePreference();
});
</script>
