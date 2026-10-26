import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { useMessageBadge } from '@/queries/messages';
import { colors, rpx } from '@/theme';

interface TabConfig {
  text: string;
  icon: IconName;
  selectedIcon: IconName;
}

// key 是 src/app/(tabs) 下的路由文件名，图标与原 components/tab-bar.vue 一致
const TABS: Record<string, TabConfig> = {
  index: { text: '首页', icon: 'shouye1', selectedIcon: 'shouye' },
  wanted: { text: '求购', icon: 'remenqiugou', selectedIcon: 'remenqiugou' },
  publish: { text: '发布', icon: 'fabu-', selectedIcon: 'fabudianjizhuangtai-' },
  messages: { text: '消息', icon: 'xiaoxi', selectedIcon: 'xiaoxi2' },
  my: { text: '我的', icon: 'wode-copy', selectedIcon: 'wode' },
};

export function TabBar({ state, navigateToTab, insets }: BottomTabBarProps) {
  const badge = useMessageBadge();

  return (
    <View style={[styles.bar, { height: rpx(100) + insets.bottom, paddingBottom: insets.bottom }]}>
      {state.routes.map((route, index) => {
        const tab = TABS[route.name];
        if (!tab) return null;
        const focused = state.index === index;
        const color = focused ? colors.primary : colors.tabInactive;
        const showBadge = route.name === 'messages' && badge > 0;

        return (
          <Pressable
            key={route.key}
            style={styles.item}
            onPress={() => {
              if (!focused) navigateToTab(route.key);
            }}>
            {focused && <View style={styles.indicator} />}
            <View>
              <Icon name={focused ? tab.selectedIcon : tab.icon} size={rpx(50)} color={color} />
              {showBadge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.text, { color }, focused && styles.textActive]}>{tab.text}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  item: {
    flex: 1,
    height: rpx(100),
    alignItems: 'center',
    justifyContent: 'center',
    gap: rpx(4),
  },
  indicator: {
    position: 'absolute',
    top: 0,
    width: rpx(48),
    height: rpx(6),
    backgroundColor: colors.primary,
    borderBottomLeftRadius: rpx(6),
    borderBottomRightRadius: rpx(6),
  },
  badge: {
    position: 'absolute',
    top: rpx(-10),
    right: rpx(-16),
    minWidth: rpx(32),
    height: rpx(32),
    paddingHorizontal: rpx(8),
    borderRadius: rpx(16),
    backgroundColor: colors.price,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.white,
    fontSize: rpx(20),
  },
  text: {
    fontSize: rpx(20),
    lineHeight: rpx(24),
  },
  textActive: {
    fontWeight: 'bold',
  },
});
