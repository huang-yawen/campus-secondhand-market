import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { formatDateTime, parseUtc } from '@/lib/time';
import { markNotificationsSeen } from '@/queries/messages';
import { useBuyOrders, useOrderGoods, useSellOrders, type OrderType } from '@/queries/orders';
import { colors, rpx } from '@/theme';
import type { Order, OrderStatus } from '@/types/api';

interface Notice {
  key: string;
  order: Order;
  orderType: OrderType;
}

interface NoticeStyle {
  icon: string;
  bg: string;
  title: string;
  desc: string;
}

// 文案与原页面一致：卖出 / 买入两种视角
const SELL_NOTICE: Record<OrderStatus, NoticeStyle> = {
  completed: { icon: '✅', bg: '#e8f5e9', title: '订单已完成', desc: '' },
  cancelled: { icon: '❌', bg: colors.border, title: '订单已取消', desc: '' },
  pending: { icon: '📦', bg: '#fef5e7', title: '新订单', desc: '买家已下单，等待交易' },
};
const BUY_NOTICE: Record<OrderStatus, NoticeStyle> = {
  completed: { icon: '✅', bg: '#e8f5e9', title: '交易完成', desc: '' },
  cancelled: { icon: '❌', bg: colors.border, title: '订单已取消', desc: '' },
  pending: { icon: '🛒', bg: '#e3f2fd', title: '已下单', desc: '等待双方确认交易' },
};

export default function NotificationsScreen() {
  const queryClient = useQueryClient();
  const sell = useSellOrders();
  const buy = useBuyOrders();

  // 进入页面即视为已读，消息 Tab 角标里的通知数清零
  useEffect(() => {
    void markNotificationsSeen(queryClient);
  }, [queryClient]);

  const notices: Notice[] = [
    ...(sell.data ?? []).map((order) => ({ key: 'sell-' + order.id, order, orderType: 'sold' as const })),
    ...(buy.data ?? []).map((order) => ({ key: 'buy-' + order.id, order, orderType: 'purchased' as const })),
  ].sort((a, b) => parseUtc(b.order.createdAt) - parseUtc(a.order.createdAt));

  return (
    <FlatList
      style={styles.page}
      contentContainerStyle={styles.content}
      data={notices}
      keyExtractor={(n) => n.key}
      renderItem={({ item }) => <NoticeCard notice={item} />}
      ListEmptyComponent={
        sell.isLoading || buy.isLoading ? (
          <Text style={styles.loadingTip}>加载中...</Text>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyText}>暂无通知</Text>
            <Text style={styles.emptyHint}>订单状态变更会在这里提醒你</Text>
          </View>
        )
      }
    />
  );
}

function NoticeCard({ notice }: { notice: Notice }) {
  const { order, orderType } = notice;
  const goods = useOrderGoods(order.itemId);
  const s = (orderType === 'sold' ? SELL_NOTICE : BUY_NOTICE)[order.status];
  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push({ pathname: '/order-detail', params: { id: order.id, type: orderType } })}>
      <View style={[styles.iconWrap, { backgroundColor: s.bg }]}>
        <Text style={styles.icon}>{s.icon}</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.top}>
          <Text style={styles.title}>{s.title}</Text>
          <Text style={styles.time}>{formatDateTime(parseUtc(order.createdAt))}</Text>
        </View>
        {!!s.desc && <Text style={styles.desc}>{s.desc}</Text>}
        <View style={styles.orderBox}>
          <Text style={styles.orderText}>
            {goods.title}  ¥{goods.price}
          </Text>
        </View>
      </View>
      <Text style={styles.arrow}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { padding: rpx(20), gap: rpx(16) },
  card: {
    backgroundColor: colors.white,
    borderRadius: rpx(16),
    padding: rpx(24),
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: rpx(20),
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.03)',
  },
  iconWrap: { width: rpx(80), height: rpx(80), borderRadius: rpx(40), alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: rpx(36) },
  body: { flex: 1 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: rpx(8) },
  title: { fontSize: rpx(28), color: colors.text, fontWeight: '500' },
  time: { fontSize: rpx(22), color: '#cccccc', marginLeft: rpx(12) },
  desc: { fontSize: rpx(24), color: colors.textMuted, lineHeight: rpx(36) },
  orderBox: {
    marginTop: rpx(12),
    backgroundColor: colors.background,
    paddingVertical: rpx(12),
    paddingHorizontal: rpx(16),
    borderRadius: rpx(8),
  },
  orderText: { fontSize: rpx(24), color: colors.textSecondary },
  arrow: { fontSize: rpx(32), color: '#cccccc', marginTop: rpx(24) },
  empty: { alignItems: 'center', paddingTop: rpx(200) },
  emptyIcon: { fontSize: rpx(80), marginBottom: rpx(24) },
  emptyText: { fontSize: rpx(30), color: colors.textMuted, marginBottom: rpx(12) },
  emptyHint: { fontSize: rpx(24), color: '#cccccc' },
  loadingTip: { textAlign: 'center', padding: rpx(60), fontSize: rpx(24), color: '#cccccc' },
});
