import AsyncStorage from '@react-native-async-storage/async-storage';
import { skipToken, useQuery } from '@tanstack/react-query';

import { getMySessions } from '@/api/chat';
import { getMyBuyOrders, getMySellOrders } from '@/api/order';
import { parseUtc } from '@/lib/time';
import { useAuthStore } from '@/stores/auth';
import type { Order } from '@/types/api';

import { queryKeys } from './keys';

const NOTIFY_LAST_SEEN_KEY = 'notifyLastSeen';

// 通知"上次查看时间"是真正需要持久化的本地状态，仍存 AsyncStorage
async function readNotifyLastSeen(): Promise<string> {
  const saved = await AsyncStorage.getItem(NOTIFY_LAST_SEEN_KEY);
  if (saved && !saved.startsWith('1970')) return saved;
  const now = new Date().toISOString();
  await AsyncStorage.setItem(NOTIFY_LAST_SEEN_KEY, now);
  return now;
}

export function useNotifyLastSeen() {
  return useQuery({ queryKey: queryKeys.notifyLastSeen, queryFn: readNotifyLastSeen, staleTime: Infinity });
}

export function useSessions(refetchInterval?: number) {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: queryKeys.sessions(userId ?? 0),
    // 原 tab-bar 拉会话时用 pageSize 50
    queryFn: userId ? () => getMySessions(userId, 1, 50) : skipToken,
    refetchInterval,
  });
}

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

// 消息 Tab 角标 = 聊天未读 + 上次查看通知之后有变动的订单数，每 5 秒刷新（与原 tab-bar 一致）
export function useMessageBadge(): number {
  const sessions = useSessions(5000);
  const sell = useSellOrders(5000);
  const buy = useBuyOrders(5000);
  const lastSeen = useNotifyLastSeen();

  const chatUnread = (sessions.data ?? []).reduce((sum, s) => sum + (s.unreadCount || 0), 0);
  let notifyUnread = 0;
  if (lastSeen.data) {
    const lastSeenMs = new Date(lastSeen.data).getTime();
    const orders = [...(sell.data ?? []), ...(buy.data ?? [])];
    notifyUnread = orders.filter((o) => orderActivityTime(o) > lastSeenMs).length;
  }
  return chatUnread + notifyUnread;
}
