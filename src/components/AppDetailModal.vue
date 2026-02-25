<template>
  <Transition
    enter-active-class="duration-200 ease-out"
    enter-from-class="opacity-0 scale-95"
    enter-to-class="opacity-100 scale-100"
    leave-active-class="duration-150 ease-in"
    leave-from-class="opacity-100 scale-100"
    leave-to-class="opacity-0 scale-95"
  >
    <div
      v-if="show"
      v-bind="attrs"
      class="fixed inset-0 z-50 flex items-center justify-center overflow-hidden p-4"
      @click.self="closeModal"
    >
      <div
        class="modal-panel relative w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-3xl border border-white/10 bg-white shadow-popup dark:border-slate-800 dark:bg-slate-900 flex flex-col"
      >
        <!-- Top Section: Header with Blur Background -->
        <div
          class="relative shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-800"
        >
          <!-- Blur was disabled now for performance reasons -->
          <!-- <div class="absolute inset-0 z-0">
            <img
              v-if="app"
              :src="iconPath"
              alt=""
              class="h-full w-full scale-125 object-cover opacity-60 blur-3xl transition-opacity duration-500 dark:opacity-40"
            />
            <div
              class="absolute inset-0 bg-gradient-to-b from-transparent to-white/90 dark:to-slate-900/90"
            ></div>
          </div> -->

          <button
            type="button"
            class="absolute right-4 top-4 z-30 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/10 text-slate-700 backdrop-blur-md transition hover:bg-black/20 hover:text-slate-900 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20"
            @click="closeModal"
            aria-label="关闭"
          >
            <i class="fas fa-xmark"></i>
          </button>

          <div
            class="relative z-10 flex flex-col gap-6 p-8 md:flex-row md:items-end"
          >
            <div
              class="relative h-32 w-32 shrink-0 overflow-hidden rounded-[2rem] bg-white shadow-2xl ring-1 ring-black/5 dark:bg-slate-800 dark:ring-white/10"
            >
              <img
                v-if="app"
                :src="iconPath"
                alt="icon"
                class="h-full w-full object-cover"
              />
            </div>

            <div class="flex flex-1 flex-col gap-3">
              <div>
                <h2 class="text-3xl font-bold text-slate-900 dark:text-white">
                  {{ app?.name || "未知应用" }}
                </h2>
                <p
                  class="text-lg font-medium text-slate-600 dark:text-slate-300"
                >
                  {{ app?.pkgname || "" }}
                </p>
                <div
                  class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"
                >
                  <span
                    v-if="app?.version"
                    class="rounded bg-slate-200/50 text-xs dark:bg-slate-700/50"
                    >{{ app.version }}</span
                  >
                  <span v-if="downloadCount">· {{ downloadCount }} 次下载</span>
                </div>
              </div>

              <div class="mt-auto flex flex-wrap gap-3">
                <button
                  v-if="!isinstalled"
                  type="button"
                  class="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand/20 transition hover:-translate-y-0.5 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                  :class="
                    installFeedback
                      ? 'bg-emerald-500 hover:bg-emerald-600'
                      : 'bg-brand hover:bg-brand-dark'
                  "
                  @click="handleInstall"
                  :disabled="installFeedback || isCompleted"
                >
                  <i
                    class="fas"
                    :class="installFeedback ? 'fa-check' : 'fa-download'"
                  ></i>
                  <span>{{ installBtnText }}</span>
                </button>

                <template v-else>
                  <button
                    type="button"
                    class="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand/20 transition hover:-translate-y-0.5 hover:bg-brand-dark active:scale-95"
                    @click="emit('open-app', app?.pkgname || '')"
                  >
                    <i class="fas fa-external-link-alt"></i>
                    <span>打开</span>
                  </button>
                  <button
                    type="button"
                    class="inline-flex items-center gap-2 rounded-full bg-rose-500/10 px-6 py-2.5 text-sm font-bold text-rose-600 transition hover:bg-rose-500/20 hover:text-rose-700 active:scale-95 dark:text-rose-400 dark:hover:text-rose-300"
                    @click="handleRemove"
                  >
                    <i class="fas fa-trash"></i>
                    <span>卸载</span>
                  </button>
                </template>
              </div>
            </div>
          </div>
        </div>

        <!-- Middle Section: Horizontal Stats Bar -->
        <div
          class="shrink-0 border-b border-slate-100 bg-white/50 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/50"
        >
          <div
            class="scrollbar-nowidth flex w-full snap-x justify-center overflow-x-auto p-6"
          >
            <!-- Category -->
            <div
              class="flex min-w-[8rem] snap-start flex-col items-center gap-1 border-r border-slate-200 px-8 last:border-0 dark:border-slate-700"
            >
              <span class="text-xs font-semibold uppercase text-slate-400"
                >类别</span
              >
              <div class="flex flex-col items-center">
                <i class="fas fa-shapes mb-1 text-2xl text-slate-400"></i>
                <span
                  class="max-w-[8rem] truncate text-xs font-bold text-slate-600 dark:text-slate-300"
                  :title="app?.tags ? app.tags : '应用'"
                >
                  {{ app?.tags ? app?.tags : "应用" }}
                </span>
              </div>
            </div>

            <!-- Developer -->
            <div
              class="flex min-w-[8rem] snap-start flex-col items-center gap-1 border-r border-slate-200 px-8 last:border-0 dark:border-slate-700"
            >
              <span class="text-xs font-semibold uppercase text-slate-400"
                >开发者</span
              >
              <div class="flex flex-col items-center">
                <i class="fas fa-user-circle mb-1 text-2xl text-slate-400"></i>
                <span
                  class="max-w-[8rem] truncate text-xs font-bold text-slate-600 dark:text-slate-300"
                  :title="app?.author"
                >
                  {{ app?.author ? app.author.split("<")[0] : "未知" }}
                </span>
              </div>
            </div>

            <!-- Size -->
            <div
              class="flex min-w-[8rem] snap-start flex-col items-center gap-1 border-r border-slate-200 px-8 last:border-0 dark:border-slate-700"
            >
              <span class="text-xs font-semibold uppercase text-slate-400"
                >大小</span
              >
              <div class="flex flex-col items-center">
                <i class="fas fa-hard-drive mb-1 text-2xl text-slate-400"></i>
                <span
                  class="text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  {{ app?.size || "未知" }}
                </span>
              </div>
            </div>

            <!-- Update Time -->
            <div
              class="flex min-w-[8rem] snap-start flex-col items-center gap-1 border-r border-slate-200 px-8 last:border-0 dark:border-slate-700"
            >
              <span class="text-xs font-semibold uppercase text-slate-400"
                >更新时间</span
              >
              <div class="flex flex-col items-center">
                <i class="fas fa-clock mb-1 text-2xl text-slate-400"></i>
                <span
                  class="whitespace-nowrap text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  {{
                    app?.update
                      ? new Date(app.update).toLocaleDateString()
                      : "未知"
                  }}
                </span>
              </div>
            </div>

            <!-- Website Link -->
            <div
              class="flex min-w-[8rem] snap-start flex-col items-center gap-1 border-r border-slate-200 px-8 last:border-0 dark:border-slate-700"
              v-if="app?.website"
            >
              <span class="text-xs font-semibold uppercase text-slate-400"
                >网站</span
              >
              <a
                :href="app.website"
                target="_blank"
                class="group flex flex-col items-center"
              >
                <i
                  class="fas fa-globe mb-1 text-2xl text-slate-400 transition-colors group-hover:text-brand"
                ></i>
                <span
                  class="text-xs font-bold text-slate-600 transition-colors group-hover:text-brand dark:text-slate-300"
                  >访问</span
                >
              </a>
            </div>
          </div>
        </div>

        <!-- Scrollable Content Area -->
        <div class="flex-1 overflow-y-auto p-8 scrollbar-muted">
          <!-- Alert Message -->
          <!-- <div
            class="mb-8 flex items-start gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-800/50 dark:text-slate-300"
          >
            <i class="fas fa-info-circle mt-0.5 text-brand"></i>
            <div>
              首次安装 APM 后需要重启系统以在启动器中看到应用入口。可前往
              <a
                href="https://gitee.com/amber-ce/amber-pm/releases"
                target="_blank"
                class="font-semibold text-brand hover:underline"
                >APM Releases</a
              >
              获取 APM。
            </div>
          </div> -->

          <!-- Bottom Section: Screenshots Carousel -->
          <div v-if="screenshots.length" class="mb-8">
            <!-- <h3 class="mb-4 text-xl font-bold text-slate-900 dark:text-white">
              预览
            </h3> -->
            <div class="scrollbar-muted flex snap-x gap-4 overflow-x-auto pb-4">
              <img
                v-for="(screen, index) in screenshots"
                :key="index"
                :src="screen"
                alt="screenshot"
                class="h-64 w-auto flex-none snap-center cursor-pointer rounded-xl border border-slate-200 object-cover shadow-sm transition hover:shadow-md dark:border-slate-700"
                @click="openPreview(index)"
                @error="hideImage"
              />
            </div>
          </div>

          <!-- Description -->
          <div v-if="app?.more && app.more.trim() !== ''">
            <!-- <h3 class="mb-3 text-xl font-bold text-slate-900 dark:text-white">
              简介
            </h3> -->
            <div
              class="prose prose-slate max-w-none text-sm leading-relaxed text-slate-600 dark:prose-invert dark:text-slate-300"
              v-html="app.more.replace(/\n/g, '<br>')"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, useAttrs, ref, watch } from "vue";
