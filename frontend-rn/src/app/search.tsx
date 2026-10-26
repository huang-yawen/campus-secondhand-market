import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GoodsCard } from '@/components/GoodsCard';
import { Icon } from '@/components/Icon';
import { OptionPicker } from '@/components/OptionPicker';
import { CAMPUS_OPTIONS, CONDITION_OPTIONS } from '@/constants/options';
import { useCategories, useGoodsSearch } from '@/queries/items';
import { colors, primaryGradient, rpx } from '@/theme';

type PriceSort = '' | 'desc' | 'asc';
type PickerKind = 'condition' | 'campus' | 'category' | null;

const PRICE_SORT_TEXT: Record<PriceSort, string> = { '': '价格', desc: '价格从高到低', asc: '价格从低到高' };
const PRICE_SORT_ICON: Record<PriceSort, string> = { '': '▾', desc: '▼', asc: '▲' };

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const categories = useCategories();

  const [keyword, setKeyword] = useState('');
  // 已提交搜索的关键词；null 表示还没搜索过
  const [searchedKeyword, setSearchedKeyword] = useState<string | null>(null);
  const [condition, setCondition] = useState('');
  const [campus, setCampus] = useState('');
  const [category, setCategory] = useState<{ id: number; name: string } | null>(null);
  const [priceSort, setPriceSort] = useState<PriceSort>('');
  const [picker, setPicker] = useState<PickerKind>(null);

  const searched = searchedKeyword !== null;
  // 筛选条件都在 queryKey 里，改任何一项都会自动从第一页重新搜索
  const goods = useGoodsSearch(
    {
      keyword: searchedKeyword ?? '',
      campus: campus || undefined,
      categoryId: category?.id,
      conditionLevel: condition || undefined,
      priceSort: priceSort || undefined,
    },
    searched,
  );
  const results = goods.data?.pages.flatMap((p) => p.records) ?? [];
  const totalCount = goods.data?.pages[0]?.total ?? 0;

  function onSearch() {
    if (keyword.trim()) setSearchedKeyword(keyword.trim());
  }

  function clearSearch() {
    setKeyword('');
    setSearchedKeyword(null);
    setCondition('');
    setCampus('');
    setCategory(null);
    setPriceSort('');
  }

  function togglePriceSort() {
    setPriceSort(priceSort === '' ? 'desc' : priceSort === 'desc' ? 'asc' : '');
  }

  const categoryLabels = ['不限', ...categories.map((c) => c.name)];
  const pickerOptions =
    picker === 'condition' ? CONDITION_OPTIONS : picker === 'campus' ? CAMPUS_OPTIONS : categoryLabels;

  function onPick(index: number) {
    const label = pickerOptions[index];
    const value = label === '不限' ? '' : label;
    if (picker === 'condition') setCondition(value);
    if (picker === 'campus') setCampus(value);
    if (picker === 'category') setCategory(index === 0 ? null : categories[index - 1]);
  }

  return (
    <View style={styles.page}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.searchRow}>
          <Pressable style={styles.back} onPress={() => router.back()}>
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
          <View style={styles.searchBox}>
            <Icon name="sousuo" size={rpx(28)} style={styles.sbIcon} />
            <TextInput
              style={styles.sbInput}
              value={keyword}
              onChangeText={setKeyword}
              autoFocus
              placeholder="搜索你想要的二手好物"
              placeholderTextColor={colors.placeholder}
              returnKeyType="search"
              onSubmitEditing={onSearch}
            />
            {keyword !== '' && (
              <Pressable onPress={clearSearch} hitSlop={8}>
                <Text style={styles.sbClear}>✕</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {searched && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
          contentContainerStyle={styles.filterContent}>
          <FilterTag label={condition || '成色'} active={!!condition} arrow="▾" onPress={() => setPicker('condition')} />
          <FilterTag label={campus || '校区'} active={!!campus} arrow="▾" onPress={() => setPicker('campus')} />
          <FilterTag label={category?.name || '分类'} active={!!category} arrow="▾" onPress={() => setPicker('category')} />
          <FilterTag
            label={PRICE_SORT_TEXT[priceSort]}
            active={!!priceSort}
            arrow={PRICE_SORT_ICON[priceSort]}
            onPress={togglePriceSort}
          />
        </ScrollView>
      )}

      <FlatList
        style={styles.list}
        data={results}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.row}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <GoodsCard goods={item} onPress={() => router.push({ pathname: '/goods-detail', params: { id: item.id } })} />
        )}
        onEndReached={() => {
          if (goods.hasNextPage && !goods.isFetchingNextPage) void goods.fetchNextPage();
        }}
        onEndReachedThreshold={0.3}
        ListHeaderComponent={
          searched && results.length > 0 ? <Text style={styles.resultCount}>共找到 {totalCount} 件商品</Text> : undefined
        }
        ListEmptyComponent={
          !searched ? (
            <Empty icon="👆" text="输入关键词搜索二手好物" />
          ) : goods.isLoading ? undefined : (
            <Empty icon="🔍" text="未找到相关商品" hint="试试其他关键词或调整筛选条件" />
          )
        }
      />

      <OptionPicker visible={picker !== null} options={pickerOptions} onSelect={onPick} onClose={() => setPicker(null)} />
    </View>
  );
}

