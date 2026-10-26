import { useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { resolveImageUrl } from '@/api/client';
import { cancelOrder, completeOrder } from '@/api/order';
import { formatDateTime, parseUtc } from '@/lib/time';
import { useUserInfo } from '@/queries/items';
import { queryKeys } from '@/queries/keys';
import {
  ORDER_STATUS_TEXT,
  useBuyOrders,
  useOrderGoods,
  useReviewChecked,
  useSellOrders,
  type OrderType,
} from '@/queries/orders';
import { useAuthStore } from '@/stores/auth';
import { showToast } from '@/stores/toast';
import { colors, primaryGradient, rpx } from '@/theme';
import type { Order, OrderStatus } from '@/types/api';

const STATUS_ICON: Record<OrderStatus, string> = { pending: '📦', completed: '✅', cancelled: '❌' };
const STATUS_HINT: Record<OrderStatus, string> = {
  pending: '等待双方确认交易',
  completed: '交易已完成',
  cancelled: '订单已取消',
};
const STATUS_COLOR: Record<OrderStatus, string> = { pending: '#f0ad4e', completed: '#2E7D32', cancelled: colors.textMuted };

export default function OrderDetailScreen() {
  const params = useLocalSearchParams<{ id: string; type?: string }>();
  const orderId = Number(params.id);
  const orderType: OrderType = params.type === 'purchased' ? 'purchased' : 'sold';
  // 后端没有订单详情接口：从"我的买入/卖出订单"列表里按 id 取（代替原 currentOrder 本地存储）
  const sell = useSellOrders();
  const buy = useBuyOrders();
  const orders = orderType === 'purchased' ? buy : sell;
  const order = orders.data?.find((o) => o.id === orderId);

  if (!order) {
    return (
      <View style={styles.center}>
        <Text style={styles.centerText}>{orders.isLoading ? '加载中...' : '订单不存在'}</Text>
      </View>
    );
  }
  return <OrderDetail order={order} orderType={orderType} />;
}

function OrderDetail({ order, orderType }: { order: Order; orderType: OrderType }) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const goods = useOrderGoods(order.itemId);
  const buyer = useUserInfo(order.buyerId).data;
  const seller = useUserInfo(order.sellerId).data;
  const purchased = orderType === 'purchased';
  // 原页面的 hasReviewed 后端从不返回，评价后仍一直显示"去评价"；这里用 /api/reviews/check 判断
  const reviewed = useReviewChecked(order.id, purchased && order.status === 'completed').data;

  const status = order.status;
  const buyerName = buyer?.nickname || buyer?.username || '';
  const sellerName = seller?.nickname || seller?.username || '';

  // 订单状态变化会影响：订单列表、商品状态（已售/在售）、钱包
  async function refreshAfterChange() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['orders'] }),
      queryClient.invalidateQueries({ queryKey: ['items'] }),
      queryClient.invalidateQueries({ queryKey: queryKeys.goods(order.itemId) }),
      queryClient.invalidateQueries({ queryKey: ['wallet'] }),
    ]);
  }

  function onCancel() {
    if (!user) return showToast('请先登录');
    Alert.alert('取消订单', '确认取消该订单？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        onPress: async () => {
          try {
            await cancelOrder(order.id, user.id, { cancelReason: '用户主动取消' });
            await refreshAfterChange();
            showToast('已取消', 'success');
          } catch {
            // 错误提示已在 api 层处理
          }
        },
      },
    ]);
  }

  function onComplete() {
    if (!user) return showToast('请先登录');
    Alert.alert('确认完成', '确认交易完成？请在当面验货确认无误后再操作。', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        onPress: async () => {
          try {
            await completeOrder(order.id, user.id);
            await refreshAfterChange();
            showToast('交易完成', 'success');
          } catch {
            // 错误提示已在 api 层处理
          }
        },
      },
    ]);
  }

  function goReview() {
    router.push({
      pathname: '/my-review',
      params: { orderId: order.id, sellerId: order.sellerId, seller: sellerName, sellerAvatar: seller?.avatar ?? '' },
    });
  }

  // 后端没有单独的完成/取消时间，状态变更时间就是 updatedAt
  const changedAt = formatDateTime(parseUtc(order.updatedAt));

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: rpx(160) + insets.bottom }]}>
        <View style={[styles.statusCard, status === 'cancelled' && styles.statusCancel]}>
          <Text style={styles.statusIcon}>{STATUS_ICON[status]}</Text>
          <Text style={styles.statusText}>{ORDER_STATUS_TEXT[status]}</Text>
          <Text style={styles.statusHint}>{STATUS_HINT[status]}</Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>商品信息</Text>
          <Pressable
            style={styles.goodsRow}
            onPress={() => router.push({ pathname: '/goods-detail', params: { id: order.itemId } })}>
            <Image style={styles.gImg} source={goods.image} contentFit="cover" />
            <View style={styles.gInfo}>
              <Text style={styles.gTitle} numberOfLines={2}>
                {goods.title}
              </Text>
              <Text style={styles.gPrice}>¥{goods.price}</Text>
            </View>
            <Text style={styles.gArrow}>›</Text>
          </Pressable>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>订单信息</Text>
          {/* 后端没有订单号字段，用订单 id */}
          <InfoRow label="订单编号" value={String(order.id)} selectable />
          <InfoRow label="订单状态" value={ORDER_STATUS_TEXT[status]} color={STATUS_COLOR[status]} />
          {!!order.tradeLocation && <InfoRow label="交易地点" value={order.tradeLocation} />}
          {!!order.remark && <InfoRow label="买家留言" value={order.remark} />}
          <InfoRow label="创建时间" value={formatDateTime(parseUtc(order.createdAt))} />
          {status === 'completed' && <InfoRow label="完成时间" value={changedAt} />}
          {status === 'cancelled' && <InfoRow label="取消时间" value={changedAt} />}
          {!!order.cancelReason && <InfoRow label="取消原因" value={order.cancelReason} />}
          <InfoRow label="交易金额" value={'¥' + goods.price} price last />
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>交易双方</Text>
          <View style={styles.partyRow}>
            <Party label="买家" userId={order.buyerId} name={buyerName} avatar={buyer?.avatar} />
            <Text style={styles.partyArrow}>⇄</Text>
            <Party label="卖家" userId={order.sellerId} name={sellerName} avatar={seller?.avatar} />
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottom, { paddingBottom: rpx(16) + insets.bottom }]}>
        {status === 'pending' && (
          <>
            <Pressable style={[styles.btn, styles.btnOutline]} onPress={onCancel}>
              <Text style={styles.btnOutlineText}>取消订单</Text>
            </Pressable>
            {/* 买家才能确认完成，卖家只能取消 */}
            {purchased && (
              <Pressable style={[styles.btn, styles.btnPrimary]} onPress={onComplete}>
                <Text style={styles.btnLightText}>确认完成</Text>
              </Pressable>
            )}
          </>
        )}
        {status === 'completed' && purchased && reviewed === false && (
          <Pressable style={[styles.btn, styles.btnReview]} onPress={goReview}>
            <Text style={styles.btnLightText}>去评价</Text>
          </Pressable>
        )}
        {status === 'completed' && purchased && reviewed === true && (
          <View style={[styles.btn, styles.btnDone]}>
            <Text style={styles.btnDoneText}>已评价</Text>
          </View>
        )}
        {status === 'completed' && !purchased && <Text style={styles.doneText}>交易已完成</Text>}
        {status === 'cancelled' && <Text style={styles.doneText}>订单已取消</Text>}
      </View>
    </View>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
  color?: string;
  price?: boolean;
  selectable?: boolean;
  last?: boolean;
}

