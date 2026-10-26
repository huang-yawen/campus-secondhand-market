import { StyleSheet, Text, View } from 'react-native';

import { useToastStore } from '@/stores/toast';
import { colors, rpx } from '@/theme';

// 全局轻提示，挂在根布局里，调用方用 showToast()
export function Toast() {
  const message = useToastStore((s) => s.message);
  const icon = useToastStore((s) => s.icon);
  if (!message) return null;

  return (
    <View pointerEvents="none" style={styles.overlay}>
      <View style={[styles.box, icon === 'success' && styles.boxWithIcon]}>
        {icon === 'success' && <Text style={styles.icon}>✓</Text>}
        <Text style={styles.text}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    maxWidth: '70%',
    backgroundColor: 'rgba(17, 17, 17, 0.7)',
    borderRadius: rpx(10),
    paddingVertical: rpx(20),
    paddingHorizontal: rpx(30),
    alignItems: 'center',
  },
  boxWithIcon: {
    minWidth: rpx(240),
    paddingVertical: rpx(36),
  },
  icon: {
    fontSize: rpx(60),
    color: colors.white,
    marginBottom: rpx(12),
  },
  text: {
    fontSize: rpx(28),
    color: colors.white,
    textAlign: 'center',
  },
});
