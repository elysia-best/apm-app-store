export interface InstallLog {
    id: number;
    success: boolean;
    time: number;
    exitCode: number | null;
    message: string;
}

export interface DownloadResult extends InstallLog {
    success: boolean;
    exitCode: number | null;
}

export type DownloadItemStatus = 'downloading' | 'installing' | 'paused' | 'completed' | 'failed' | 'queued'; // 可根据实际状态扩展

export interface DownloadItem {
    id: number;                     
    name: string;
    pkgname: string;
    version: string;
    icon: string;
    status: DownloadItemStatus;
    progress: number;               // 0 ~ 100 的百分比，或 0 ~ 1 的小数（建议统一）
    downloadedSize: number;         // 已下载字节数
    totalSize: number;              // 总字节数（可能为 0 初始时）
    speed: number;                  // 当前下载速度，单位如 B/s
    timeRemaining: number;          // 剩余时间（秒），0 表示未知
    startTime: number;              // Date.now() 返回的时间戳（毫秒）
    endTime?: number;             // 下载完成时间戳（毫秒），可选
    logs: Array<{
        time: number;                 // 日志时间戳
        message: string;              // 日志消息
    }>;
    source: string;                 // 例如 'APM Store'
    retry: boolean;                  // 当前是否为重试下载
    upgradeOnly?: boolean;           // 是否为仅升级任务
    error?: string;
}

/*
    "Name": "Visual Studio Code(vscode)",
    "Version": "1.108.2-1769004815",
    "Filename": "code_1.108.2-1769004815_amd64.deb",
    "Torrent_address": "code_1.108.2-1769004815_amd64.deb.torrent",
    "Pkgname": "code",
    "Author": "shenmo<shenmo@spark-app.store>",
    "Contributor": "shenmo<shenmo@spark-app.store>",
    "Website": "https://code.visualstudio.com/",
    "Update": "2026-01-26 17:34:15",
    "Size": "110M",
    "More": "VSCode是一款非常牛逼的编辑器",
    "Tags": "community;ubuntu;deepin;uos;debian",
    "img_urls": "[\"https://cdn.d.store.deepinos.org.cn/store/development/code/screen_1.png\",\"https://cdn.d.store.deepinos.org.cn/store/development/code/screen_2.png\",\"https://cdn.d.store.deepinos.org.cn/store/development/code/screen_3.png\",\"https://cdn.d.store.deepinos.org.cn/store/development/code/screen_4.png\",\"https://cdn.d.store.deepinos.org.cn/store/development/code/screen_5.png\"]",
    "icons": "https://cdn.d.store.deepinos.org.cn/store/development/code/icon.png"
 */
export interface AppJson {
    // 原始数据
    Name: string;
    Version: string;
    Filename: string;
    Torrent_address: string;
    Pkgname: string;
    Author: string;
    Contributor: string;
    Website: string;
    Update: string;
    Size: string;
    More: string;
    Tags: string;
    img_urls: string; // 注意：部分 json 里可能是字符串形式的数组
    icons: string;
}

export interface App {
    name: string;
    pkgname: string;
    version: string;
    filename: string;
    torrent_address: string;
    author: string;
    contributor: string;
    website: string;
    update: string;
    size: string;
    more: string;
    tags: string;
    img_urls: string[];
    icons: string;
    category: string; // Frontend added
    installed?: boolean; // Frontend state
    flags?: string; // Tags in apm packages manager, e.g. "automatic" for dependencies
    arch?: string; // Architecture, e.g. "amd64", "arm64"
    currentStatus: 'not-installed' | 'installed'; // Current installation status
}

export interface UpdateAppItem {
    pkgname: string;
    currentVersion?: string;
    newVersion?: string;
    selected?: boolean;
    upgrading?: boolean;
}


/**************Below are type from main process ********************/
export interface InstalledAppInfo {
    pkgname: string;
    version: string;
    arch: string;
    flags: string;
    raw: string;
}

/**
 * ipcSender传递的信息
 */
export type ChannelPayload = {
    success: boolean;
    message: string;
    [k: string]: unknown;
};