// window.ipcRenderer.on('main-process-message', (_event, ...args) => {
//   console.log('[Receive Main-process message]:', ...args)
// })

import { currentApp } from "../global/storeConfig";
import { APM_STORE_BASE_URL, APM_STORE_ARCHITECTURE } from "../global/storeConfig";
import { downloads } from "../global/downloadStatus";

import { InstallLog, DownloadItem, DownloadResult } from '../global/typedefinition';

let downloadIdCounter = 0;

export const handleInstall = () => {
  if (!currentApp.value?.Pkgname) return;

  downloadIdCounter += 1;
  // 创建下载任务
  const download: DownloadItem = {
    id: downloadIdCounter,
    name: currentApp.value.Name,
    pkgname: currentApp.value.Pkgname,
    version: currentApp.value.Version,
    icon: `${APM_STORE_BASE_URL}/${APM_STORE_ARCHITECTURE}/${currentApp.value._category}/${currentApp.value.Pkgname}/icon.png`,
    status: 'queued',
    progress: 0,
    downloadedSize: 0,
    totalSize: 0,
    speed: 0,
    timeRemaining: 0,
    startTime: Date.now(),
    logs: [
      { time: Date.now(), message: '开始下载...' }
    ],
    source: 'APM Store'
  };

  downloads.value.push(download);

  // 模拟下载进度（实际应该调用真实的下载 API）
  // simulateDownload(download);

  // Send to main process to start download
  window.ipcRenderer.send('queue-install', download);

  const encodedPkg = encodeURIComponent(currentApp.value.Pkgname);
  // openApmStoreUrl(`apmstore://install?pkg=${encodedPkg}`, {
  //   fallbackText: `/usr/bin/apm-installer --install ${currentApp.value.Pkgname}`
  // });
};

window.ipcRenderer.on('install-status', (_event, log: InstallLog) => {
    const downloadObj: any = downloads.value.find(d => d.id === log.id);
    downloadObj.status = log.message;
});
window.ipcRenderer.on('install-log', (_event, log: InstallLog) => {
    const downloadObj: any = downloads.value.find(d => d.id === log.id);
    downloadObj.logs.push({
        time: log.time,
        message: log.message
    });
});

window.ipcRenderer.on('install-complete', (_event, log: DownloadResult) => {
    const downloadObj: any = downloads.value.find(d => d.id === log.id);
    if (log.success) {
        downloadObj.status = 'completed';
    } else {
        downloadObj.status = 'failed';
    }
});