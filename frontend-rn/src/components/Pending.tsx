import { StyleSheet, Text, View } from 'react-native';

import { colors, rpx } from '@/theme';

// 尚未迁移页面的占位，避免跳转到不存在的路由
export function Pending({ name, batch }: { name: string; batch: string }) {
  return (
    <View style={styles.page}>
      <Text style={styles.text}>
        {name}（批次 {batch} 迁移）
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: rpx(28), color: colors.textMuted },
});
