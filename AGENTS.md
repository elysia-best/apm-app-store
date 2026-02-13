# AI Coding Guidance for APM App Store

**Repository:** elysia-best/apm-app-store  
**Project Type:** Electron + Vue 3 + Vite Desktop Application  
**Purpose:** Desktop app store client for APM (AmberPM) package manager  
**License:** MulanPSL-2.0

---

If you are an AI coding agent working on this repo, make sure to follow the guidelines below:

## 🏗️ Project Architecture Overview

### Technology Stack
- **Frontend Framework:** Vue 3 with Composition API (`<script setup>`)
- **Build Tool:** Vite 6.4.1
- **Desktop Framework:** Electron 40.0.0
- **UI Framework:** Tailwind CSS 4.1.18
- **Language:** TypeScript (strict mode enabled)
- **State Management:** Vue reactivity system (ref, computed)
- **HTTP Client:** Axios 1.13.2
- **Logging:** Pino logger

### Directory Structure

```
apm-app-store/
├── electron/                    # Electron main process
│   ├── main/
│   │   ├── backend/             # Backend logic (e.g. install manager)
│   │   │   └── install-manager.ts  # Core installation/package management
│   │   ├── deeplink.ts          # Deep link protocol handling
│   │   ├── handle-url-scheme.ts # URL scheme handler
│   │   └── index.ts             # Main process entry point
│   ├── preload/
│   │   └── index.ts             # Preload script (IPC bridge)
│   └── global.ts                # Shared state between processes
├── src/                         # Vue renderer process
│   ├── components/              # Vue components (modals, cards, grids)
│   ├── global/                  # Global config and state
│   │   ├── downloadStatus.ts    # Download queue management
│   │   ├── storeConfig.ts       # API config and shared state
│   │   └── typedefinition.ts    # TypeScript type definitions
│   ├── modeuls/                 # Business logic modules
│   │   └── processInstall.ts    # Install/uninstall logic
│   ├── assets/                  # CSS/images
│   ├── App.vue                  # Root component
│   └── main.ts                  # Renderer entry point
├── extras/                      # Shell scripts and policy files
├── icons/                       # Application icons
├── scripts/                     # Maintenance scripts
├── public/                      # Public assets
├── electron-builder.yml         # Build configuration
├── vite.config.ts               # Vite configuration
├── tsconfig.json                # TypeScript configuration
├── eslint.config.ts             # ESLint configuration
└── package.json                 # Dependencies and scripts
```

---

## 🎯 Core Concepts

### 1. APM Package Manager Integration
The app acts as a GUI frontend for the APM CLI tool (`/opt/apm-store/extras/shell-caller.sh`).

**Key Operations:**
- `apm install -y <pkgname>` - Install package
- `apm remove -y <pkgname>` - Uninstall package
- `apm list --installed` - List installed packages
- `apm list --upgradable` - List upgradable packages

**Important:** All APM operations require privilege escalation via `pkexec` on Linux.

### 2. IPC Communication Pattern

**Main Process (Node.js) ⟷ Renderer Process (Browser)**

```typescript
// In Renderer (Vue):
window.ipcRenderer.send('queue-install', JSON.stringify(download));
window.ipcRenderer.invoke('list-installed');
window.ipcRenderer.on('install-complete', (event, result) => { /* ... */ });

// In Main Process (Electron):
ipcMain.on('queue-install', async (event, download_json) => { /* ... */ });
ipcMain.handle('list-installed', async () => { /* ... */ });
event.sender.send('install-complete', { id, success, ... });
```

**Exposed APIs in Preload:**
- `window.ipcRenderer.on/off/send/invoke` - IPC communication
- `window.apm_store.arch` - System architecture detection (amd64-apm, arm64-apm)

### 3. Installation Queue System

**Location:** `electron/main/backend/install-manager.ts`

**Key Features:**
- Single-task sequential processing (only one installation at a time)
- Task queue managed via `Map<number, InstallTask>`
- Real-time progress streaming via IPC events
- Automatic privilege escalation detection

**Task Lifecycle:**
1. Renderer sends `queue-install` with task ID and package name
2. Main process checks for duplicate tasks
3. Task added to queue with status `queued`
4. `processNextInQueue()` spawns child process
5. stdout/stderr streamed to renderer via `install-log`
6. Completion signaled via `install-complete` with exit code

