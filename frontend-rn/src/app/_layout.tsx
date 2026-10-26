import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { Toast } from '@/components/Toast';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/stores/auth';
import { colors } from '@/theme';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ iconfont: require('@/assets/fonts/iconfont.ttf') });
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    void useAuthStore.getState().hydrate();
  }, []);

  // 字体加载失败也放行，只是图标显示不出来，不至于卡在启动页
  const ready = (fontsLoaded || fontError !== null) && hydrated;

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      {/* 导航栏样式对应原 pages.json 的 globalStyle */}
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.navBar },
          headerTintColor: colors.white,
          headerTitleAlign: 'center',
          contentStyle: { backgroundColor: colors.background },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: '登录/注册' }} />
        {/* 原 pages.json 里 navigationStyle: custom 的页面自己画顶栏 */}
        <Stack.Screen name="search" options={{ headerShown: false }} />
        <Stack.Screen name="goods-detail" options={{ title: '商品详情' }} />
        <Stack.Screen name="goods-edit" options={{ headerShown: false }} />
        <Stack.Screen name="publish-form" options={{ title: '发布' }} />
        <Stack.Screen name="wanted-detail" options={{ title: '求购详情' }} />
        <Stack.Screen name="buy" options={{ headerShown: false }} />
        <Stack.Screen name="order-detail" options={{ title: '订单详情' }} />
        {/* 标题由页面按 type 设置为"已售订单/已购订单" */}
        <Stack.Screen name="my-orders" options={{ title: '我的订单' }} />
        <Stack.Screen name="my-review" options={{ title: '评价' }} />
        <Stack.Screen name="my-wallet" options={{ title: '我的钱包' }} />
        <Stack.Screen name="notifications" options={{ title: '通知' }} />
        {/* 以下为占位页，迁移时再按原页面调整 */}
        <Stack.Screen name="profile" options={{ title: '用户主页' }} />
        <Stack.Screen name="chat" options={{ title: '聊天' }} />
      </Stack>
      <Toast />
    </QueryClientProvider>
  );
}
