import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { login, register } from '@/api/user';
import { useAuthStore } from '@/stores/auth';
import { showToast } from '@/stores/toast';
import { colors, primaryGradient, rpx } from '@/theme';
import type { LoginResult } from '@/types/api';

type AuthTab = 'login' | 'register';

export default function LoginScreen() {
  const [activeTab, setActiveTab] = useState<AuthTab>('login');
  const [submitting, setSubmitting] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');

  async function finish(data: LoginResult, toast: string, after: () => void) {
    await useAuthStore.getState().setAuth(data.token, data.user);
    showToast(toast);
    setTimeout(after, 800);
  }

  async function onLogin() {
    if (!username.trim()) return showToast('请输入用户名');
    if (!password) return showToast('请输入密码');
    setSubmitting(true);
    try {
      const data = await login(username.trim(), password);
      // 对应原 uni.switchTab：回到首页并关闭上面所有非 Tab 页
      await finish(data, '登录成功', () => router.dismissTo('/'));
    } catch {
      // 错误提示已在 api 层处理
    } finally {
      setSubmitting(false);
    }
  }

  async function onRegister() {
    if (!regUsername.trim()) return showToast('请输入用户名');
    if (!regPassword) return showToast('请输入密码');
    if (regPassword !== regConfirm) return showToast('两次密码不一致');
    setSubmitting(true);
    try {
      const data = await register(regUsername.trim(), regPassword);
      await finish(data, '注册成功', () => router.back());
    } catch {
      // 错误提示已在 api 层处理
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.appName}>校园闲置宝</Text>
        <Text style={styles.slogan}>让闲置流动起来</Text>
      </View>

      <View style={styles.tabRow}>
        {(['login', 'register'] as const).map((tab) => {
          const active = activeTab === tab;
          return (
            <Pressable key={tab} style={styles.tabItem} onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab === 'login' ? '登录' : '注册'}</Text>
              {active && <View style={styles.tabLine} />}
            </Pressable>
          );
        })}
      </View>

      {activeTab === 'login' ? (
        <View style={styles.formCard}>
          <Field label="用户名" value={username} onChange={setUsername} placeholder="请输入用户名" />
          <Field label="密码" value={password} onChange={setPassword} placeholder="请输入密码" secure />
          <SubmitButton title="登录" disabled={submitting} onPress={onLogin} />
        </View>
      ) : (
        <View style={styles.formCard}>
          <Field label="用户名" value={regUsername} onChange={setRegUsername} placeholder="请输入用户名" maxLength={20} />
          <Field label="密码" value={regPassword} onChange={setRegPassword} placeholder="请输入密码" secure />
          <Field label="确认密码" value={regConfirm} onChange={setRegConfirm} placeholder="请再次输入密码" secure />
          <SubmitButton title="注册" disabled={submitting} onPress={onRegister} />
        </View>
      )}
    </ScrollView>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (text: string) => void;
  placeholder: string;
  secure?: boolean;
  maxLength?: number;
}

function Field({ label, value, onChange, placeholder, secure, maxLength }: FieldProps) {
  return (
    <View style={styles.formItem}>
      <Text style={styles.formLabel}>{label}</Text>
      <TextInput
        style={styles.formInput}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        secureTextEntry={secure}
        maxLength={maxLength}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

function SubmitButton({ title, disabled, onPress }: { title: string; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.submitBtn, disabled && styles.submitBtnDisabled]} disabled={disabled} onPress={onPress}>
      <Text style={styles.submitText}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: rpx(80) },
  header: {
    backgroundImage: primaryGradient,
    paddingTop: rpx(80),
    paddingBottom: rpx(60),
    alignItems: 'center',
  },
  appName: {
    fontSize: rpx(56),
    color: colors.white,
    fontWeight: 'bold',
    letterSpacing: rpx(8),
    marginBottom: rpx(12),
  },
  slogan: { fontSize: rpx(26), color: 'rgba(255, 255, 255, 0.8)' },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    marginTop: rpx(20),
    marginHorizontal: rpx(20),
    borderTopLeftRadius: rpx(16),
    borderTopRightRadius: rpx(16),
    overflow: 'hidden',
  },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: rpx(28) },
  tabText: { fontSize: rpx(30), color: colors.textSecondary },
  tabTextActive: { color: colors.primary, fontWeight: 'bold' },
  tabLine: {
    position: 'absolute',
    bottom: 0,
    width: rpx(48),
    height: rpx(6),
    borderRadius: rpx(3),
    backgroundColor: colors.primary,
  },
  formCard: {
    backgroundColor: colors.white,
    marginHorizontal: rpx(20),
    paddingTop: rpx(40),
    paddingHorizontal: rpx(30),
    paddingBottom: rpx(50),
    borderBottomLeftRadius: rpx(16),
    borderBottomRightRadius: rpx(16),
  },
  formItem: { marginBottom: rpx(36) },
  formLabel: { fontSize: rpx(28), color: colors.text, fontWeight: 'bold', marginBottom: rpx(16) },
  formInput: {
    height: rpx(84),
    backgroundColor: colors.background,
    borderRadius: rpx(12),
    paddingHorizontal: rpx(20),
    fontSize: rpx(28),
    color: colors.text,
  },
  submitBtn: {
    height: rpx(88),
    marginTop: rpx(20),
    borderRadius: rpx(44),
    backgroundImage: primaryGradient,
    boxShadow: '0 4px 12px rgba(0, 97, 60, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: colors.white, fontSize: rpx(32), fontWeight: 'bold' },
});