**Critical Pattern:**
```typescript
// Always check if idle before processing
if (idle) processNextInQueue(0);

// After task completion, check for more tasks
tasks.delete(task.id);
idle = true;
if (tasks.size > 0) processNextInQueue(0);
```

---

## 📝 Type System Guidelines

Important: DO NOT use any in the code!

### Core Types (src/global/typedefinition.ts)

#### App Data Structure
```typescript
// Raw JSON from API (PascalCase)
interface AppJson {
  Name: string;
  Pkgname: string;
  Version: string;
  Filename: string;
  // ... (follows upstream API format)
}

// Normalized app data (camelCase)
interface App {
  name: string;
  pkgname: string;           // Primary identifier
  version: string;
  category: string;          // Added by frontend
  currentStatus: "not-installed" | "installed";
  flags?: string;            // e.g., "automatic" for dependencies
  arch?: string;             // e.g., "amd64", "arm64"
  // ... (full spec in typedefinition.ts)
}
```

#### Download/Installation Task
```typescript
interface DownloadItem {
  id: number;                // Unique task ID
  pkgname: string;           // Package identifier
  status: DownloadItemStatus; // "queued" | "installing" | "completed" | "failed" | "paused"
  progress: number;          // 0-100
  logs: Array<{ time: number; message: string }>;
  retry: boolean;            // Retry flag
  upgradeOnly?: boolean;     // For upgrade operations
  // ... (see full spec)
}
```

#### IPC Payloads
```typescript
interface InstallLog {
  id: number;
  time: number;
  message: string;
}

interface DownloadResult extends InstallLog {
  success: boolean;
  exitCode: number | null;
}
```

---

## 🎨 Vue Component Patterns

### Composition API Best Practices

```typescript
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { Ref } from 'vue';

// Reactive state
const apps: Ref<App[]> = ref([]);
const loading = ref(true);

// Computed properties
const filteredApps = computed(() => {
  return apps.value.filter(/* ... */);
});

// Lifecycle hooks
onMounted(async () => {
  await loadCategories();
  await loadApps();
});

// Methods (use arrow functions or function declarations)
const handleInstall = () => {
  // Implementation
};
</script>
```

### Props and Events Pattern

```typescript
// Props definition
const props = defineProps<{
  app: App | null;
  show: boolean;
}>();

// Emits definition
const emit = defineEmits<{
  close: [];
  install: [];
  remove: [];
}>();

// Usage
emit('install');
```

### IPC Event Listeners in Vue

**Always use in `onMounted` for proper cleanup:**

```typescript
onMounted(() => {
  window.ipcRenderer.on('install-complete', (_event: IpcRendererEvent, result: DownloadResult) => {
    // Handle event
  });

  window.ipcRenderer.on('install-log', (_event: IpcRendererEvent, log: InstallLog) => {
    // Handle log
  });
});
```

---

## 🔧 Main Process Patterns

### Spawning APM Commands

```typescript
import { spawn } from 'node:child_process';

// Check for privilege escalation
const superUserCmd = await checkSuperUserCommand();
const execCommand = superUserCmd.length > 0 ? superUserCmd : SHELL_CALLER_PATH;
const execParams = superUserCmd.length > 0 
  ? [SHELL_CALLER_PATH, 'apm', 'install', '-y', pkgname]
  : ['apm', 'install', '-y', pkgname];

// Spawn process
const child = spawn(execCommand, execParams, {
  shell: true,
  env: process.env,
});

// Stream output
child.stdout.on('data', (data) => {
  webContents.send('install-log', { id, time: Date.now(), message: data.toString() });
});

// Handle completion
child.on('close', (code) => {
  const success = code === 0;
  webContents.send('install-complete', { id, success, exitCode: code, /* ... */ });
});
```

### Parsing APM Output

**APM outputs are text-based with specific formats:**

```typescript
// Installed packages format: "pkgname/repo,version arch [flags]"
// Example: "code/stable,1.108.2 amd64 [installed]"
const parseInstalledList = (output: string) => {
  const apps: InstalledAppInfo[] = [];
  const lines = output.split('\n');
  for (const line of lines) {
    const match = line.trim().match(/^(\S+)\/\S+,\S+\s+(\S+)\s+(\S+)\s+\[(.+)\]$/);
    if (match) {
      apps.push({
        pkgname: match[1],
        version: match[2],
        arch: match[3],
        flags: match[4],
        raw: line.trim(),
      });
    }
  }
  return apps;
};
```

