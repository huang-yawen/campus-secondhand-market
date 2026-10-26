import { Tabs } from 'expo-router/js-tabs';

import { TabBar } from '@/components/TabBar';
import { colors } from '@/theme';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: colors.navBar },
        headerTintColor: colors.white,
        headerTitleAlign: 'center',
        sceneStyle: { backgroundColor: colors.background },
      }}>
      <Tabs.Screen name="index" options={{ title: '校园闲置宝' }} />
      <Tabs.Screen name="wanted" options={{ title: '求购' }} />
      <Tabs.Screen name="publish" options={{ title: '发布商品' }} />
      <Tabs.Screen name="messages" options={{ title: '消息' }} />
      <Tabs.Screen name="my" options={{ title: '我的' }} />
    </Tabs>
  );
}
