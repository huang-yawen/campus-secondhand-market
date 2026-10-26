import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { formatDateTime, parseUtc } from '@/lib/time';
import { ORDER_STATUS_TEXT, useBuyOrders, useOrderGoods, useSellOrders, type OrderType } from '@/queries/orders';
import { colors, rpx } from '@/theme';
import type { Order, OrderStatus } from '@/types/api';

const STATUS_STYLE: Record<OrderStatus, { color: string; backgroundColor: string }> = {
  completed: { color: '#2E7D32', backgroundColor: '#e8f5e9' },
  pending: { color: '#f0ad4e', backgroundColor: '#fef5e7' },
  cancelled: { color: colors.textMuted, backgroundColor: colors.border },
};

export default function MyOrdersScreen() {
  const params = useLocalSearchParams<{ type?: string }>();
  const orderType: OrderType = params.type === 'purchased' ? 'purchased' : 'sold';
  const sold = orderType === 'sold';
  const sell = useSellOrders();
  const buy = useBuyOrders();
  const orders = sold ? sell : buy;

  return (
    <>
      <Stack.Screen options={{ title: sold ? '已售订单' : '已购订单' }} />
      <FlatList
        style={styles.page}
        contentContainerStyle={styles.content}
        data={orders.data ?? []}
        keyExtractor={(o) => String(o.id)}
        renderItem={({ item }) => <OrderCard order={item} orderType={orderType} />}
        ListEmptyComponent={
          orders.isLoading ? (
            <Text style={styles.loadingTip}>加载中...</Text>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>{sold ? '💰' : '🛒'}</Text>
              <Text style={styles.emptyText}>暂无{sold ? '已售' : '已购'}订单</Text>
            </View>
          )
        }
      />
    </>
  );
}

function OrderCard({ order, orderType }: { order: Order; orderType: OrderType }) {
  const goods = useOrderGoods(order.itemId);
  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push({ pathname: '/order-detail', params: { id: order.id, type: orderType } })}>
      <View style={styles.top}>
        <Image style={styles.img} source={goods.image} contentFit="cover" />
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>
            {goods.title}
          </Text>
          <Text style={styles.price}>¥{goods.price}</Text>
        </View>
        <Text style={[styles.status, STATUS_STYLE[order.status]]}>{ORDER_STATUS_TEXT[order.status]}</Text>
      </View>
      <View style={styles.bottom}>
        {/* 后端没有订单号字段，用订单 id */}
        <Text style={styles.orderNo}>订单号：{order.id}</Text>
        <Text style={styles.time}>{formatDateTime(parseUtc(order.createdAt)).slice(0, 10)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { padding: rpx(20), gap: rpx(16) },
  card: { backgroundColor: colors.white, borderRadius: rpx(16), padding: rpx(24), boxShadow: '0 1px 4px rgba(0, 0, 0, 0.03)' },
  top: { flexDirection: 'row', alignItems: 'center', gap: rpx(16), marginBottom: rpx(20) },
  img: { width: rpx(120), height: rpx(120), borderRadius: rpx(12), backgroundColor: '#eeeeee' },
  info: { flex: 1, gap: rpx(10) },
  title: { fontSize: rpx(28), color: colors.text },
  price: { fontSize: rpx(30), color: colors.price, fontWeight: 'bold' },
  status: { fontSize: rpx(22), paddingVertical: rpx(4), paddingHorizontal: rpx(16), borderRadius: rpx(6), overflow: 'hidden' },
  bottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNo: { fontSize: rpx(24), color: colors.textMuted },
  time: { fontSize: rpx(24), color: '#cccccc' },
  empty: { alignItems: 'center', paddingTop: rpx(200) },
  emptyIcon: { fontSize: rpx(80), marginBottom: rpx(24) },
  emptyText: { fontSize: rpx(28), color: colors.textMuted },
  loadingTip: { textAlign: 'center', padding: rpx(60), fontSize: rpx(24), color: '#cccccc' },
});
