import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuthStore } from '@/stores/auth';
import { colors, rpx } from '@/theme';

// 占位页：批次 F 迁移。临时放一个登录入口，便于批次 A 验收登录流程
export default function MyScreen() {
  const user = useAuthStore((s) => s.user);

  return (
    <View style={styles.page}>
      <Text style={styles.text}>我的（批次 F 迁移）</Text>
      {user ? (
        <Text style={styles.text}>当前登录：{user.nickname || user.username}</Text>
      ) : (
        <Pressable style={styles.btn} onPress={() => router.push('/login')}>
          <Text style={styles.btnText}>去登录</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: rpx(24) },
  text: { fontSize: rpx(28), color: colors.textMuted },
  btn: { paddingVertical: rpx(16), paddingHorizontal: rpx(60), borderRadius: rpx(44), backgroundColor: colors.primary },
  btnText: { fontSize: rpx(28), color: colors.white },
});