function InfoRow({ label, value, color, price, selectable, last }: InfoRowProps) {
  return (
    <View style={[styles.infoRow, last && styles.infoRowLast]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, color ? { color } : null, price && styles.infoPrice]} selectable={selectable}>
        {value}
      </Text>
    </View>
  );
}

function Party({ label, userId, name, avatar }: { label: string; userId: number; name: string; avatar?: string }) {
  return (
    <Pressable style={styles.partyItem} onPress={() => router.push({ pathname: '/profile', params: { id: userId } })}>
      <View style={styles.partyAvatar}>
        {avatar ? (
          <Image style={styles.partyAvatarImg} source={resolveImageUrl(avatar)} contentFit="cover" />
        ) : (
          <Text style={styles.partyAvatarText}>{(name || '?').charAt(0)}</Text>
        )}
      </View>
      <Text style={styles.partyLabel}>{label}</Text>
      <Text style={styles.partyName}>{name || '用户 #' + userId}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  centerText: { fontSize: rpx(26), color: colors.textMuted },
  content: { padding: rpx(20) },
  statusCard: {
    backgroundImage: primaryGradient,
    borderRadius: rpx(20),
    paddingVertical: rpx(48),
    paddingHorizontal: rpx(40),
    alignItems: 'center',
    marginBottom: rpx(20),
  },
  statusCancel: { backgroundImage: 'linear-gradient(135deg, #999999, #b0b0b0)' },
  statusIcon: { fontSize: rpx(64), marginBottom: rpx(16) },
  statusText: { fontSize: rpx(36), color: colors.white, fontWeight: 'bold' },
  statusHint: { fontSize: rpx(24), color: 'rgba(255, 255, 255, 0.8)', marginTop: rpx(8) },
  sectionCard: { backgroundColor: colors.white, borderRadius: rpx(20), padding: rpx(24), marginBottom: rpx(20) },
  sectionTitle: {
    fontSize: rpx(28),
    color: colors.textMuted,
    paddingBottom: rpx(20),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.background,
    marginBottom: rpx(16),
  },
  goodsRow: { flexDirection: 'row', alignItems: 'center', gap: rpx(16) },
  gImg: { width: rpx(120), height: rpx(120), borderRadius: rpx(12), backgroundColor: '#eeeeee' },
  gInfo: { flex: 1, gap: rpx(10) },
  gTitle: { fontSize: rpx(28), color: colors.text },
  gPrice: { fontSize: rpx(30), color: colors.price, fontWeight: 'bold' },
  gArrow: { fontSize: rpx(32), color: '#cccccc' },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: rpx(18),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.background,
  },
  infoRowLast: { borderBottomWidth: 0 },
  infoLabel: { fontSize: rpx(26), color: colors.textMuted, marginRight: rpx(20) },
  infoValue: { flex: 1, fontSize: rpx(26), color: colors.text, textAlign: 'right' },
  infoPrice: { color: colors.price, fontWeight: 'bold', fontSize: rpx(30) },
  partyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: rpx(8) },
  partyItem: { flex: 1, alignItems: 'center' },
  partyAvatar: {
    width: rpx(88),
    height: rpx(88),
    borderRadius: rpx(44),
    backgroundColor: '#e8f5ee',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rpx(12),
    overflow: 'hidden',
  },
  partyAvatarImg: { width: '100%', height: '100%' },
  partyAvatarText: { fontSize: rpx(36) },
  partyLabel: { fontSize: rpx(24), color: colors.textMuted, marginBottom: rpx(8) },
  partyName: { fontSize: rpx(28), color: colors.text, fontWeight: '500' },
  partyArrow: { fontSize: rpx(32), color: '#cccccc', marginHorizontal: rpx(20) },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    paddingTop: rpx(16),
    paddingHorizontal: rpx(30),
    flexDirection: 'row',
    gap: rpx(20),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.04)',
  },
  btn: { flex: 1, height: rpx(80), borderRadius: rpx(40), alignItems: 'center', justifyContent: 'center' },
  btnOutline: { backgroundColor: colors.background },
  btnOutlineText: { fontSize: rpx(28), color: colors.text },
  btnPrimary: { backgroundImage: primaryGradient },
  btnReview: { backgroundImage: 'linear-gradient(135deg, #f0ad4e, #f5c26b)' },
  btnLightText: { fontSize: rpx(28), color: colors.white },
  btnDone: { backgroundColor: '#e0e0e0' },
  btnDoneText: { fontSize: rpx(28), color: colors.textMuted },
  doneText: { flex: 1, textAlign: 'center', fontSize: rpx(28), color: colors.textMuted, paddingVertical: rpx(24) },
});