interface FilterTagProps {
  label: string;
  active: boolean;
  arrow: string;
  onPress: () => void;
}

function FilterTag({ label, active, arrow, onPress }: FilterTagProps) {
  return (
    <Pressable style={[styles.filterTag, active && styles.filterActive]} onPress={onPress}>
      <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
      <Text style={[styles.ftArrow, active && styles.filterTextActive]}>{arrow}</Text>
    </Pressable>
  );
}

function Empty({ icon, text, hint }: { icon: string; text: string; hint?: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyText}>{text}</Text>
      {hint && <Text style={styles.emptyHint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  header: { backgroundImage: primaryGradient, paddingHorizontal: rpx(20), paddingBottom: rpx(16) },
  searchRow: { flexDirection: 'row', alignItems: 'center', height: rpx(72), gap: rpx(16) },
  back: { width: rpx(60), height: rpx(60), alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: rpx(80), lineHeight: rpx(80), color: colors.white, fontWeight: '300' },
  searchBox: {
    flex: 1,
    height: rpx(60),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: rpx(44),
    paddingHorizontal: rpx(24),
  },
  sbIcon: { marginRight: rpx(12) },
  sbInput: { flex: 1, height: rpx(60), padding: 0, fontSize: rpx(28), color: colors.text },
  sbClear: { fontSize: rpx(28), color: colors.textMuted, padding: rpx(8) },
  filterRow: {
    flexGrow: 0,
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  filterContent: { paddingVertical: rpx(16), paddingHorizontal: rpx(20) },
  filterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: rpx(10),
    paddingHorizontal: rpx(22),
    marginRight: rpx(14),
    borderRadius: rpx(30),
    backgroundColor: colors.background,
  },
  filterActive: { backgroundColor: '#e8f5ee' },
  filterText: { fontSize: rpx(24), color: colors.textSecondary },
  filterTextActive: { color: colors.primary, fontWeight: 'bold' },
  ftArrow: { fontSize: rpx(18), marginLeft: rpx(6), color: colors.textSecondary },
  list: { flex: 1 },
  row: { justifyContent: 'space-between', paddingHorizontal: rpx(16) },
  resultCount: { paddingTop: rpx(20), paddingHorizontal: rpx(24), paddingBottom: rpx(16), fontSize: rpx(24), color: colors.textMuted },
  empty: { alignItems: 'center', paddingTop: rpx(200) },
  emptyIcon: { fontSize: rpx(80), marginBottom: rpx(20) },
  emptyText: { fontSize: rpx(28), color: colors.textMuted },
  emptyHint: { fontSize: rpx(24), color: '#cccccc', marginTop: rpx(12) },
});
