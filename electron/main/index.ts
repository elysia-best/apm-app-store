import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  shell,
  Tray,
  nativeTheme,
  session,
} from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";
import pino from "pino";
import { handleCommandLine } from "./deeplink.js";
import { isLoaded } from "../global.js";
import { tasks } from "./backend/install-manager.js";

// Assure single instance application
if (!app.requestSingleInstanceLock()) {
  app.exit(0);
}

import "./backend/install-manager.js";
import "./handle-url-scheme.js";

const logger = pino({ name: "index.ts" });
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.mjs   > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.APP_ROOT = path.join(__dirname, "../..");

export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith("6.1")) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === "win32") app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

let win: BrowserWindow | null = null;
const preload = path.join(__dirname, "../preload/index.mjs");
const indexHtml = path.join(RENDERER_DIST, "index.html");

// Use app.getVersion() when the app is packaged.
const getUserAgent = (): string => {
  const version =
    app && app.isPackaged
      ? app.getVersion()
      : process.env.npm_package_version || "dev";
  return `APM-Store/${version}`;
};

logger.info("User Agent: " + getUserAgent());

async function createWindow() {
  win = new BrowserWindow({
    title: "APM AppStore",
    width: 1366,
    height: 768,
    autoHideMenuBar: true,
    icon: path.join(process.env.VITE_PUBLIC, "favicon.ico"),
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // nodeIntegration: true,

      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      // contextIsolation: false,
    },
  });

  if (VITE_DEV_SERVER_URL) {
    // #298
    win.loadURL(VITE_DEV_SERVER_URL);
    // Open devTool if the app is not packaged
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    win.loadFile(indexHtml);
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
    logger.info("Renderer process is ready.");
  });

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https:")) shell.openExternal(url);
    return { action: "deny" };
  });
  // win.webContents.on('will-navigate', (event, url) => { }) #344

  win.on("close", (event) => {
    // 截获 close 默认行为
    event.preventDefault();
    // 点击关闭时触发close事件，我们按照之前的思路在关闭时，隐藏窗口，隐藏任务栏窗口
    if (tasks.size > 0) {
      win.hide();
      win.setSkipTaskbar(true);
    } else {
      // 如果没有下载任务，才允许关闭窗口
      win.destroy();
    }
  });
}

ipcMain.on("renderer-ready", (event, args) => {
  logger.info(
    "Received renderer-ready event with args: " + JSON.stringify(args),
  );
  isLoaded.value = args.status;
  logger.info(`isLoaded set to: ${isLoaded.value}`);
});

ipcMain.on("set-theme-source", (event, theme: "system" | "light" | "dark") => {
  nativeTheme.themeSource = theme;
});

app.whenReady().then(() => {
  // Set User-Agent for client
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders["User-Agent"] = getUserAgent();
    callback({ cancel: false, requestHeaders: details.requestHeaders });
  });
  createWindow();
  handleCommandLine(process.argv);
});

app.on("window-all-closed", () => {
  win = null;
  if (process.platform !== "darwin") app.quit();
});

app.on("second-instance", () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

app.on("activate", () => {
  const allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length) {
    allWindows[0].focus();
  } else {
    createWindow();
  }
});

app.on("will-quit", () => {
  // Clean up temp dir
  logger.info("Cleaning up temp dir");
  fs.rmSync("/tmp/apm-store/", { recursive: true, force: true });
  logger.info("Done, exiting");
});

// 设置托盘
// 获取图标路径
function getIconPath() {
  let iconPath = "";
  const iconFile =
    process.platform === "win32" ? "amber-pm-logo.ico" : "amber-pm-logo.png"; // 图标文件名，linux下需要png格式，不然会不显示
  // 判断是否在打包模式
  if (app.isPackaged) {
    // 打包模式
    iconPath = path.join(process.resourcesPath, "icons", iconFile); // 路径根据自身情况调整
  } else {
    // 开发模式
    const projectRoot = path.join(__dirname, "../.."); // __dirname 指向 dist-electron/main，但资源在项目根目录，所以..指向上一级
    iconPath = path.join(projectRoot, "icons", iconFile);
  }

  // 检查文件是否存在
  if (fs.existsSync(iconPath)) {
    logger.info("图标文件存在:" + iconPath);
    return iconPath;
  } else {
    logger.error("图标文件不存在:" + iconPath);
    // 返回一个默认图标路径或null
    return null;
  }
}

let tray = null;
app.whenReady().then(() => {
  tray = new Tray(getIconPath());
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "显示主界面",
      click: () => {
        win.show();
      },
    },
    {
      label: "退出程序",
      click: () => {
        win.destroy();
      },
    },
  ]);
  tray.setToolTip("APM 应用商店");
  tray.setContextMenu(contextMenu);
  // 双击触发
  tray.on("click", () => {
    // 双击通知区图标实现应用的显示或隐藏
    if (win.isVisible()) {
      win.hide();
      win.setSkipTaskbar(true);
    } else {
      win.show();
      win.setSkipTaskbar(false);
    }
  });
});

// New window example arg: new windows url
// ipcMain.handle('open-win', (_, arg) => {
//   const childWindow = new BrowserWindow({
//     webPreferences: {
//       preload,
//       nodeIntegration: true,
//       contextIsolation: false,
//     },
//   })

//   if (VITE_DEV_SERVER_URL) {
//     childWindow.loadURL(`${VITE_DEV_SERVER_URL}#${arg}`)
//   } else {
//     childWindow.loadFile(indexHtml, { hash: arg })
//   }
// })
