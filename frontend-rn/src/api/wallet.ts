import { get } from './client';
import type { Wallet } from '@/types/api';

export function getWallet(userId: number): Promise<Wallet> {
  return get('/api/user/wallet', { userId });
}
