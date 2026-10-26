import { useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { createSession } from '@/api/chat';
import { resolveImageUrl } from '@/api/client';
import { addWantedFavorite, removeWantedFavorite } from '@/api/favorite';
import { closeWanted } from '@/api/wanted';
import { Icon } from '@/components/Icon';
import { ImagePreview } from '@/components/ImagePreview';
import { formatRelative, parseUtc } from '@/lib/time';
import { useMyFavorites } from '@/queries/favorites';
import { useCategories } from '@/queries/items';
import { queryKeys } from '@/queries/keys';
import { useWantedDetail } from '@/queries/wanted';
import { useAuthStore } from '@/stores/auth';
import { showToast } from '@/stores/toast';
import { colors, primaryGradient, rpx } from '@/theme';
import type { WantedStatus } from '@/types/api';

// 原页面直接显示后端的 active / closed 英文，这里换成中文
const STATUS_TEXT: Record<WantedStatus, string> = { active: '求购中', closed: '已结束' };

export default function WantedDetailScreen() {
  const params = useLocalSearchParams<{ id: string; mode?: string }>();
  const wantedId = Number(params.id) || undefined;
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const detail = useWantedDetail(wantedId);
  const data = detail.data;
  const categories = useCategories();
  const favorites = useMyFavorites();
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  useEffect(() => {
    if (detail.isError) showToast('加载求购详情失败');
  }, [detail.isError]);

  // 加载前先按 mode=self 判断，加载后以发布者 id 为准（与原页面一致）
  const isOwner = data ? data.userId === user?.id : params.mode === 'self';
  // 后端收藏列表结构是 {id, wanted: {id,...}}（原页面比较 f.wantedId，收藏状态永远显示未收藏）
  const isCollected = !!favorites.data?.some((f) => f.wanted?.id === wantedId);
  const images = (data?.imageUrls ?? []).map(resolveImageUrl);
  const name = data?.nickname || data?.username || '';
  const categoryLabel = categories.find((c) => c.id === data?.categoryId)?.name ?? '';

  async function toggleCollect() {
    if (!user || !wantedId) return showToast('请先登录');
    try {
      if (isCollected) {
        await removeWantedFavorite(wantedId, user.id);
      } else {
        await addWantedFavorite(wantedId, user.id);
      }
      await queryClient.invalidateQueries({ queryKey: queryKeys.favorites(user.id) });
      showToast(isCollected ? '已取消收藏' : '已收藏');
    } catch {
      // 错误提示已在 api 层处理
    }
  }

  async function contactSeller() {
    if (!user || !data) return showToast('请先登录');
    if (isOwner) return showToast('不能联系自己发布的求购');
    try {
      const session = await createSession(user.id, { wantedId: data.id });
      const partnerId = session.user1Id === user.id ? session.user2Id : session.user1Id;
      router.push({
        pathname: '/chat',
        params: { id: session.id, partnerId: partnerId || 0, name, avatar: data.avatar || '' },
      });
    } catch {
      showToast('创建会话失败');
    }
  }

  function handleCloseWanted() {
    if (!user || !data) return;
    Alert.alert('结束求购', '确认结束该求购？结束后其他用户将无法看到该求购信息。', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        onPress: async () => {
          try {
            await closeWanted(data.id, user.id);
            await queryClient.invalidateQueries({ queryKey: ['wanted'] });
            showToast('已结束', 'success');
          } catch {
            showToast('操作失败');
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={{ paddingBottom: rpx(140) + insets.bottom }}>
        <View style={styles.hero}>
          <Text style={styles.heroIcon}>📋</Text>
          <Text style={styles.heroTitle}>{data?.title}</Text>
          <View style={styles.budgetRow}>
            <Text style={styles.budgetLabel}>预算</Text>
            <Text style={styles.budgetValue}>
              ¥{data?.budgetMin} — ¥{data?.budgetMax}
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <InfoItem label="校区" value={data?.campus ?? ''} />
          <InfoItem label="分类" value={categoryLabel} />
          <InfoItem label="期望成色" value={data ? data.conditionLevel || '不限' : ''} />
        </View>

        <View style={styles.descCard}>
          <Text style={styles.sectionTitle}>需求描述</Text>
          <Text style={styles.descText}>{data?.description}</Text>
          {images.length > 0 && (
            <View style={styles.imageGrid}>
              {images.map((url, idx) => (
                <Pressable key={url + idx} onPress={() => setPreviewIndex(idx)}>
                  <Image style={styles.imageThumb} source={url} contentFit="cover" />
                </Pressable>
              ))}
            </View>
          )}
        </View>

        <View style={styles.publisherCard}>
          <View style={styles.pubLeft}>
            <Pressable
              style={styles.pubAvatar}
              onPress={() => data && router.push({ pathname: '/profile', params: { id: data.userId } })}>
              {data?.avatar ? (
                <Image style={styles.pubAvatarImg} source={resolveImageUrl(data.avatar)} contentFit="cover" />
              ) : (
                <Text style={styles.pubAvatarText}>{(name || '?').charAt(0)}</Text>
              )}
            </Pressable>
            <View style={styles.pubInfo}>
              <Text style={styles.pubName}>{name}</Text>
              <Text style={styles.pubTime}>{data ? formatRelative(parseUtc(data.createdAt)) : ''} 发布</Text>
            </View>
          </View>
          <View style={styles.pubCredit}>
            <Text style={styles.creditText}>信用良好</Text>
          </View>
        </View>

        {!isOwner && (
          <View style={styles.tips}>
            <Text style={styles.tipsIcon}>💡</Text>
            <Text style={styles.tipsText}>如果你有符合要求的物品，可以直接联系TA哦</Text>
          </View>
        )}

        {isOwner && data && (
          <Text style={[styles.statusTag, data.status === 'active' ? styles.statusSeeking : styles.statusDone]}>
            {STATUS_TEXT[data.status]}
          </Text>
        )}
      </ScrollView>

      {isOwner && data?.status === 'active' && (
        <View style={[styles.bottomBar, styles.ownerBar, { height: rpx(120) + insets.bottom, paddingBottom: insets.bottom }]}>
          <Pressable
            style={[styles.ownerBtn, styles.editBtn]}
            onPress={() => router.push({ pathname: '/publish-form', params: { type: 'buy', edit: '1', id: data.id } })}>
            <Text style={styles.editBtnText}>编辑信息</Text>
          </Pressable>
          <Pressable style={[styles.ownerBtn, styles.cancelBtn]} onPress={handleCloseWanted}>
            <Text style={styles.cancelBtnText}>结束求购</Text>
          </Pressable>
        </View>
      )}
      {!isOwner && (
        <View style={[styles.bottomBar, { height: rpx(120) + insets.bottom, paddingBottom: insets.bottom }]}>
          <Pressable style={styles.collect} onPress={toggleCollect}>
            <Icon name={isCollected ? 'xz' : 'shoucang'} size={rpx(48)} color={isCollected ? '#E85A4F' : '#cccccc'} />
          </Pressable>
          <Pressable style={styles.contactBtn} onPress={contactSeller}>
            <Text style={styles.contactText}>💬 联系TA</Text>
          </Pressable>
        </View>
      )}

      <ImagePreview urls={images} index={previewIndex} onClose={() => setPreviewIndex(null)} />
    </View>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  hero: {
    backgroundImage: primaryGradient,
    paddingTop: rpx(44),
    paddingHorizontal: rpx(30),
    paddingBottom: rpx(50),
    alignItems: 'center',
  },
  heroIcon: { fontSize: rpx(56), marginBottom: rpx(16) },
  heroTitle: {
    fontSize: rpx(38),
    color: colors.white,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: rpx(24),
    lineHeight: rpx(53),
  },
  budgetRow: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: rpx(40),
    paddingVertical: rpx(12),
    paddingHorizontal: rpx(32),
    flexDirection: 'row',
    alignItems: 'center',
    gap: rpx(12),
  },
  budgetLabel: { fontSize: rpx(24), color: 'rgba(255, 255, 255, 0.7)' },
  budgetValue: { fontSize: rpx(32), color: colors.white, fontWeight: 'bold' },
  infoCard: {
    backgroundColor: colors.white,
    margin: rpx(20),
    borderRadius: rpx(16),
    paddingVertical: rpx(32),
    paddingHorizontal: rpx(24),
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  infoItem: { alignItems: 'center', gap: rpx(10) },
  infoLabel: { fontSize: rpx(22), color: colors.textMuted },
  infoValue: { fontSize: rpx(26), color: colors.text, fontWeight: 'bold' },
  descCard: {
    backgroundColor: colors.white,
    marginHorizontal: rpx(20),
    marginBottom: rpx(20),
    borderRadius: rpx(16),
    paddingVertical: rpx(30),
    paddingHorizontal: rpx(24),
  },
  sectionTitle: { fontSize: rpx(28), color: colors.primary, fontWeight: 'bold', marginBottom: rpx(20) },
  descText: { fontSize: rpx(28), color: '#444444', lineHeight: rpx(50) },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: rpx(12), marginTop: rpx(24) },
  imageThumb: { width: rpx(200), height: rpx(200), borderRadius: rpx(12), backgroundColor: colors.border },
  publisherCard: {
    backgroundColor: colors.white,
    marginHorizontal: rpx(20),
    marginBottom: rpx(20),
    borderRadius: rpx(16),
    padding: rpx(24),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pubLeft: { flexDirection: 'row', alignItems: 'center', gap: rpx(20) },
  pubAvatar: {
    width: rpx(80),
    height: rpx(80),
    borderRadius: rpx(40),
    backgroundColor: '#EDF2F6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  pubAvatarImg: { width: '100%', height: '100%' },
  pubAvatarText: { fontSize: rpx(36), color: '#5A7D9E', fontWeight: 'bold' },
  pubInfo: { gap: rpx(6) },
  pubName: { fontSize: rpx(30), color: colors.text, fontWeight: 'bold' },
  pubTime: { fontSize: rpx(22), color: colors.textMuted },
  pubCredit: { backgroundColor: '#EDF2F6', paddingVertical: rpx(8), paddingHorizontal: rpx(20), borderRadius: rpx(20) },
  creditText: { fontSize: rpx(22), color: '#5A7D9E' },
  tips: {
    marginHorizontal: rpx(20),
    paddingVertical: rpx(20),
    paddingHorizontal: rpx(24),
    backgroundColor: '#fff9e6',
    borderRadius: rpx(12),
    flexDirection: 'row',
    alignItems: 'center',
    gap: rpx(12),
  },
  tipsIcon: { fontSize: rpx(28) },
  tipsText: { flex: 1, fontSize: rpx(24), color: '#b8860b', lineHeight: rpx(34) },
  statusTag: {
    marginHorizontal: rpx(20),
    marginBottom: rpx(20),
    paddingVertical: rpx(16),
    paddingHorizontal: rpx(24),
    borderRadius: rpx(12),
    overflow: 'hidden',
    textAlign: 'center',
    fontSize: rpx(26),
    fontWeight: 'bold',
  },
  statusSeeking: { backgroundColor: '#e8f5ee', color: colors.primary },
  statusDone: { backgroundColor: colors.border, color: colors.textMuted },
  bottomBar: {
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
  ownerBar: { gap: rpx(20) },
  ownerBtn: { flex: 1, height: rpx(80), borderRadius: rpx(40), alignItems: 'center', justifyContent: 'center' },
  editBtn: { backgroundColor: '#e8f5ee' },
  editBtnText: { color: colors.primary, fontSize: rpx(28), fontWeight: 'bold' },
  cancelBtn: { backgroundColor: colors.background },
  cancelBtnText: { color: '#3f3f3f', fontSize: rpx(28), fontWeight: 'bold' },
  collect: { width: rpx(100), alignItems: 'center' },
  contactBtn: {
    flex: 1,
    marginLeft: rpx(20),
    height: rpx(80),
    borderRadius: rpx(40),
    backgroundImage: primaryGradient,
    boxShadow: '0 4px 12px rgba(90, 125, 158, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactText: { color: colors.white, fontSize: rpx(30), fontWeight: 'bold' },
});
