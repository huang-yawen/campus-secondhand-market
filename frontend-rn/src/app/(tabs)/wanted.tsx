import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { resolveImageUrl } from '@/api/client';
import { formatRelative, parseUtc } from '@/lib/time';
import { useCategories } from '@/queries/items';
import { useWantedList } from '@/queries/wanted';
import { colors, primaryGradient, rpx } from '@/theme';
import type { WantedCard } from '@/types/api';

export default function WantedScreen() {
  const wanted = useWantedList();
  const categories = useCategories();
  const { refetch } = wanted;

  // 原页面在 onShow 时刷新，这里在每次切回该 Tab 时刷新
  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const categoryName = (id: number | null) => categories.find((c) => c.id === id)?.name ?? '';

  return (
    <FlatList
      style={styles.page}
      data={wanted.data ?? []}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.content}
      ListHeaderComponent={
        <View style={styles.hero}>
          <Text style={styles.heroIcon}>📋</Text>
          <Text style={styles.heroTitle}>校园求购</Text>
          <Text style={styles.heroSub}>看看同学们都在求购什么</Text>
        </View>
      }
      renderItem={({ item }) => (
        <WantedItem
          item={item}
          categoryLabel={categoryName(item.categoryId)}
          onPress={() => router.push({ pathname: '/wanted-detail', params: { id: item.id } })}
        />
      )}
      ListEmptyComponent={
        wanted.isLoading ? undefined : (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>暂无求购信息</Text>
          </View>
        )
      }
    />
  );
}

function WantedItem({ item, categoryLabel, onPress }: { item: WantedCard; categoryLabel: string; onPress: () => void }) {
  const name = item.nickname || item.username;
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]} onPress={onPress}>
      <View style={styles.top}>
        <Text style={styles.emoji}>📋</Text>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
      </View>
      <View style={styles.meta}>
        <Text style={styles.budget}>
          预算 ¥{item.budgetMin} — ¥{item.budgetMax}
        </Text>
        <Text style={styles.campus}>{item.campus}</Text>
      </View>
      <View style={styles.tags}>
        <Text style={styles.tag}>{item.conditionLevel || '不限'}</Text>
        {!!categoryLabel && <Text style={styles.tag}>{categoryLabel}</Text>}
      </View>
      <View style={styles.footer}>
        <View style={styles.user}>
          {item.avatar ? (
            <Image style={styles.avatar} source={resolveImageUrl(item.avatar)} contentFit="cover" />
          ) : (
            <Text style={[styles.avatar, styles.avatarDef]}>{(name || '?').charAt(0)}</Text>
          )}
          <Text style={styles.name}>{name}</Text>
        </View>
        {/* 原页面读的 createTime 后端不返回，实际字段是 createdAt（UTC） */}
        <Text style={styles.time}>{formatRelative(parseUtc(item.createdAt))}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: rpx(20) },
  hero: {
    backgroundImage: primaryGradient,
    paddingTop: rpx(40),
    paddingHorizontal: rpx(30),
    paddingBottom: rpx(50),
    alignItems: 'center',
    marginBottom: rpx(20),
  },
  heroIcon: { fontSize: rpx(64), marginBottom: rpx(16) },
  heroTitle: { fontSize: rpx(36), color: colors.white, fontWeight: 'bold', marginBottom: rpx(8) },
  heroSub: { fontSize: rpx(24), color: 'rgba(255, 255, 255, 0.8)' },
  card: {
    marginHorizontal: rpx(20),
    marginBottom: rpx(20),
    backgroundColor: colors.white,
    borderRadius: rpx(16),
    paddingTop: rpx(24),
    paddingHorizontal: rpx(24),
    paddingBottom: rpx(20),
    borderLeftWidth: rpx(8),
    borderLeftColor: '#598f62',
    boxShadow: '0 1px 6px rgba(0, 0, 0, 0.04)',
  },
  cardPressed: { opacity: 0.9 },
  top: { flexDirection: 'row', alignItems: 'center', marginBottom: rpx(12) },
  emoji: { fontSize: rpx(32), marginRight: rpx(12) },
  title: { flex: 1, fontSize: rpx(30), color: colors.text, fontWeight: 'bold' },
  meta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: rpx(12) },
  budget: { fontSize: rpx(26), color: '#5A7D9E', fontWeight: 'bold' },
  campus: { fontSize: rpx(22), color: colors.textMuted },
  tags: { flexDirection: 'row', gap: rpx(10), marginBottom: rpx(16) },
  tag: {
    fontSize: rpx(22),
    color: '#5A7D9E',
    backgroundColor: '#EDF2F6',
    paddingVertical: rpx(4),
    paddingHorizontal: rpx(16),
    borderRadius: rpx(20),
    overflow: 'hidden',
  },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  user: { flexDirection: 'row', alignItems: 'center', gap: rpx(8) },
  avatar: { width: rpx(36), height: rpx(36), borderRadius: rpx(18), backgroundColor: '#EDF2F6', overflow: 'hidden' },
  avatarDef: { color: '#5A7D9E', fontSize: rpx(20), fontWeight: 'bold', textAlign: 'center', lineHeight: rpx(36) },
  name: { fontSize: rpx(24), color: colors.textMuted },
  time: { fontSize: rpx(22), color: '#cccccc' },
  empty: { alignItems: 'center', paddingTop: rpx(160) },
  emptyIcon: { fontSize: rpx(100), marginBottom: rpx(20) },
  emptyText: { fontSize: rpx(28), color: colors.textMuted },
});
