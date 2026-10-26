import type { SearchParams } from '@/types/api';

// 所有 queryKey 集中定义，失效刷新时按前缀匹配（如 ['orders'] 会命中买入和卖出）
export const queryKeys = {
  categories: ['categories'] as const,
  // 首页、搜索等商品列表都以 'items' 开头，发布/上下架后统一 invalidate(['items'])
  itemSearch: (params: Omit<SearchParams, 'page' | 'size'>) => ['items', 'search', params] as const,
  goods: (id: number) => ['goods', id] as const,
  user: (id: number) => ['user', id] as const,
  favorites: (userId: number) => ['favorites', userId] as const,
  sessions: (userId: number) => ['chat', 'sessions', userId] as const,
  sellOrders: (userId: number) => ['orders', 'sell', userId] as const,
  buyOrders: (userId: number) => ['orders', 'buy', userId] as const,
  notifyLastSeen: ['notifyLastSeen'] as const,
};
