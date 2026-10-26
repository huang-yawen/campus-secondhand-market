import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';

import { OptionPicker } from '@/components/OptionPicker';
import { colors, primaryGradient, rpx } from '@/theme';

// 发布表单 / 商品编辑共用的表单控件，样式取自原 publish-form.vue 与 goods-edit.vue（两者一致）

export function FormCard({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export function FormItem({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <View style={styles.item}>
      <Text style={styles.label}>
        {label}
        {hint && <Text style={styles.labelHint}>{hint}</Text>}
      </Text>
      {children}
    </View>
  );
}

interface FormInputProps {
  value: string;
  onChange: (text: string) => void;
  placeholder: string;
  maxLength?: number;
  keyboardType?: KeyboardTypeOptions;
}

export function FormInput({ value, onChange, placeholder, maxLength, keyboardType }: FormInputProps) {
  return (
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={colors.placeholder}
      maxLength={maxLength}
      keyboardType={keyboardType}
    />
  );
}

// 带 ¥ 前缀的金额输入（原 type="digit"）
export function PriceInput({ value, onChange, placeholder }: FormInputProps) {
  return (
    <View style={styles.priceBox}>
      <Text style={styles.priceUnit}>¥</Text>
      <TextInput
        style={[styles.input, styles.priceInput]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        keyboardType="decimal-pad"
      />
    </View>
  );
}

interface PickerFieldProps {
  value: string;
  placeholder: string;
  options: string[];
  onSelect: (index: number) => void;
}

// 点击后从底部弹出选项，替代 <picker :range>
export function PickerField({ value, placeholder, options, onSelect }: PickerFieldProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable style={styles.pickerBox} onPress={() => setOpen(true)}>
        <Text style={styles.pickerText}>{value || placeholder}</Text>
      </Pressable>
      <OptionPicker visible={open} options={options} onSelect={onSelect} onClose={() => setOpen(false)} />
    </>
  );
}

export function FormTextarea({ value, onChange, placeholder, maxLength }: FormInputProps) {
  return (
    <TextInput
      style={[styles.input, styles.textarea]}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={colors.placeholder}
      maxLength={maxLength}
      multiline
      textAlignVertical="top"
    />
  );
}

export function SubmitButton({ title, disabled, onPress }: { title: string; disabled?: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.submit, disabled && styles.submitDisabled]} disabled={disabled} onPress={onPress}>
      <Text style={styles.submitText}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, margin: rpx(20), borderRadius: rpx(20), padding: rpx(30) },
  item: { marginBottom: rpx(36) },
  label: { fontSize: rpx(28), color: colors.text, fontWeight: 'bold', marginBottom: rpx(16) },
  labelHint: { fontSize: rpx(24), color: colors.textMuted, fontWeight: 'normal' },
  input: {
    height: rpx(80),
    backgroundColor: colors.background,
    borderRadius: rpx(12),
    paddingHorizontal: rpx(20),
    paddingVertical: 0,
    fontSize: rpx(28),
    color: colors.text,
  },
  priceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: rpx(12),
    paddingLeft: rpx(20),
  },
  priceUnit: { fontSize: rpx(32), color: colors.price, fontWeight: 'bold', marginRight: rpx(4) },
  priceInput: { flex: 1, paddingLeft: rpx(8) },
  pickerBox: {
    height: rpx(80),
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderRadius: rpx(12),
    paddingHorizontal: rpx(20),
  },
  pickerText: { fontSize: rpx(28), color: colors.text },
  textarea: { height: rpx(180), paddingVertical: rpx(20) },
  submit: {
    height: rpx(88),
    marginTop: rpx(40),
    borderRadius: rpx(44),
    backgroundImage: primaryGradient,
    boxShadow: '0 4px 12px rgba(0, 97, 60, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: colors.white, fontSize: rpx(32), fontWeight: 'bold' },
});
