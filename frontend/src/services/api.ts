import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  withCredentials: true,
  timeout: 15000,
});
let accessToken: string | null = null;
export const setToken = (token: string | null) => {
  accessToken = token;
};
api.interceptors.request.use((config) => {
  if (accessToken && config.headers.Authorization === undefined)
    config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});
let renew: (() => Promise<void>) | undefined;
let inFlight: Promise<void> | null = null;
export const installRefresh = (handler: () => Promise<void>) => {
  renew = handler;
};
export function refreshOnce(handler: () => Promise<void>) {
  if (!inFlight)
    inFlight = handler().finally(() => {
      inFlight = null;
    });
  return inFlight;
}
api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const config = error.config as (InternalAxiosRequestConfig & { retried?: boolean }) | undefined;
    if (
      error.response?.status === 401 &&
      config &&
      !config.retried &&
      renew &&
      !config.url?.includes('/auth/')
    ) {
      config.retried = true;
      await refreshOnce(renew);
      config.headers.delete('Authorization');
      return api(config);
    }
    return Promise.reject(error);
  },
);
export async function csrf() {
  const { data } = await api.get<{ token: string }>('/auth/csrf', {
    headers: { Authorization: '' },
  });
  return { 'X-CSRF-TOKEN': data.token };
}
export function errorMessage(error: unknown) {
  if (axios.isAxiosError(error))
    return String(error.response?.data?.detail || 'Không thể kết nối. Vui lòng thử lại.');
  return 'Vui lòng thử lại.';
}
