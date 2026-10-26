import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, primaryGradient, rpx } from '@/theme';

// 原 navigationStyle: custom 页面的绿色渐变顶栏：返回键 + 居中标题
export function PageHeader({ title }: { title: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <Pressable style={styles.back} onPress={() => router.back()}>
        <Text style={styles.backIcon}>‹</Text>
      </Pressable>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.placeholder} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: rpx(20),
    paddingBottom: rpx(20),
    backgroundImage: primaryGradient,
  },
  back: { width: rpx(60), height: rpx(60), alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: rpx(80), lineHeight: rpx(80), color: colors.white, fontWeight: '300' },
  title: { fontSize: rpx(36), color: colors.white, fontWeight: 'bold' },
  placeholder: { width: rpx(60) },
});
