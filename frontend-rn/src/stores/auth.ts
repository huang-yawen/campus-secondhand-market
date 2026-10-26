import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

import type { User } from '@/types/api';

// token 放 SecureStore（加密），user 体积较大放 AsyncStorage
const TOKEN_KEY = 'token';
const USER_KEY = 'user';

interface AuthState {
  token: string | null;
  user: User | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setAuth: (token: string, user: User) => Promise<void>;
  updateUser: (patch: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  hydrated: false,

  // 启动时从本地恢复登录态；和原项目一样，没有 token 的 user 视为无效并清掉
  hydrate: async () => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (!token) {
      await AsyncStorage.removeItem(USER_KEY);
      set({ token: null, user: null, hydrated: true });
      return;
    }
    const raw = await AsyncStorage.getItem(USER_KEY);
    set({ token, user: raw ? (JSON.parse(raw) as User) : null, hydrated: true });
  },

  setAuth: async (token, user) => {
    set({ token, user });
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  updateUser: async (patch) => {
    const current = get().user;
    if (!current) return;
    const user = { ...current, ...patch };
    set({ user });
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  logout: async () => {
    set({ token: null, user: null });
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
  },
}));
