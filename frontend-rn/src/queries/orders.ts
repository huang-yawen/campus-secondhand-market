import { skipToken, useQuery } from '@tanstack/react-query';

import { resolveImageUrl } from '@/api/client';
import { getMyBuyOrders, getMySellOrders } from '@/api/order';
import { checkReviewed } from '@/api/review';
import { getWallet } from '@/api/wallet';
import { parseUtc } from '@/lib/time';
import { useAuthStore } from '@/stores/auth';
import type { Order, OrderStatus } from '@/types/api';

import { useGoodsDetail } from './items';
import { queryKeys } from './keys';

// 订单详情页的 type 参数：sold=我卖出的，purchased=我买入的（与原项目一致）
export type OrderType = 'sold' | 'purchased';

// 后端状态是小写（原页面按大写 PENDING 判断，导致取消/完成按钮从不出现）
export const ORDER_STATUS_TEXT: Record<OrderStatus, string> = {
  pending: '待交易',
  completed: '已完成',
  cancelled: '已取消',
};

export function useSellOrders(refetchInterval?: number) {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: queryKeys.sellOrders(userId ?? 0),
    queryFn: userId ? () => getMySellOrders(userId) : skipToken,
    refetchInterval,
  });
}

export function useBuyOrders(refetchInterval?: number) {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: queryKeys.buyOrders(userId ?? 0),
    queryFn: userId ? () => getMyBuyOrders(userId) : skipToken,
    refetchInterval,
  });
}

// 订单的"变动时间"（毫秒）。原项目读的 completeTime/cancelTime/createTime 后端都不返回，
// 导致通知未读永远是 0；后端实际字段是 updatedAt / createdAt（UTC）
export function orderActivityTime(order: Order): number {
  return parseUtc(order.updatedAt || order.createdAt);
}

// 后端订单不带商品标题/价格/图片（原页面读的 itemTitle/price/itemImageUrl 都不存在），
// 这里按 itemId 查商品详情补齐；同一商品只请求一次（有缓存）
export function useOrderGoods(itemId: number) {
  const goods = useGoodsDetail(itemId).data;
  return {
    title: goods?.title ?? '商品 #' + itemId,
    price: goods?.price ?? '',
    image: resolveImageUrl(goods?.coverUrl || goods?.imageUrls[0]),
  };
}

export function useReviewChecked(orderId: number, enabled: boolean) {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: queryKeys.reviewChecked(orderId),
    queryFn: enabled && userId ? () => checkReviewed(orderId, userId) : skipToken,
  });
}

export function useWallet() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: queryKeys.wallet(userId ?? 0),
    queryFn: userId ? () => getWallet(userId) : skipToken,
  });
}
