import { useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { createSession } from '@/api/chat';
import { resolveImageUrl } from '@/api/client';
import { addFavorite, removeFavorite } from '@/api/favorite';
import { offlineItem, onlineItem } from '@/api/item';
import { Icon } from '@/components/Icon';
import { ImagePreview } from '@/components/ImagePreview';
import { formatDateTime, parseUtc } from '@/lib/time';
import { useMyFavorites } from '@/queries/favorites';
import { useGoodsDetail, useUserInfo } from '@/queries/items';
import { queryKeys } from '@/queries/keys';
import { useAuthStore } from '@/stores/auth';
import { showToast } from '@/stores/toast';
import { colors, rpx } from '@/theme';
import type { GoodsStatus } from '@/types/api';

// 后端状态是小写 on_sale / offline / sold（原页面按大写 REMOVED 判断，下架后"重新上架"按钮不会出现）
const STATUS_TEXT: Record<GoodsStatus, string> = { on_sale: '在售', sold: '已售', offline: '已下架' };

export default function GoodsDetailScreen() {
  const params = useLocalSearchParams<{ id: string; mode?: string }>();
  const goodsId = Number(params.id) || undefined;
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const detail = useGoodsDetail(goodsId);
  const item = detail.data;
  const seller = useUserInfo(item?.userId).data;
  const favorites = useMyFavorites();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  useEffect(() => {
    if (detail.isError) showToast('加载商品失败');
  }, [detail.isError]);

  const isSeller = params.mode === 'seller' || (!!user && !!item && user.id === item.userId);
  // 后端收藏列表结构是 {id, item: {id,...}}（原页面比较 f.itemId，收藏状态永远显示未收藏）
  const isCollected = !!favorites.data?.some((f) => f.item?.id === goodsId);
  const imageUrls = (item?.imageUrls ?? []).map(resolveImageUrl);

  // 上下架后刷新详情和所有商品列表
  async function refreshGoods() {
    if (!goodsId) return;
    await queryClient.invalidateQueries({ queryKey: queryKeys.goods(goodsId) });
    await queryClient.invalidateQueries({ queryKey: ['items'] });
  }

  async function toggleCollect() {
    if (!user || !goodsId) return showToast('请先登录');
    try {
      if (isCollected) {
        await removeFavorite(goodsId, user.id);
      } else {
        await addFavorite(goodsId, user.id);
      }
      await queryClient.invalidateQueries({ queryKey: queryKeys.favorites(user.id) });
      showToast(isCollected ? '已取消收藏' : '已收藏');
    } catch {
      // 错误提示已在 api 层处理
    }
  }

  async function handleConsult() {
    if (!user || !goodsId) return showToast('请先登录');
    if (user.id === item?.userId) return showToast('不能联系自己发布的商品');
    try {
      const session = await createSession(user.id, { itemId: goodsId });
      const partnerId = session.user1Id === user.id ? session.user2Id : session.user1Id;
      router.push({
        pathname: '/chat',
        params: {
          id: session.id,
          partnerId: partnerId || 0,
          name: seller?.nickname || seller?.username || '',
          avatar: seller?.avatar || '',
        },
      });
    } catch {
      // 错误提示已在 api 层处理
    }
  }

  function offlineGoods() {
    Alert.alert('下架商品', '确认下架该商品？下架后其他用户将无法看到该商品。', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        onPress: async () => {
          if (!goodsId) return;
          try {
            await offlineItem(goodsId, user?.id ?? 0);
            await refreshGoods();
            showToast('已下架', 'success');
          } catch {
            // 错误提示已在 api 层处理
          }
        },
      },
    ]);
  }

  async function relistGoods() {
    if (!user || !goodsId) return;
    try {
      await onlineItem(goodsId, user.id);
      await refreshGoods();
      showToast('已重新上架', 'success');
    } catch {
      // 错误提示已在 api 层处理
    }
  }

  const status = item?.status;

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={{ paddingBottom: rpx(140) + insets.bottom }}>
        <View style={[styles.imageBox, { height: width }]}>
          <FlatList
            data={imageUrls}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(url, i) => url + i}
            onMomentumScrollEnd={(e) => setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
            renderItem={({ item: url, index }) => (
              <Pressable onPress={() => setPreviewIndex(index)}>
                <Image style={{ width, height: width }} source={url} contentFit="cover" />
              </Pressable>
            )}
          />
          {imageUrls.length > 1 && (
            <Text style={styles.imageCounter}>
              {currentIndex + 1} / {imageUrls.length}
            </Text>
          )}
          {isSeller && status && (
            <Text style={[styles.statusBadge, status === 'on_sale' ? styles.statusOn : styles.statusOff]}>
              {STATUS_TEXT[status]}
            </Text>
          )}
        </View>

        <View style={styles.infoCard}>
          <View style={styles.priceRow}>
            <Text style={styles.symbol}>￥</Text>
            <Text style={styles.price}>{item?.price}</Text>
            {!!item?.conditionLevel && <Text style={styles.tagBadge}>{item.conditionLevel}</Text>}
          </View>
          <Text style={styles.title}>{item?.title}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaItem}>📦 自提</Text>
            <Text style={styles.metaItem}>📍 {item?.campus}</Text>
            {/* 原页面读的 createTime 后端不返回，实际字段是 createdAt（UTC） */}
            <Text style={styles.metaItem}>🕐 {item ? formatDateTime(parseUtc(item.createdAt)) : ''}</Text>
          </View>
        </View>

        {!isSeller && (
          <Pressable
            style={styles.sellerCard}
            onPress={() => item && router.push({ pathname: '/profile', params: { id: item.userId } })}>
            <View style={styles.avatar}>
              {seller?.avatar ? (
                <Image style={styles.avatarImg} source={resolveImageUrl(seller.avatar)} contentFit="cover" />
              ) : (
                <Text style={styles.avatarEmoji}>🎓</Text>
              )}
            </View>
            <Text style={styles.sellerName}>{seller?.nickname || seller?.username || '卖家'}</Text>
          </Pressable>
        )}

        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>商品详情</Text>
          <Text style={styles.description}>{item?.description || '暂无描述'}</Text>
        </View>
      </ScrollView>

      {item && (
        <View style={[styles.bottomAction, { height: rpx(120) + insets.bottom, paddingBottom: insets.bottom }]}>
          {!isSeller && (
            <>
              <Pressable style={styles.iconGroup} onPress={toggleCollect}>
                <Icon
                  name={isCollected ? 'xz' : 'shoucang'}
                  size={rpx(48)}
                  color={isCollected ? '#E85A4F' : '#cccccc'}
                />
              </Pressable>
              <View style={styles.btnGroup}>
                <Pressable style={styles.chatBtn} onPress={handleConsult}>
                  <Text style={styles.chatBtnText}>💬 咨询</Text>
                </Pressable>
                <Pressable
                  style={styles.buyBtn}
                  onPress={() => router.replace({ pathname: '/buy', params: { id: item.id } })}>
                  <Text style={styles.buyBtnText}>立即购买</Text>
                </Pressable>
              </View>
            </>
          )}
          {isSeller && status === 'on_sale' && (
            <View style={styles.sellerBtns}>
              <Pressable
                style={[styles.sellerBtn, styles.editBtn]}
                onPress={() => router.push({ pathname: '/goods-edit', params: { id: item.id } })}>
                <Text style={styles.editBtnText}>编辑信息</Text>
              </Pressable>
              <Pressable style={[styles.sellerBtn, styles.cancelBtn]} onPress={offlineGoods}>
                <Text style={styles.cancelBtnText}>下架商品</Text>
              </Pressable>
            </View>
          )}
          {isSeller && status === 'offline' && (
            <Pressable style={[styles.sellerBtn, styles.relistBtn]} onPress={relistGoods}>
              <Text style={styles.buyBtnText}>重新上架</Text>
            </Pressable>
          )}
        </View>
      )}

      <ImagePreview urls={imageUrls} index={previewIndex} onClose={() => setPreviewIndex(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  imageBox: { width: '100%', backgroundColor: '#000' },
  imageCounter: {
    position: 'absolute',
    bottom: rpx(24),
    right: rpx(24),
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    color: colors.white,
    fontSize: rpx(22),
    paddingVertical: rpx(4),
    paddingHorizontal: rpx(16),
    borderRadius: rpx(20),
    overflow: 'hidden',
  },
  statusBadge: {
    position: 'absolute',
    top: rpx(24),
    right: rpx(24),
    fontSize: rpx(24),
    paddingVertical: rpx(8),
    paddingHorizontal: rpx(24),
    borderRadius: rpx(30),
    overflow: 'hidden',
  },
  statusOn: { color: colors.primary, backgroundColor: '#e8f5ee' },
  statusOff: { color: colors.white, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  infoCard: {
    backgroundColor: colors.white,
    margin: rpx(20),
    paddingVertical: rpx(40),
    paddingHorizontal: rpx(30),
    borderRadius: rpx(20),
  },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: rpx(16) },
  symbol: { color: '#da0000', fontSize: rpx(32), fontWeight: 'bold' },
  price: { color: '#da0000', fontSize: rpx(56), fontWeight: 'bold', marginRight: rpx(16) },
  tagBadge: {
    alignSelf: 'center',
    marginLeft: rpx(12),
    backgroundColor: '#e8f5ee',
    color: colors.primary,
    fontSize: rpx(24),
    paddingVertical: rpx(6),
    paddingHorizontal: rpx(18),
    borderRadius: rpx(30),
    overflow: 'hidden',
  },
  title: { fontSize: rpx(36), color: '#1a1a1a', fontWeight: '500', lineHeight: rpx(50), marginBottom: rpx(20) },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: rpx(12), marginBottom: rpx(8) },
  metaItem: { fontSize: rpx(24), color: colors.textMuted },
  sellerCard: {
    backgroundColor: colors.white,
    marginHorizontal: rpx(20),
    marginBottom: rpx(20),
    padding: rpx(30),
    borderRadius: rpx(20),
    flexDirection: 'row',
    alignItems: 'center',
    gap: rpx(20),
  },
  avatar: {
    width: rpx(88),
    height: rpx(88),
    borderRadius: rpx(44),
    backgroundColor: '#e8f5ee',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarEmoji: { fontSize: rpx(44) },
  sellerName: { fontSize: rpx(30), fontWeight: 'bold', color: colors.text },
  detailSection: {
    backgroundColor: colors.white,
    marginHorizontal: rpx(20),
    marginBottom: rpx(20),
    padding: rpx(30),
    borderRadius: rpx(20),
  },
  sectionTitle: { fontSize: rpx(28), color: colors.primary, fontWeight: 'bold', marginBottom: rpx(20), letterSpacing: rpx(2) },
  description: { fontSize: rpx(30), color: '#444444', lineHeight: rpx(54) },
  bottomAction: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: rpx(30),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.05)',
  },
  iconGroup: { width: rpx(80), alignItems: 'center', justifyContent: 'center', marginRight: rpx(20) },
  btnGroup: { flex: 1, flexDirection: 'row', gap: rpx(16), justifyContent: 'flex-end' },
  chatBtn: {
    width: rpx(180),
    height: rpx(80),
    borderRadius: rpx(40),
    backgroundColor: '#e8f5ee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatBtnText: { color: colors.primary, fontSize: rpx(28), fontWeight: 'bold' },
  buyBtn: {
    width: rpx(220),
    height: rpx(80),
    borderRadius: rpx(40),
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyBtnText: { color: colors.white, fontSize: rpx(28), fontWeight: 'bold' },
  sellerBtns: { flex: 1, flexDirection: 'row', gap: rpx(20) },
  sellerBtn: { flex: 1, height: rpx(80), borderRadius: rpx(40), alignItems: 'center', justifyContent: 'center' },
  editBtn: { backgroundColor: '#e8f5ee' },
  editBtnText: { color: colors.primary, fontSize: rpx(28), fontWeight: 'bold' },
  cancelBtn: { backgroundColor: colors.background },
  cancelBtnText: { color: '#3f3f3f', fontSize: rpx(28), fontWeight: 'bold' },
  relistBtn: { backgroundColor: colors.primary },
});
