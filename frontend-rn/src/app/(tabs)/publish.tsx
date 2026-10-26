import { StyleSheet, Text, View } from 'react-native';

import { colors, rpx } from '@/theme';

// 占位页：批次 C 迁移
export default function PublishScreen() {
  return (
    <View style={styles.page}>
      <Text style={styles.text}>发布（批次 C 迁移）</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: rpx(28), color: colors.textMuted },
});
