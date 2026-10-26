import { del, get, post } from './client';
import type { Favorite } from '@/types/api';

export function addFavorite(itemId: number, userId: number): Promise<null> {
  return post('/api/favorites/' + itemId + '?userId=' + userId);
}

export function removeFavorite(itemId: number, userId: number): Promise<null> {
  return del('/api/favorites/' + itemId + '?userId=' + userId);
}

export function getMyFavorites(userId: number, pageNum = 1, pageSize = 10): Promise<Favorite[]> {
  return get('/api/favorites', { userId, pageNum, pageSize });
}

export function addWantedFavorite(wantedId: number, userId: number): Promise<null> {
  return post('/api/favorites/wanted/' + wantedId + '?userId=' + userId);
}

export function removeWantedFavorite(wantedId: number, userId: number): Promise<null> {
  return del('/api/favorites/wanted/' + wantedId + '?userId=' + userId);
}
