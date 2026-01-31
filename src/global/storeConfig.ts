import { ref } from "vue";
import type { App } from "./typedefinition";

export const APM_STORE_BASE_URL: string = import.meta.env.VITE_APM_STORE_BASE_URL || '';

// 下面的变量用于存储当前应用的信息，其实用在多个组件中
export const currentApp = ref<App | null>(null);
export const currentAppIsInstalled = ref(false);
