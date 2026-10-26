import type { SearchParams } from '@/types/api';

// 所有 queryKey 集中定义，失效刷新时按前缀匹配（如 ['orders'] 会命中买入和卖出）
export const queryKeys = {
  categories: ['categories'] as const,
  // 首页、搜索等商品列表都以 'items' 开头，发布/上下架后统一 invalidate(['items'])
  itemSearch: (params: Omit<SearchParams, 'page' | 'size'>) => ['items', 'search', params] as const,
  goods: (id: number) => ['goods', id] as const,
  user: (id: number) => ['user', id] as const,
  favorites: (userId: number) => ['favorites', userId] as const,
  // 求购相关都以 'wanted' 开头，发布/编辑/结束后统一 invalidate(['wanted'])
  wantedList: ['wanted', 'list'] as const,
  wanted: (id: number) => ['wanted', 'detail', id] as const,
  sessions: (userId: number) => ['chat', 'sessions', userId] as const,
  // 订单都以 'orders' 开头，下单/取消/完成后统一 invalidate(['orders'])
  sellOrders: (userId: number) => ['orders', 'sell', userId] as const,
  buyOrders: (userId: number) => ['orders', 'buy', userId] as const,
  reviewChecked: (orderId: number) => ['reviewChecked', orderId] as const,
  wallet: (userId: number) => ['wallet', userId] as const,
  notifyLastSeen: ['notifyLastSeen'] as const,
};
