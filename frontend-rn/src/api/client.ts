import { router } from 'expo-router';

import { useAuthStore } from '@/stores/auth';
import { showToast } from '@/stores/toast';
import type { ApiBody, UploadResult } from '@/types/api';

// 模拟器访问电脑本机用 10.0.2.2，在 .env 的 EXPO_PUBLIC_API_URL 里改
export const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:5000';
const TIMEOUT = 10000;

export class ApiError extends Error {
  code: number;
  status: number;

  constructor(message: string, code: number, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function resolveImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return BASE_URL + url;
  return BASE_URL + '/' + url;
}

type QueryValue = string | number | boolean | null | undefined;
export type QueryParams = Record<string, QueryValue>;

function buildQuery(params?: QueryParams): string {
  if (!params) return '';
  const parts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(String(v)));
  if (parts.length === 0) return '';
  return '?' + parts.join('&');
}

// 多个请求同时 401 时只跳一次登录页（原项目会叠加多个登录页）
let redirectingToLogin = false;

function handleAuthExpired(): void {
  void useAuthStore.getState().logout();
  showToast('登录已过期，请重新登录');
  if (redirectingToLogin) return;
  redirectingToLogin = true;
  setTimeout(() => {
    router.push('/login');
    redirectingToLogin = false;
  }, 1500);
}

function authHeader(): Record<string, string> {
  const token = useAuthStore.getState().token;
  return { Authorization: 'Bearer ' + (token || '') };
}

async function send<T>(url: string, init: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);
  let res: Response;
  try {
    res = await fetch(BASE_URL + url, { ...init, signal: controller.signal });
  } catch (err) {
    showToast('网络请求失败');
    throw err;
  } finally {
    clearTimeout(timer);
  }

  let body: ApiBody<T> | null = null;
  try {
    body = (await res.json()) as ApiBody<T>;
  } catch {
    body = null;
  }

  if (res.status === 401 || body?.code === 401) {
    handleAuthExpired();
    throw new ApiError(body?.message || '未登录', 401, res.status);
  }
  // 上传接口历史上也返回过 code=200，保持和原 uploadFile 一致
  if (body && (body.code === 0 || body.code === 200)) {
    return body.data;
  }
  // 后端业务错误是 HTTP 400 + {code, message}，优先展示 message
  const message = body?.message || (res.ok ? '请求失败' : '服务器错误 ' + res.status);
  showToast(message);
  throw new ApiError(message, body?.code ?? -1, res.status);
}

function request<T>(method: string, url: string, data?: object): Promise<T> {
  const isQuery = method === 'GET';
  return send<T>(isQuery ? url + buildQuery(data as QueryParams | undefined) : url, {
    method,
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: isQuery || data === undefined ? undefined : JSON.stringify(data),
  });
}

export function get<T>(url: string, params?: QueryParams): Promise<T> {
  return request<T>('GET', url, params);
}

export function post<T>(url: string, data?: object): Promise<T> {
  return request<T>('POST', url, data);
}

export function put<T>(url: string, data?: object): Promise<T> {
  return request<T>('PUT', url, data);
}

export function del<T>(url: string, data?: object): Promise<T> {
  return request<T>('DELETE', url, data);
}

// expo-image-picker 返回的图片
export interface UploadSource {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
}

// 统一文件上传：字段名 file，后端靠文件名后缀决定保存的扩展名
export function uploadFile(url: string, source: UploadSource): Promise<UploadResult> {
  const name = source.fileName || source.uri.split('/').pop() || 'image.jpg';
  const form = new FormData();
  // RN 的 FormData 支持 {uri, name, type} 形式的文件对象，DOM 类型里没有这个重载
  form.append('file', { uri: source.uri, name, type: source.mimeType || 'image/jpeg' } as unknown as Blob);
  return send<UploadResult>(url, { method: 'POST', headers: authHeader(), body: form });
}
