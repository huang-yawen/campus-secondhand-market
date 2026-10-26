import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { parseUtc } from '@/lib/time';
import { ORDER_STATUS_TEXT, useBuyOrders, useOrderGoods, useSellOrders, useWallet, type OrderType } from '@/queries/orders';
import { colors, primaryGradient, rpx } from '@/theme';
import type { Order } from '@/types/api';

interface Transaction {
  order: Order;
  txType: OrderType;
}

// 后端金额是字符串（如 "0.00"），原页面直接调用 .toFixed 会在渲染时报错
function money(value: string | undefined): string {
  return (Number(value) || 0).toFixed(2);
}

// 原页面格式：M月D日 HH:mm
function formatTime(ms: number): string {
  if (Number.isNaN(ms)) return '';
  const t = new Date(ms);
  const hh = String(t.getHours()).padStart(2, '0');
  const mm = String(t.getMinutes()).padStart(2, '0');
  return `${t.getMonth() + 1}月${t.getDate()}日 ${hh}:${mm}`;
}

export default function MyWalletScreen() {
  const wallet = useWallet().data;
  const sell = useSellOrders();
  const buy = useBuyOrders();
  const loading = sell.isLoading || buy.isLoading;

  // 交易明细 = 买入 + 卖出订单（排除已取消），按创建时间倒序
  const transactions: Transaction[] = [
    ...(sell.data ?? []).map((order) => ({ order, txType: 'sold' as const })),
    ...(buy.data ?? []).map((order) => ({ order, txType: 'purchased' as const })),
  ]
    .filter((t) => t.order.status !== 'cancelled')
    .sort((a, b) => parseUtc(b.order.createdAt) - parseUtc(a.order.createdAt));

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>钱包余额（元）</Text>
        <Text style={styles.balanceNum}>{money(wallet?.balance)}</Text>
        <View style={styles.balanceRow}>
          <View style={styles.balanceItem}>
            <Text style={styles.biNum}>{money(wallet?.totalIncome)}</Text>
            <Text style={styles.biLabel}>累计收入</Text>
          </View>
          <View style={styles.balanceItem}>
            <Text style={styles.biNum}>{money(wallet?.totalExpense)}</Text>
            <Text style={styles.biLabel}>累计支出</Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>交易明细</Text>
        {loading ? (
          <Text style={styles.emptyTxt}>加载中...</Text>
        ) : transactions.length > 0 ? (
          transactions.map((t, i) => (
            <TxItem key={t.order.id + '_' + t.txType} tx={t} last={i === transactions.length - 1} />
          ))
        ) : (
          <Text style={styles.emptyTxt}>暂无交易记录</Text>
        )}
      </View>
    </ScrollView>
  );
}

function TxItem({ tx, last }: { tx: Transaction; last: boolean }) {
  const { order, txType } = tx;
  const goods = useOrderGoods(order.itemId);
  const sold = txType === 'sold';
  return (
    <Pressable
      style={[styles.txItem, last && styles.txItemLast]}
      onPress={() => router.push({ pathname: '/order-detail', params: { id: order.id, type: txType } })}>
      <Image style={styles.txImg} source={goods.image} contentFit="cover" />
      <View style={styles.txInfo}>
        <Text style={styles.txTitle} numberOfLines={1}>
          {goods.title}
        </Text>
        <View style={styles.txMeta}>
          <Text style={styles.txTime}>{formatTime(parseUtc(order.createdAt))}</Text>
          <Text style={[styles.txTag, sold ? styles.tagSold : styles.tagBought]}>{sold ? '已售' : '已购'}</Text>
          <Text style={[styles.txStatus, { color: order.status === 'completed' ? '#2E7D32' : '#f0ad4e' }]}>
            {ORDER_STATUS_TEXT[order.status]}
          </Text>
        </View>
      </View>
      {/* 后端订单没有价格字段，金额取商品价格 */}
      <Text style={[styles.txAmount, { color: sold ? '#2E7D32' : colors.price }]}>
        {sold ? '+' : '-'}¥{money(goods.price)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { padding: rpx(20) },
  balanceCard: {
    backgroundImage: primaryGradient,
    borderRadius: rpx(20),
    paddingTop: rpx(40),
    paddingHorizontal: rpx(30),
    paddingBottom: rpx(30),
    alignItems: 'center',
    marginBottom: rpx(20),
  },
  balanceLabel: { fontSize: rpx(26), color: 'rgba(255, 255, 255, 0.8)', marginBottom: rpx(12) },
  balanceNum: { fontSize: rpx(72), lineHeight: rpx(80), color: colors.white, fontWeight: 'bold', marginBottom: rpx(32) },
  balanceRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    justifyContent: 'space-around',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: rpx(24),
  },
  balanceItem: { alignItems: 'center' },
  biNum: { fontSize: rpx(30), color: colors.white, fontWeight: 'bold', marginBottom: rpx(6) },
  biLabel: { fontSize: rpx(22), color: 'rgba(255, 255, 255, 0.7)' },
  sectionCard: {
    backgroundColor: colors.white,
    marginBottom: rpx(20),
    borderRadius: rpx(20),
    padding: rpx(24),
    boxShadow: '0 1px 6px rgba(0, 0, 0, 0.04)',
  },
  sectionTitle: { fontSize: rpx(30), color: colors.text, fontWeight: 'bold', marginBottom: rpx(10) },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: rpx(22),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.background,
  },
  txItemLast: { borderBottomWidth: 0 },
  txImg: { width: rpx(100), height: rpx(100), borderRadius: rpx(10), backgroundColor: '#eeeeee', marginRight: rpx(18) },
  txInfo: { flex: 1 },
  txTitle: { fontSize: rpx(28), color: colors.text, marginBottom: rpx(6) },
  txMeta: { flexDirection: 'row', alignItems: 'center', gap: rpx(12) },
  txTime: { fontSize: rpx(22), color: '#cccccc' },
  txTag: { fontSize: rpx(20), paddingVertical: rpx(2), paddingHorizontal: rpx(10), borderRadius: rpx(4), overflow: 'hidden' },
  tagSold: { color: '#2E7D32', backgroundColor: '#e8f5e9' },
  tagBought: { color: colors.price, backgroundColor: '#fdecea' },
  txStatus: { fontSize: rpx(20) },
  txAmount: { fontSize: rpx(30), fontWeight: 'bold', marginLeft: rpx(16) },
  emptyTxt: { paddingVertical: rpx(30), textAlign: 'center', fontSize: rpx(24), color: '#cccccc' },
});
