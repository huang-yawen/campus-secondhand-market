import { del, get, post, put, resolveImageUrl, uploadFile, type UploadSource } from './client';
import type { LoginResult, UpdateProfileData, User } from '@/types/api';

export function register(username: string, password: string): Promise<LoginResult> {
  return post('/api/user/register', { username, password });
}

export function login(username: string, password: string): Promise<LoginResult> {
  return post('/api/user/login', { username, password });
}

export function getUserInfo(id: number): Promise<User> {
  return get('/api/user/' + id);
}

export function updateProfile(data: UpdateProfileData): Promise<null> {
  return put('/api/user/profile', data);
}

export function deleteUser(id: number): Promise<null> {
  return del('/api/user/' + id);
}

// 返回可直接显示的完整地址（原项目写死了 127.0.0.1，这里统一走 BASE_URL）
export function uploadAvatar(source: UploadSource): Promise<string> {
  return uploadFile('/api/user/avatar/upload', source).then((res) => resolveImageUrl(res.url));
}
