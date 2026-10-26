import { skipToken, useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { getCategories, getItemDetail, searchItems } from '@/api/item';
import { getUserInfo } from '@/api/user';
import type { Category, SearchParams } from '@/types/api';

import { queryKeys } from './keys';

const PAGE_SIZE = 10;

// 分类接口失败时的兜底，与原首页/搜索页一致
const FALLBACK_CATEGORIES: Category[] = [
  { id: 1, name: '数码电子', isActive: true },
  { id: 2, name: '书籍教材', isActive: true },
  { id: 3, name: '生活用品', isActive: true },
  { id: 4, name: '运动户外', isActive: true },
  { id: 5, name: '服饰鞋包', isActive: true },
  { id: 6, name: '其他', isActive: true },
];

export function useCategories(): Category[] {
  const query = useQuery({ queryKey: queryKeys.categories, queryFn: getCategories, staleTime: 5 * 60 * 1000 });
  if (query.isError) return FALLBACK_CATEGORIES;
  return query.data ?? [];
}

// 商品分页列表（首页、搜索共用）。后端分页字段是 total_pages
export function useGoodsSearch(params: Omit<SearchParams, 'page' | 'size'>, enabled = true) {
  return useInfiniteQuery({
    queryKey: queryKeys.itemSearch(params),
    queryFn: ({ pageParam }) => searchItems({ ...params, page: pageParam, size: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.total_pages ? last.page + 1 : undefined),
    enabled,
  });
}

export function useGoodsDetail(id: number | undefined) {
  return useQuery({
    queryKey: queryKeys.goods(id ?? 0),
    queryFn: id ? () => getItemDetail(id) : skipToken,
  });
}

export function useUserInfo(id: number | undefined) {
  return useQuery({
    queryKey: queryKeys.user(id ?? 0),
    queryFn: id ? () => getUserInfo(id) : skipToken,
  });
}
