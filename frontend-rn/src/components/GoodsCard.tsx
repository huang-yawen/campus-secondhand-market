import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { resolveImageUrl } from '@/api/client';
import { colors, rpx } from '@/theme';
import type { GoodsCard as GoodsCardData } from '@/types/api';

interface GoodsCardProps {
  goods: GoodsCardData;
  onPress: () => void;
}

// 双列商品卡片，首页和搜索页共用（原两页的样式完全相同）
export function GoodsCard({ goods, onPress }: GoodsCardProps) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Image style={styles.img} source={resolveImageUrl(goods.coverUrl)} contentFit="cover" />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {goods.title}
        </Text>
        <View style={styles.bottom}>
          <View style={styles.price}>
            <Text style={styles.priceSymbol}>¥</Text>
            <Text style={styles.priceNum}>{goods.price}</Text>
          </View>
          <Text style={styles.meta}>{goods.campus}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '49%',
    backgroundColor: colors.white,
    borderRadius: rpx(16),
    overflow: 'hidden',
    marginBottom: rpx(20),
    boxShadow: '0 1px 6px rgba(0, 0, 0, 0.04)',
  },
  img: { width: '100%', height: rpx(340), backgroundColor: colors.border },
  info: { paddingTop: rpx(16), paddingHorizontal: rpx(20), paddingBottom: rpx(20) },
  title: { fontSize: rpx(26), color: colors.text, lineHeight: rpx(36), marginBottom: rpx(16) },
  bottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { flexDirection: 'row', alignItems: 'baseline' },
  priceSymbol: { fontSize: rpx(22), color: colors.price, fontWeight: 'bold' },
  priceNum: { fontSize: rpx(34), color: colors.price, fontWeight: 'bold' },
  meta: { fontSize: rpx(22), color: colors.textMuted },
});
