import { create } from 'zustand';

// 对应 uni.showToast 的 icon: 'none' | 'success'
export type ToastIcon = 'none' | 'success';

interface ToastState {
  message: string | null;
  icon: ToastIcon;
  // 对应 uni.showLoading 的文字；null 表示不显示
  loading: string | null;
}

export const useToastStore = create<ToastState>(() => ({ message: null, icon: 'none', loading: null }));

let hideTimer: ReturnType<typeof setTimeout> | undefined;

// 可在组件外调用（api 层也要弹提示），新提示会顶掉旧提示
export function showToast(message: string, icon: ToastIcon = 'none'): void {
  clearTimeout(hideTimer);
  useToastStore.setState({ message, icon });
  hideTimer = setTimeout(() => useToastStore.setState({ message: null }), 1500);
}

export function showLoading(text: string): void {
  useToastStore.setState({ loading: text });
}

export function hideLoading(): void {
  useToastStore.setState({ loading: null });
}
