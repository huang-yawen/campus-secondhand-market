import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, rpx } from '@/theme';

interface OptionPickerProps {
  visible: boolean;
  options: string[];
  onSelect: (index: number) => void;
  onClose: () => void;
}

// 底部选项弹层，替代 uni 的 <picker> 和 showActionSheet
export function OptionPicker({ visible, options, onSelect, onClose }: OptionPickerProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.mask} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom }]}>
        <ScrollView style={styles.list}>
          {options.map((label, index) => (
            <Pressable
              key={label + index}
              style={styles.option}
              onPress={() => {
                onClose();
                onSelect(index);
              }}>
              <Text style={styles.optionText}>{label}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <Pressable style={[styles.option, styles.cancel]} onPress={onClose}>
          <Text style={[styles.optionText, styles.cancelText]}>取消</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  mask: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: rpx(24),
    borderTopRightRadius: rpx(24),
    overflow: 'hidden',
  },
  list: { maxHeight: rpx(800) },
  option: {
    height: rpx(100),
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  optionText: { fontSize: rpx(30), color: colors.text },
  cancel: { borderTopWidth: rpx(12), borderTopColor: colors.background, borderBottomWidth: 0 },
  cancelText: { color: colors.textMuted },
});
