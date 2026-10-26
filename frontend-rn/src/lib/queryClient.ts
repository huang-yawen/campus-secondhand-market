import { focusManager, QueryClient } from '@tanstack/react-query';
import { AppState } from 'react-native';

// RN 里 TanStack Query 感知不到前后台切换，这里接上 AppState：
// 切到后台时轮询自动暂停，回到前台时自动刷新
focusManager.setEventListener((handleFocus) => {
  const sub = AppState.addEventListener('change', (status) => handleFocus(status === 'active'));
  return () => sub.remove();
});

export const queryClient = new QueryClient({
  defaultOptions: {
    // 失败提示已经在 api 层弹过，不重试，避免同一个错误弹多次
    queries: { retry: false },
    mutations: { retry: false },
  },
});