---

## 🌐 API Integration

### Base Configuration

```typescript
// src/global/storeConfig.ts
export const APM_STORE_BASE_URL = 'https://erotica.spark-app.store';

// URL structure:
// /{arch}/{category}/applist.json        - App list
// /{arch}/{category}/{pkgname}/icon.png  - App icon
// /{arch}/{category}/{pkgname}/screen_N.png - Screenshots (1-5)
// /{arch}/categories.json                - Categories mapping
```

### Axios Usage

```typescript
const axiosInstance = axios.create({
  baseURL: APM_STORE_BASE_URL,
  timeout: 1000,  // Note: Very short timeout!
});

// Loading apps by category
const response = await axiosInstance.get<AppJson[]>(
  `/${window.apm_store.arch}/${category}/applist.json`
);
```

**Development Proxy (vite.config.ts):**
```typescript
server: {
  proxy: {
    '/local_amd64-apm': {
      target: 'https://erotica.spark-app.store',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/local_amd64-apm/, ''),
    }
  }
}
```

---

## 🎯 Deep Link Protocol

**URL Scheme:** `apmstore://`

### Supported Actions

1. **Install App:** `apmstore://install?pkg=<pkgname>`
2. **Show Updates:** `apmstore://update`
3. **Show Installed:** `apmstore://installed`

### Implementation Pattern

```typescript
// electron/main/deeplink.ts - Parse command line
export function handleCommandLine(argv: string[]) {
  const deeplinkUrl = argv.find((arg) => arg.startsWith('apmstore://'));
  if (!deeplinkUrl) return;
  
  const url = new URL(deeplinkUrl);
  if (url.hostname === 'install') {
    const pkg = url.searchParams.get('pkg');
    sendToRenderer('deep-link-install', pkg);
  }
}

// src/App.vue - Handle in renderer
window.ipcRenderer.on('deep-link-install', (_event, pkgname: string) => {
  const target = apps.value.find((a) => a.pkgname === pkgname);
  if (target) openDetail(target);
});
```

---

## 🛡️ Security Considerations

### Privilege Escalation

**Always check for `pkexec` availability:**

```typescript
const checkSuperUserCommand = async (): Promise<string> => {
  if (process.getuid && process.getuid() !== 0) {
    const { stdout } = await execAsync('which /usr/bin/pkexec');
    return stdout.trim().length > 0 ? '/usr/bin/pkexec' : '';
  }
  return '';
};
```

### Context Isolation

**Current Status:** Context isolation is **enabled** (default Electron behavior).

**IPC Exposed via Preload (Safe):**
```typescript
// electron/preload/index.ts
contextBridge.exposeInMainWorld('ipcRenderer', {
  on: (...args) => ipcRenderer.on(...args),
  send: (...args) => ipcRenderer.send(...args),
  invoke: (...args) => ipcRenderer.invoke(...args),
});
```

**⚠️ Do NOT enable nodeIntegration or disable contextIsolation!**

---

## 🎨 UI/UX Patterns

### Tailwind CSS Usage

**Dark Mode Support:**
```vue
<div class="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
  <!-- Content -->
</div>
```

**Theme Toggle:**
```typescript
const isDarkTheme = ref(false);

watch(isDarkTheme, (newVal) => {
  localStorage.setItem('theme', newVal ? 'dark' : 'light');
  document.documentElement.classList.toggle('dark', newVal);
});
```

### Modal Pattern

```vue
<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="absolute inset-0 bg-black/50" @click="closeModal"></div>
    <div class="modal-panel relative z-10 bg-white dark:bg-slate-900">
      <!-- Modal content -->
    </div>
  </div>
</template>
```

### Loading States

```typescript
const loading = ref(true);

// In template
<div v-if="loading">Loading...</div>
<div v-else>{{ apps.length }} apps</div>
```

---

## 🧪 Testing & Quality

### ESLint Configuration

