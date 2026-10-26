import { get, post, put } from './client';
import type { WantedCard, WantedData, WantedDetail, WantedListParams } from '@/types/api';

export function publishWanted(data: WantedData): Promise<WantedDetail> {
  return post('/api/wanted', data);
}

export function getWantedList(params: WantedListParams): Promise<WantedCard[]> {
  return get('/api/wanted/list', { ...params });
}

export function getWantedDetail(id: number): Promise<WantedDetail> {
  return get('/api/wanted/' + id);
}

export function updateWanted(id: number, data: WantedData): Promise<null> {
  return put('/api/wanted/' + id, data);
}

export function getMyWanted(userId: number): Promise<WantedCard[]> {
  return get('/api/wanted/my', { userId });
}

export function closeWanted(id: number, userId: number): Promise<null> {
  return put('/api/wanted/' + id + '/close?userId=' + userId);
}
