import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { GoodsCard } from '@/components/GoodsCard';
import { Icon } from '@/components/Icon';
import { useCategories, useGoodsSearch } from '@/queries/items';
import { colors, primaryGradient, rpx } from '@/theme';

export default function HomeScreen() {
  // 0 表示"全部"
  const [activeCategory, setActiveCategory] = useState(0);
  const categories = useCategories();
  // 分类变化 → queryKey 变化 → 自动从第一页重新加载；发布成功后 invalidate(['items']) 会刷新这里
  const goods = useGoodsSearch({ categoryId: activeCategory || undefined });

  const list = goods.data?.pages.flatMap((p) => p.records) ?? [];
  const loading = goods.isLoading || goods.isFetchingNextPage;
  const tabs = [{ id: 0, name: '全部' }, ...categories];

  return (
    <FlatList
      style={styles.page}
      data={list}
      keyExtractor={(item) => String(item.id)}
      numColumns={2}
      columnWrapperStyle={styles.row}
      renderItem={({ item }) => (
        <GoodsCard goods={item} onPress={() => router.push({ pathname: '/goods-detail', params: { id: item.id } })} />
      )}
      refreshControl={
        <RefreshControl
          refreshing={goods.isRefetching && !goods.isFetchingNextPage}
          onRefresh={() => void goods.refetch()}
          colors={[colors.primary]}
        />
      }
      onEndReached={() => {
        if (goods.hasNextPage && !goods.isFetchingNextPage) void goods.fetchNextPage();
      }}
      onEndReachedThreshold={0.3}
      ListHeaderComponent={
        <>
          <Pressable style={styles.searchBar} onPress={() => router.push('/search')}>
            <View style={styles.searchBox}>
              <Icon name="sousuo" size={rpx(28)} style={styles.searchIcon} />
              <Text style={styles.searchPlaceholder}>搜索你想要的二手好物</Text>
            </View>
            <Text style={styles.searchBtn}>搜索</Text>
          </Pressable>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryContent}>
            {tabs.map((c) => {
              const active = activeCategory === c.id;
              return (
                <Pressable
                  key={c.id}
                  style={[styles.categoryTag, active && styles.categoryActive]}
                  onPress={() => setActiveCategory(c.id)}>
                  <Text style={[styles.categoryText, active && styles.categoryTextActive]}>{c.name}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <View style={styles.gridTop} />
        </>
      }
      ListFooterComponent={
        <>
          {loading && <Text style={styles.tip}>加载中...</Text>}
          {!goods.hasNextPage && list.length > 0 && <Text style={styles.tip}>— 没有更多了 —</Text>}
          <View style={styles.bottomSafe} />
        </>
      }
      ListEmptyComponent={
        loading ? undefined : (
          <View style={styles.empty}>
            <Icon name="weizhaodao" size={rpx(120)} color={colors.textMuted} style={styles.emptyIcon} />
            <Text style={styles.emptyText}>该分类暂无商品</Text>
          </View>
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  searchBar: {
    backgroundImage: primaryGradient,
    paddingTop: rpx(20),
    paddingHorizontal: rpx(24),
    paddingBottom: rpx(24),
    flexDirection: 'row',
    alignItems: 'center',
    gap: rpx(16),
  },
  searchBox: {
    flex: 1,
    height: rpx(72),
    borderRadius: rpx(36),
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: rpx(24),
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  searchIcon: { marginRight: rpx(12) },
  searchPlaceholder: { flex: 1, fontSize: rpx(26), color: colors.placeholder },
  searchBtn: { fontSize: rpx(28), color: colors.white, fontWeight: 'bold' },
  categoryScroll: { flexGrow: 0, backgroundColor: colors.white },
  categoryContent: { paddingVertical: rpx(20), paddingHorizontal: rpx(20) },
  categoryTag: {
    paddingVertical: rpx(12),
    paddingHorizontal: rpx(28),
    marginRight: rpx(12),
    borderRadius: rpx(30),
    backgroundColor: colors.background,
  },
  categoryActive: { backgroundColor: colors.primary },
  categoryText: { fontSize: rpx(26), color: colors.textSecondary },
  categoryTextActive: { color: colors.white, fontWeight: 'bold' },
  gridTop: { height: rpx(16) },
  row: { justifyContent: 'space-between', paddingHorizontal: rpx(16) },
  tip: { textAlign: 'center', padding: rpx(30), fontSize: rpx(24), color: '#cccccc' },
  bottomSafe: { height: rpx(20) },
  empty: { alignItems: 'center', paddingTop: rpx(160) },
  emptyIcon: { marginBottom: rpx(20) },
  emptyText: { fontSize: rpx(28), color: colors.textMuted },
});
