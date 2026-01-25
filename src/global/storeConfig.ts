import { ref } from "vue";

export const APM_STORE_BASE_URL=import.meta.env.VITE_APM_STORE_BASE_URL;
export const APM_STORE_ARCHITECTURE='amd64-apm';
export const currentApp = ref<any>(null);