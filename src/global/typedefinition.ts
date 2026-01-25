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

export interface DownloadItem {
    id: number;                     
    name: string;
    pkgname: string;
    version: string;
    icon: string;
    status: 'installing' | 'paused' | 'completed' | 'failed' | 'queued'; // 可根据实际状态扩展
    progress: number;               // 0 ~ 100 的百分比，或 0 ~ 1 的小数（建议统一）
    downloadedSize: number;         // 已下载字节数
    totalSize: number;              // 总字节数（可能为 0 初始时）
    speed: number;                  // 当前下载速度，单位如 B/s
    timeRemaining: number;          // 剩余时间（秒），0 表示未知
    startTime: number;              // Date.now() 返回的时间戳（毫秒）
    logs: Array<{
        time: number;                 // 日志时间戳
        message: string;              // 日志消息
    }>;
    source: string;                 // 例如 'APM Store'
}