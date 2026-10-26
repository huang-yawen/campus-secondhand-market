import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, primaryGradient, rpx } from '@/theme';

type PublishType = 'sell' | 'buy';

const CARDS: { type: PublishType; emoji: string; title: string; desc: string; btn: string }[] = [
  { type: 'sell', emoji: '💸', title: '出售闲置', desc: '上传商品信息，把闲置物品卖给需要的同学', btn: '发布闲置' },
  { type: 'buy', emoji: '📋', title: '求购物品', desc: '发布求购信息，让有货的同学主动联系你', btn: '发布求购' },
];

export default function PublishScreen() {
  return (
    <ScrollView style={styles.page}>
      <View style={styles.hero}>
        <Text style={styles.heroIcon}>📦</Text>
        <Text style={styles.heroTitle}>选择发布类型</Text>
        <Text style={styles.heroSub}>你想出售闲置还是求购好物？</Text>
      </View>

      <View style={styles.cards}>
        {CARDS.map((c) => {
          const sell = c.type === 'sell';
          return (
            <Pressable
              key={c.type}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => router.push({ pathname: '/publish-form', params: { type: c.type } })}>
              <View style={[styles.cardIcon, { backgroundColor: sell ? '#e8f5ee' : '#EDF2F6' }]}>
                <Text style={styles.cardEmoji}>{c.emoji}</Text>
              </View>
              <Text style={styles.cardTitle}>{c.title}</Text>
              <Text style={styles.cardDesc}>{c.desc}</Text>
              <View style={[styles.cardBtn, { backgroundImage: sell ? primaryGradient : 'linear-gradient(135deg, #5A7D9E, #7A9DBE)' }]}>
                <Text style={styles.cardBtnText}>{c.btn}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  hero: { backgroundImage: primaryGradient, paddingVertical: rpx(60), paddingHorizontal: rpx(30), alignItems: 'center' },
  heroIcon: { fontSize: rpx(72), marginBottom: rpx(16) },
  heroTitle: { fontSize: rpx(40), color: colors.white, fontWeight: 'bold', marginBottom: rpx(10) },
  heroSub: { fontSize: rpx(26), color: 'rgba(255, 255, 255, 0.8)' },
  cards: { paddingVertical: rpx(30), paddingHorizontal: rpx(24), gap: rpx(24) },
  card: {
    backgroundColor: colors.white,
    borderRadius: rpx(24),
    paddingTop: rpx(40),
    paddingHorizontal: rpx(30),
    paddingBottom: rpx(36),
    alignItems: 'center',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.06)',
  },
  cardPressed: { transform: [{ scale: 0.97 }] },
  cardIcon: {
    width: rpx(120),
    height: rpx(120),
    borderRadius: rpx(60),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rpx(24),
  },
  cardEmoji: { fontSize: rpx(56) },
  cardTitle: { fontSize: rpx(34), color: colors.text, fontWeight: 'bold', marginBottom: rpx(12) },
  cardDesc: { fontSize: rpx(26), color: colors.textMuted, textAlign: 'center', lineHeight: rpx(39), marginBottom: rpx(28) },
  cardBtn: { paddingVertical: rpx(16), paddingHorizontal: rpx(60), borderRadius: rpx(44) },
  cardBtnText: { fontSize: rpx(28), fontWeight: 'bold', color: colors.white },
});