```typescript
// eslint.config.ts
export default defineConfig([
  globalIgnores(['**/3rdparty/**', '**/node_modules/**', '**/dist/**', '**/dist-electron/**']),
  tseslint.configs.recommended,
  pluginVue.configs['flat/essential'],
  eslintConfigPrettier,
  eslintPluginPrettierRecommended,
]);
```

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "strict": true,           // Strict mode enabled
    "noEmit": true,           // No emit (Vite handles build)
    "module": "ESNext",
    "target": "ESNext",
    "jsx": "preserve",        // Vue JSX
    "resolveJsonModule": true // Import JSON files
  }
}
```

### Code Quality Commands

```bash
npm run lint         # Run ESLint
npm run lint:fix     # Auto-fix issues
npm run format       # Format with Prettier
```

---

## 🚀 Build & Development

### Development Mode

```bash
npm run dev          # Start dev server (Vite + Electron)
```

**Dev Server:** `http://127.0.0.1:3344/` (port from package.json)

### Production Build

```bash
npm run build        # Build all (deb + rpm)
npm run build:deb    # Build Debian package only
npm run build:rpm    # Build RPM package only
```

**Build Output:**
- `dist-electron/` - Compiled Electron code
- `dist/` - Compiled renderer assets
- Packaged app in project root

### Build Configuration

**electron-builder.yml:**
- App ID: `cn.eu.org.simplelinux.apmstore`
- Linux targets: deb, rpm
- Includes extras/ directory in resources
- Auto-update disabled (Linux package manager handles updates)

---

## 📦 Important Files to Understand

### 1. electron/main/backend/install-manager.ts
**Purpose:** Core package management logic  
**Key Responsibilities:**
- Task queue management
- APM command spawning
- Progress reporting
- Installed/upgradable list parsing

**Critical Functions:**
- `processNextInQueue()` - Task processor
- `parseInstalledList()` - Parse APM output
- `checkSuperUserCommand()` - Privilege escalation

### 2. src/App.vue
**Purpose:** Root component  
**Key Responsibilities:**
- App state management
- Category/app loading
- Modal orchestration
- Deep link handling

### 3. src/global/downloadStatus.ts
**Purpose:** Download queue state  
**Key Features:**
- Reactive download list
- Download item CRUD operations
- Change watchers for UI updates

### 4. electron/preload/index.ts
**Purpose:** Renderer-Main bridge  
**Key Features:**
- IPC API exposure
- Architecture detection
- Loading animation

### 5. vite.config.ts
**Purpose:** Build configuration  
**Key Features:**
- Electron plugin setup
- Dev server proxy
- Tailwind integration

---

## 🐛 Common Pitfalls & Solutions

### 1. Duplicate Task Handling

**Problem:** User clicks install multiple times  
**Solution:**
```typescript
if (tasks.has(id) && !download.retry) {
  logger.warn('Task already exists, ignoring duplicate');
  return;
}
```

### 2. Window Close Behavior

**Problem:** Closing window while tasks are running  
**Solution:**
```typescript
win.on('close', (event) => {
  event.preventDefault();
  if (tasks.size > 0) {
    win.hide();          // Hide instead of closing
    win.setSkipTaskbar(true);
  } else {
    win.destroy();       // Allow close if no tasks
  }
});
```

### 3. App Data Normalization

**Problem:** API returns PascalCase, app uses camelCase  
**Solution:**
```typescript
const normalizedApp: App = {
  name: appJson.Name,
  pkgname: appJson.Pkgname,
  version: appJson.Version,
  // ... map all fields
};
```

### 4. Screenshot Loading

**Problem:** Not all apps have 5 screenshots  
**Solution:**
```typescript
for (let i = 1; i <= 5; i++) {
  const img = new Image();
  img.src = screenshotUrl;
  img.onload = () => screenshots.value.push(screenshotUrl);
  // No onerror handler - silently skip missing images
}
```

---

## 📚 Logging Best Practices

### Pino Logger Usage

```typescript
import pino from 'pino';
const logger = pino({ name: 'module-name' });

// Levels: trace, debug, info, warn, error, fatal
logger.info('Application started');
logger.error({ err }, 'Failed to load apps');
logger.warn(`Package ${pkgname} not found`);
```

### Log Locations

**Development:** Console with `pino-pretty`  
**Production:** Structured JSON to stdout

---

## 🔄 State Management

### Global State (src/global/storeConfig.ts)

```typescript
export const currentApp = ref<App | null>(null);
export const currentAppIsInstalled = ref(false);
```

**Usage Pattern:**
```typescript
import { currentApp, currentAppIsInstalled } from '@/global/storeConfig';

// Set current app
currentApp.value = selectedApp;

// Check installation status
window.ipcRenderer.invoke('check-installed', app.pkgname)
  .then((isInstalled: boolean) => {
    currentAppIsInstalled.value = isInstalled;
  });
```

