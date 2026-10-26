import { get, post, put, uploadFile, type UploadSource } from './client';
import type {
  Category,
  GoodsCard,
  GoodsDetail,
  GoodsPublishData,
  Page,
  SearchParams,
  UserItemsParams,
} from '@/types/api';

export function getCategories(): Promise<Category[]> {
  return get('/api/categories');
}

export function publishItem(data: GoodsPublishData): Promise<GoodsDetail> {
  return post('/api/items/publish', data);
}

export function getItemDetail(id: number): Promise<GoodsDetail> {
  return get('/api/items/' + id);
}

export function searchItems(params: SearchParams): Promise<Page<GoodsCard>> {
  return get('/api/items/search', { ...params });
}

export function getUserItems(userId: number, params?: UserItemsParams): Promise<Page<GoodsCard>> {
  return get('/api/items/user/' + userId, { ...params });
}

export function updateItem(id: number, data: GoodsPublishData): Promise<null> {
  return put('/api/items/' + id, data);
}

export function offlineItem(id: number, userId: number): Promise<null> {
  return put('/api/items/' + id + '/offline?userId=' + userId);
}

export function onlineItem(id: number, userId: number): Promise<null> {
  return put('/api/items/' + id + '/online?userId=' + userId);
}

export function uploadImage(source: UploadSource): Promise<string> {
  return uploadFile('/api/items/images/upload', source).then((res) => res.url);
}
