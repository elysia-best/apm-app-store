# APM 应用商店

<div align="center">

![APM Logo](public/icon.png)

**星火 APM 琥珀软件包管理器 - 桌面应用商店**

基于 Electron + Vue 3 + Vite 构建的现代化应用商店客户端

[![GitHub Build](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/elysia-best/apm-app-store)
[![License](https://img.shields.io/badge/license-GPL--3.0-blue)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Linux-orange)](https://github.com/elysia-best/apm-app-store)

</div>

---

## 📦 关于 APM

**APM (AmberPM)** 是基于 `fuse-overlayfs` + `dpkg` + `AmberCE` 的容器化兼容层，为多发行版提供轻量级的应用运行方案。

### 核心特性

✅ **多发行版支持** - 在 Arch Linux、Fedora、银河麒麟、统信 UOS 等主流发行版上运行星火商店应用  
⚡ **轻量兼容层** - 利用 overlayfs 技术实现极速启动，无需完整容器  
🎮 **NVIDIA 加速** - 自动获取主机 GPU 驱动，支持硬件加速  
🔧 **开发者友好** - 兼容 dpkg，提供完整的打包工具链  
🌐 **现代化界面** - 基于 Electron + Vue 3 的流畅用户体验

---

## 🚀 快速开始

### 安装应用商店

**现在不要安装，没开发完** ！！！

TODO


### 使用命令行工具


TODO

---

## 💻 开发指南

### 环境要求

- Node.js >= 20

### 本地开发

```bash
# 克隆项目
git clone https://github.com/elysia-best/apm-app-store.git

# 进入项目目录
cd apm-app-store

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 构建打包

```bash
# 构建生产版本
npm run build
```

---

## 📂 项目结构

```
apm-app-store/
├── electron/              # Electron 主进程
│   ├── main/
│   │   ├── index.ts      # 主进程入口
│   │   └── handle-url-scheme.ts  # URL 协议处理
│   └── preload/
│       └── index.ts      # 预加载脚本
├── src/                   # Vue 渲染进程
│   ├── components/       # Vue 组件
│   │   ├── AppCard.vue           # 应用卡片
│   │   ├── AppGrid.vue           # 应用网格
│   │   ├── AppHeader.vue         # 应用头部
│   │   ├── AppSidebar.vue        # 侧边栏
│   │   ├── AppDetailModal.vue    # 详情弹窗
│   │   ├── DownloadQueue.vue     # 下载队列
│   │   ├── DownloadDetail.vue    # 下载详情
│   │   └── ScreenPreview.vue     # 截图预览
│   ├── global/           # 全局配置
│   │   └── StoreConfig.ts        # 商店配置
│   ├── assets/           # 静态资源
│   ├── App.vue           # 根组件
│   └── main.ts           # 渲染进程入口
├── public/               # 公共资源
├── dist-electron/        # Electron 构建输出
├── release/              # 打包发布文件
└── package.json
```

---

## 🎨 主要功能

### 应用浏览与搜索
- 分类浏览应用
- 实时搜索过滤
- 应用详情查看
- 截图预览

### 下载管理
- 下载队列管理
- 实时进度显示
- 暂停/继续/取消
- 下载日志查看

### 主题切换
- 明暗主题自动切换
- 本地偏好保存

### 协议支持
- `apmstore://` 自定义协议
- 一键安装/启动应用

---

## 🔗 相关链接

- 📖 [APM 项目文档](https://gitee.com/spark-store-project/AmberPM)
- 💾 [Gitee 仓库](https://gitee.com/spark-store-project/apm-app-store)
- 🐛 [问题反馈](https://gitee.com/spark-store-project/apm-app-store/issues)
- 📦 [打包示例](https://gitee.com/spark-store-project/AmberPM/tree/main/Packaging-demo)

---

## 🛠️ 技术栈

- **Electron** - 跨平台桌面应用框架
- **Vue 3** - 渐进式 JavaScript 框架
- **Vite** - 下一代前端构建工具
- **TypeScript** - JavaScript 的超集
- **Axios** - HTTP 客户端

---

## 📄 开源协议

本项目采用 [MIT](LICENSE) 协议开源。

---

## 🙏 致谢

- [Electron](https://www.electronjs.org/)
- [Vue.js](https://vuejs.org/)
- [Vite](https://vitejs.dev/)
- [星火应用商店](https://www.spark-app.store/)

---

<div align="center">

**© 2026 APM / AmberPM | The Spark Project**

Made with ❤️ by the Spark Store Team

</div>
