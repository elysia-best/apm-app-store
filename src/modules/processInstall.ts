// window.ipcRenderer.on('main-process-message', (_event, ...args) => {
//   console.log('[Receive Main-process message]:', ...args)
// })
import pino from "pino";

import { currentApp, currentAppIsInstalled } from "../global/storeConfig";
import { APM_STORE_BASE_URL } from "../global/storeConfig";
import { downloads } from "../global/downloadStatus";

import {
  InstallLog,
  DownloadItem,
  DownloadResult,
  App,
  DownloadItemStatus,
} from "../global/typedefinition";

let downloadIdCounter = 0;
const logger = pino({ name: "processInstall.ts" });

export const handleInstall = () => {
  if (!currentApp.value?.pkgname) return;

  if (downloads.value.find((d) => d.pkgname === currentApp.value?.pkgname)) {
    logger.info(`任务已存在，忽略重复添加: ${currentApp.value.pkgname}`);
    return;
  }

  downloadIdCounter += 1;
  // 创建下载任务
  const download: DownloadItem = {
    id: downloadIdCounter,
    name: currentApp.value.name,
    pkgname: currentApp.value.pkgname,
    version: currentApp.value.version,
    icon: `${APM_STORE_BASE_URL}/${window.apm_store.arch}/${currentApp.value.category}/${currentApp.value.pkgname}/icon.png`,
    status: "queued",
    progress: 0,
    downloadedSize: 0,
    totalSize: 0,
    speed: 0,
    timeRemaining: 0,
    startTime: Date.now(),
    logs: [{ time: Date.now(), message: "开始下载..." }],
    source: "APM Store",
    retry: false,
  };

  downloads.value.push(download);

  // Send to main process to start download
  window.ipcRenderer.send("queue-install", JSON.stringify(download));

  // const encodedPkg = encodeURIComponent(currentApp.value.Pkgname);
  // openApmStoreUrl(`apmstore://install?pkg=${encodedPkg}`, {
  //   fallbackText: `/usr/bin/apm-installer --install ${currentApp.value.Pkgname}`
  // });
};

export const handleRetry = (download_: DownloadItem) => {
  if (!download_?.pkgname) return;
  download_.retry = true;
  // Send to main process to start download
  window.ipcRenderer.send("queue-install", JSON.stringify(download_));
};

export const handleUpgrade = (app: App) => {
  if (!app.pkgname) return;

  if (downloads.value.find((d) => d.pkgname === app.pkgname)) {
    logger.info(`任务已存在，忽略重复添加: ${app.pkgname}`);
    return;
  }

  downloadIdCounter += 1;
  const download: DownloadItem = {
    id: downloadIdCounter,
    name: app.name,
    pkgname: app.pkgname,
    version: app.version,
    icon: `${APM_STORE_BASE_URL}/${window.apm_store.arch}/${app.category}/${app.pkgname}/icon.png`,
    status: "queued",
    progress: 0,
    downloadedSize: 0,
    totalSize: 0,
    speed: 0,
    timeRemaining: 0,
    startTime: Date.now(),
    logs: [{ time: Date.now(), message: "开始更新..." }],
    source: "APM Update",
    retry: false,
    upgradeOnly: true,
  };

  downloads.value.push(download);
  window.ipcRenderer.send("queue-install", JSON.stringify(download));
};

export const handleRemove = () => {
  if (!currentApp.value?.pkgname) return;
  window.ipcRenderer.send("remove-installed", currentApp.value.pkgname);
};

window.ipcRenderer.on("remove-complete", (_event, log: DownloadResult) => {
  if (log.success) {
    currentAppIsInstalled.value = false;
  } else {
    currentAppIsInstalled.value = true;
    console.error("卸载失败:", log.message);
  }
});

window.ipcRenderer.on("install-status", (_event, log: InstallLog) => {
  const downloadObj = downloads.value.find((d) => d.id === log.id);
  if (downloadObj) downloadObj.status = log.message as DownloadItemStatus;
});
window.ipcRenderer.on("install-log", (_event, log: InstallLog) => {
  const downloadObj = downloads.value.find((d) => d.id === log.id);
  if (downloadObj)
    downloadObj.logs.push({
      time: log.time,
      message: log.message,
    });
});

window.ipcRenderer.on("install-complete", (_event, log: DownloadResult) => {
  const downloadObj = downloads.value.find((d) => d.id === log.id);
  if (downloadObj) {
    if (log.success) {
      downloadObj.status = "completed";
    } else {
      downloadObj.status = "failed";
    }
  }
});