import axios from "axios";
import {
  useDownloadItemStatus,
  useInstallFeedback,
  downloads,
} from "../global/downloadStatus";
import { APM_STORE_BASE_URL } from "../global/storeConfig";
import type { App } from "../global/typedefinition";

const attrs = useAttrs();

const props = defineProps<{
  show: boolean;
  app: App | null;
  screenshots: string[];
  isinstalled: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "install"): void;
  (e: "remove"): void;
  (e: "open-preview", index: number): void;
  (e: "open-app", pkgname: string): void;
}>();

const appPkgname = computed(() => props.app?.pkgname);

const activeDownload = computed(() => {
  return downloads.value.find((d) => d.pkgname === props.app?.pkgname);
});

const { installFeedback } = useInstallFeedback(appPkgname);
const { isCompleted } = useDownloadItemStatus(appPkgname);
const installBtnText = computed(() => {
  if (isCompleted.value) {
    // TODO: 似乎有一个时间差，安装好了之后并不是立马就可以从已安装列表看见
    return "已安装";
  }
  if (installFeedback.value) {
    const status = activeDownload.value?.status;
    if (status === "downloading") {
      return `下载中 ${Math.floor((activeDownload.value?.progress || 0) * 100)}%`;
    }
    if (status === "installing") {
      return "安装中...";
    }
    return "已加入队列";
  }
  return "安装";
});
const iconPath = computed(() => {
  if (!props.app) return "";
  return `${APM_STORE_BASE_URL}/${window.apm_store.arch}/${props.app.category}/${props.app.pkgname}/icon.png`;
});

const downloadCount = ref<string>("");

// 监听 app 变化，获取新app的下载量
watch(
  () => props.app,
  async (newApp) => {
    if (newApp) {
      downloadCount.value = "";
      try {
        const url = `${APM_STORE_BASE_URL}/${window.apm_store.arch}/${newApp.category}/${newApp.pkgname}/download-times.txt`;
        const resp = await axios.get(url, { responseType: "text" });
        if (resp.status === 200) {
          downloadCount.value = String(resp.data).trim();
        } else {
          downloadCount.value = "N/A";
          throw new Error(`Unexpected response status: ${resp.status}`);
        }
      } catch (e) {
        console.error("Failed to fetch download count", e);
      }
    }
  },
  { immediate: true },
);

const closeModal = () => {
  emit("close");
};

const handleInstall = () => {
  emit("install");
};

const handleRemove = () => {
  emit("remove");
};

const openPreview = (index: number) => {
  emit("open-preview", index);
};

const hideImage = (e: Event) => {
  (e.target as HTMLElement).style.display = "none";
};
</script>