### Download Queue (src/global/downloadStatus.ts)

```typescript
export const downloads = ref<DownloadItem[]>([]);

// Add download
downloads.value.push(newDownload);

// Remove download
export const removeDownloadItem = (pkgname: string) => {
  const index = downloads.value.findIndex(d => d.pkgname === pkgname);
  if (index !== -1) downloads.value.splice(index, 1);
};

// Watch changes
export const watchDownloadsChange = (callback: () => void) => {
  watch(downloads, callback, { deep: true });
};
```

---

## 🎯 Contribution Guidelines

### When Adding New Features

1. **Add TypeScript types first** (src/global/typedefinition.ts)
2. **Update IPC handlers** if main-renderer communication needed
3. **Follow existing component patterns** (props, emits, setup)
4. **Test with actual APM commands** (don't mock in development)
5. **Update README TODO list** when completing tasks

### Code Style

- **Use TypeScript strict mode** - no `any` types without `eslint-disable`
- **Avoid used of eslint-disable directly** - use `undefined` instead if you really do not know its type.
- **Prefer Composition API** - `<script setup lang="ts">`
- **Use arrow functions** for methods in setup
- **Destructure imports** - `import { ref } from 'vue'`
- **Follow naming conventions:**
  - Components: PascalCase (AppCard.vue)
  - Functions: camelCase (handleInstall)
  - Constants: UPPER_SNAKE_CASE (SHELL_CALLER_PATH)

### Commit Message Format

```
type(scope): subject

Examples:
feat(install): add retry mechanism for failed installations
fix(ui): correct dark mode toggle persistence
refactor(ipc): simplify install manager event handling
docs(readme): update build instructions
```
Add sign off to the commit is recommended.
---

## 🔗 Related Resources

- **APM Project:** https://gitee.com/spark-store-project/AmberPM
- **Electron Docs:** https://www.electronjs.org/docs
- **Vue 3 Docs:** https://vuejs.org/
- **Vite Docs:** https://vitejs.dev/
- **Tailwind CSS:** https://tailwindcss.com/

---

## ⚠️ Known Issues & TODOs

See README.md for more details.

## 🎓 Learning Path for New Contributors

### Phase 1: Understand the Stack
1. Read Vue 3 Composition API docs
2. Review Electron IPC communication patterns
3. Understand APM package manager basics

### Phase 2: Explore the Code
1. Start with `src/App.vue` - see how app state flows
2. Study `electron/main/backend/install-manager.ts` - understand task queue
3. Review `src/global/typedefinition.ts` - learn data structures

### Phase 3: Make Your First Change
1. Pick an item from TODO list (prefer UI improvements first)
2. Create a feature branch
3. Follow code style guidelines
4. Test with actual APM commands
5. Submit PR with clear description

---

## 🤖 AI Agent-Specific Instructions

### When Generating Code

1. **Always check existing patterns first** - search for similar implementations
2. **Maintain type safety** - no implicit any, use explicit types
3. **Follow IPC naming conventions:**
   - Main → Renderer: `kebab-case` (e.g., `install-complete`)
   - Handlers: descriptive names (e.g., `queue-install`, `list-installed`)
4. **Error handling:**
   - Always catch promises
   - Log errors with context
   - Send user-friendly messages to renderer
5. **State updates:**
   - Use Vue reactivity (ref, reactive)
   - Avoid direct array mutations, use spread operator
   - Update UI before async operations complete

### When Fixing Bugs

1. **Reproduce first** - understand the context
2. **Check IPC communication** - many bugs are timing issues
3. **Verify APM output parsing** - format may change
4. **Test edge cases:**
   - Missing packages
   - Network failures
   - Privilege escalation failures
   - Rapid button clicks

### When Refactoring

1. **Don't break IPC contracts** - keep event names and payloads compatible
2. **Preserve type safety** - update types before code
3. **Test installation flow end-to-end**
4. **Update comments and docs**

### MUST DO

1. Lint code 
2. Format code
3. Build vite project to check for errors.
---

**Document Version:** 1.0  
**Last Updated:** 2026-02-12  
**Generated for:** AI Coding Agents working on elysia-best/apm-app-store

---

This document should be updated as the codebase evolves. When in doubt, refer to the actual source code and prioritize type safety and user experience.