<template>
  <div class="app-container">
    <aside class="sidebar">
      <AppSidebar :categories="categories" :active-category="activeCategory" :category-counts="categoryCounts"
        :is-dark-theme="isDarkTheme" @toggle-theme="toggleTheme" @select-category="selectCategory" />
    </aside>

    <main class="main">
      <AppHeader :search-query="searchQuery" :apps-count="apps.length" @update-search="handleSearchInput"
        @update="handleUpdate" @list="handleList" />
      <AppGrid :apps="apps" :loading="loading" @open-detail="openDetail" />
    </main>

    <AppDetailModal :show="showModal" :app="currentApp" :screenshots="screenshots" @close="closeDetail"
      @install="handleInstall" @open-preview="openScreenPreview" />

    <ScreenPreview :show="showPreview" :screenshots="screenshots" :current-screen-index="currentScreenIndex"
      @close="closeScreenPreview" @prev="prevScreen" @next="nextScreen" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import AppSidebar from './components/AppSidebar.vue';
import AppHeader from './components/AppHeader.vue';
import AppGrid from './components/AppGrid.vue';
import AppDetailModal from './components/AppDetailModal.vue';
import ScreenPreview from './components/ScreenPreview.vue';
import { APM_STORE_ARCHITECTURE, APM_STORE_BASE_URL } from './global/StoreConfig';
import axios from 'axios';

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
const currentApp = ref(null);
const currentScreenIndex = ref(0);
const screenshots = ref([]);
const loading = ref(true);
const observer = ref(null);

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

// 方法
const initTheme = () => {
  const savedTheme = localStorage.getItem('theme');
  isDarkTheme.value = savedTheme === 'dark';

  if (isDarkTheme.value) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
};

const toggleTheme = () => {
  isDarkTheme.value = !isDarkTheme.value;
  localStorage.setItem('theme', isDarkTheme.value ? 'dark' : 'light');

  if (isDarkTheme.value) {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
};

const selectCategory = (category) => {
  activeCategory.value = category;
};

const openDetail = (app) => {
  currentApp.value = app;
  currentScreenIndex.value = 0;
  loadScreenshots(app);
  showModal.value = true;

  // 确保模态框显示后滚动到顶部
  nextTick(() => {
    const modal = document.querySelector('.modal');
    if (modal) modal.scrollTop = 0;
  });
};

const loadScreenshots = (app) => {
  screenshots.value = [];
  for (let i = 1; i <= 5; i++) {
    const screenshotUrl = `./${app._category}/${app.Pkgname}/screen_${i}.png`;
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

const handleInstall = () => {
  if (!currentApp.value?.Pkgname) return;

  const encodedPkg = encodeURIComponent(currentApp.value.Pkgname);
  openApmStoreUrl(`apmstore://install?pkg=${encodedPkg}`, {
    fallbackText: `/usr/bin/apm-installer --install ${currentApp.value.Pkgname}`
  });
};

const handleUpdate = () => {
  openApmStoreUrl('apmstore://action?cmd=update', {
    fallbackText: 'apm-update-tool'
  });
};

const handleList = () => {
  openApmStoreUrl('apmstore://action?cmd=list', {
    fallbackText: '/usr/bin/apm-installer --list'
  });
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

const initLazyLoad = () => {
  if ('IntersectionObserver' in window) {
    observer.value = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          observer.value.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.1
    });
  }
};

const loadCategories = async () => {
  try {
    const response = await axiosInstance.get(`/${APM_STORE_ARCHITECTURE}/categories.json`);
    categories.value = response.data;
    // const response = await fetch('/amd64-apm/categories.json');
    // const data = await response.data
    // categories.value = data;
  } catch (error) {
    console.error('读取 categories.json 失败', error);
  }
};

const loadApps = async () => {
  loading.value = true;
  try {
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
    console.error('加载应用数据失败', error);
  } finally {
    loading.value = false;
  }
};

const handleSearchInput = (e) => {
  searchQuery.value = e.target.value;
};

// 生命周期钩子
onMounted(async () => {
  initTheme();
  initLazyLoad();

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
  if (newVal) {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
});

// 暴露给模板
const appsList = computed(() => filteredApps.value);
</script>

<style scoped>
/* 这里可以放组件特定样式 */
</style>