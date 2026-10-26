import { useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { resolveImageUrl } from '@/api/client';
import { createOrder } from '@/api/order';
import { PageHeader } from '@/components/PageHeader';
import { useGoodsDetail, useUserInfo } from '@/queries/items';
import { queryKeys } from '@/queries/keys';
import { useAuthStore } from '@/stores/auth';
import { showToast } from '@/stores/toast';
import { colors, primaryGradient, rpx } from '@/theme';

export default function BuyScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const goodsId = Number(params.id) || undefined;
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const detail = useGoodsDetail(goodsId);
  const goods = detail.data;
  // 原页面没有加载卖家信息，卖家名永远显示"卖家"
  const seller = useUserInfo(goods?.userId).data;
  const [tradeLocation, setTradeLocation] = useState('');
  const [remark, setRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 只在进入页面时检查一次登录态（与原 onLoad 一致）
  useEffect(() => {
    if (useAuthStore.getState().user) return;
    showToast('请先登录');
    const timer = setTimeout(() => router.back(), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (detail.isError) showToast('加载商品失败');
  }, [detail.isError]);

  async function onSubmit() {
    if (submitting || !user || !goodsId) return;
    setSubmitting(true);
    try {
      const order = await createOrder(user.id, {
        itemId: goodsId,
        tradeLocation: tradeLocation || '',
        remark: remark || '',
      });
      // 下单后商品变为已售，订单、商品、钱包相关缓存都要刷新
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['orders'] }),
        queryClient.invalidateQueries({ queryKey: ['items'] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.goods(goodsId) }),
        queryClient.invalidateQueries({ queryKey: ['wallet'] }),
      ]);
      showToast('下单成功', 'success');
      // 订单详情从"我的买入订单"里按 id 取，不再用 currentOrder 本地存储传值
      setTimeout(() => router.replace({ pathname: '/order-detail', params: { id: order.id, type: 'purchased' } }), 1000);
    } catch {
      setSubmitting(false);
    }
  }

  const image = resolveImageUrl(goods?.imageUrls[0]);
  const price = goods?.price ?? '0.00';

  return (
    <View style={styles.page}>
      <PageHeader title="确认购买" />
      <ScrollView contentContainerStyle={{ paddingBottom: rpx(160) + insets.bottom }} keyboardShouldPersistTaps="handled">
        <Section title="商品信息">
          <View style={styles.goodsRow}>
            <Image style={styles.goodsImg} source={image} contentFit="cover" />
            <View style={styles.goodsInfo}>
              <Text style={styles.goodsTitle} numberOfLines={2}>
                {goods?.title ?? '加载中...'}
              </Text>
              <View style={styles.goodsTags}>
                {!!goods?.conditionLevel && <Text style={styles.gTag}>{goods.conditionLevel}</Text>}
                {!!goods?.campus && <Text style={styles.gTag}>{goods.campus}</Text>}
              </View>
            </View>
          </View>
        </Section>

        <Section title="卖家信息">
          <View style={styles.sellerRow}>
            <View style={styles.sellerAvatar}>
              {seller?.avatar ? (
                <Image style={styles.sellerAvatarImg} source={resolveImageUrl(seller.avatar)} contentFit="cover" />
              ) : (
                <Text style={styles.sellerAvatarEmoji}>🎓</Text>
              )}
            </View>
            <Text style={styles.sellerName}>{seller?.nickname || seller?.username || '卖家'}</Text>
          </View>
        </Section>

        <Section title="交易方式">
          <View style={styles.tradeOption}>
            <Text style={styles.tradeIcon}>🤝</Text>
            <View style={styles.tradeText}>
              <Text style={styles.tradeName}>校内面交/自提</Text>
              <Text style={styles.tradeDesc}>与卖家协商见面交易</Text>
            </View>
          </View>
          <Text style={styles.formLabel}>
            交易地点 <Text style={styles.sectionHint}>（选填）</Text>
          </Text>
          <TextInput
            style={styles.formInput}
            value={tradeLocation}
            onChangeText={setTradeLocation}
            placeholder="如：东校园教学楼门口"
            placeholderTextColor={colors.placeholder}
          />
        </Section>

        <Section title="价格明细">
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>商品价格</Text>
            <Text style={styles.priceValue}>¥{price}</Text>
          </View>
          <View style={styles.priceDivider} />
          <View style={[styles.priceRow, styles.priceTotal]}>
            <Text style={styles.totalLabel}>合计</Text>
            <Text style={styles.totalValue}>¥{price}</Text>
          </View>
        </Section>

        <Section title="买家留言" hint="（选填）">
          <TextInput
            style={styles.remarkInput}
            value={remark}
            onChangeText={setRemark}
            placeholder="如：什么时间方便见面？"
            placeholderTextColor={colors.placeholder}
            maxLength={200}
            multiline
            textAlignVertical="top"
          />
          <Text style={styles.remarkCount}>{remark.length}/200</Text>
        </Section>

        <View style={styles.safetyTip}>
          <Text style={styles.safetyIcon}>🛡️</Text>
          <Text style={styles.safetyText}>交易安全提示：建议在校内公共场所见面交易，当面验货后再付款</Text>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { height: rpx(120) + insets.bottom, paddingBottom: insets.bottom }]}>
        <View style={styles.bottomPrice}>
          <Text style={styles.bpLabel}>合计：</Text>
          <Text style={styles.bpValue}>¥{price}</Text>
        </View>
        <Pressable
          style={[styles.submitBtn, (submitting || !goods) && styles.submitDisabled]}
          disabled={submitting || !goods}
          onPress={onSubmit}>
          <Text style={styles.submitText}>确认购买</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>
        {title}
        {hint && <Text style={styles.sectionHint}>{hint}</Text>}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  sectionCard: { backgroundColor: colors.white, margin: rpx(20), marginBottom: 0, borderRadius: rpx(20), padding: rpx(30) },
  sectionTitle: { fontSize: rpx(28), color: colors.primary, fontWeight: 'bold', marginBottom: rpx(20) },
  sectionHint: { fontSize: rpx(24), color: colors.textMuted, fontWeight: 'normal' },
  goodsRow: { flexDirection: 'row', gap: rpx(20) },
  goodsImg: { width: rpx(160), height: rpx(160), borderRadius: rpx(12), backgroundColor: colors.border },
  goodsInfo: { flex: 1, justifyContent: 'space-between' },
  goodsTitle: { fontSize: rpx(30), color: colors.text, lineHeight: rpx(42) },
  goodsTags: { flexDirection: 'row', gap: rpx(12) },
  gTag: {
    fontSize: rpx(22),
    color: colors.primary,
    backgroundColor: '#e8f5ee',
    paddingVertical: rpx(6),
    paddingHorizontal: rpx(16),
    borderRadius: rpx(6),
    overflow: 'hidden',
  },
  sellerRow: { flexDirection: 'row', alignItems: 'center', gap: rpx(20) },
  sellerAvatar: {
    width: rpx(80),
    height: rpx(80),
    borderRadius: rpx(40),
    backgroundColor: '#e8f5ee',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sellerAvatarImg: { width: '100%', height: '100%' },
  sellerAvatarEmoji: { fontSize: rpx(36) },
  sellerName: { fontSize: rpx(28), color: colors.text, fontWeight: 'bold' },
  tradeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rpx(16),
    paddingVertical: rpx(24),
    paddingHorizontal: rpx(20),
    borderRadius: rpx(12),
    backgroundColor: '#e8f5ee',
    marginBottom: rpx(20),
  },
  tradeIcon: { fontSize: rpx(40) },
  tradeText: { gap: rpx(4) },
  tradeName: { fontSize: rpx(28), color: colors.text, fontWeight: 'bold' },
  tradeDesc: { fontSize: rpx(22), color: colors.textMuted },
  formLabel: { fontSize: rpx(26), color: colors.textSecondary, marginBottom: rpx(12) },
  formInput: {
    height: rpx(72),
    backgroundColor: colors.background,
    borderRadius: rpx(12),
    paddingHorizontal: rpx(20),
    paddingVertical: 0,
    fontSize: rpx(26),
    color: colors.text,
  },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: rpx(16) },
  priceLabel: { fontSize: rpx(26), color: colors.textSecondary },
  priceValue: { fontSize: rpx(28), color: colors.text, fontWeight: 'bold' },
  priceDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: rpx(16) },
  priceTotal: { marginBottom: 0 },
  totalLabel: { fontSize: rpx(28), color: colors.text, fontWeight: 'bold' },
  totalValue: { fontSize: rpx(36), color: colors.price, fontWeight: 'bold' },
  remarkInput: {
    height: rpx(160),
    backgroundColor: colors.background,
    borderRadius: rpx(12),
    padding: rpx(20),
    fontSize: rpx(26),
    color: colors.text,
  },
  remarkCount: { fontSize: rpx(22), color: '#cccccc', textAlign: 'right', marginTop: rpx(8) },
  safetyTip: { flexDirection: 'row', alignItems: 'flex-start', gap: rpx(12), paddingTop: rpx(20), paddingHorizontal: rpx(40) },
  safetyIcon: { fontSize: rpx(28) },
  safetyText: { flex: 1, fontSize: rpx(22), color: colors.placeholder, lineHeight: rpx(35) },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: rpx(30),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.05)',
  },
  bottomPrice: { flexDirection: 'row', alignItems: 'baseline' },
  bpLabel: { fontSize: rpx(26), color: colors.textSecondary },
  bpValue: { fontSize: rpx(40), color: colors.price, fontWeight: 'bold' },
  submitBtn: {
    width: rpx(260),
    height: rpx(80),
    borderRadius: rpx(40),
    backgroundImage: primaryGradient,
    boxShadow: '0 4px 12px rgba(58, 99, 65, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: colors.white, fontSize: rpx(30), fontWeight: 'bold' },
});
