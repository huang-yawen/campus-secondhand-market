import { useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { resolveImageUrl } from '@/api/client';
import { submitReview, updateReview } from '@/api/review';
import { queryKeys } from '@/queries/keys';
import { useAuthStore } from '@/stores/auth';
import { showToast } from '@/stores/toast';
import { colors, primaryGradient, rpx } from '@/theme';

const RATING_TEXT = ['点击星星评分', '非常差', '较差', '一般', '满意', '非常满意'];

export default function MyReviewScreen() {
  const params = useLocalSearchParams<{
    orderId?: string;
    sellerId?: string;
    seller?: string;
    sellerAvatar?: string;
    reviewId?: string;
  }>();
  const queryClient = useQueryClient();
  const sellerName = params.seller || '卖家';
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');

  async function onSubmit() {
    if (rating === 0) return showToast('请先给卖家评分');
    const user = useAuthStore.getState().user;
    if (!user) return showToast('请先登录');
    const orderId = Number(params.orderId);
    const data = { orderId, revieweeId: Number(params.sellerId), rating, content: reviewText };
    try {
      if (params.reviewId) {
        await updateReview(Number(params.reviewId), user.id, data);
      } else {
        await submitReview(user.id, data);
      }
      // 订单详情的"已评价"状态、卖家主页的评价列表都要刷新
      await queryClient.invalidateQueries({ queryKey: queryKeys.reviewChecked(orderId) });
      await queryClient.invalidateQueries({ queryKey: ['reviews'] });
      showToast('评价成功！', 'success');
      setTimeout(() => router.back(), 1200);
    } catch {
      // 错误提示已在 api 层处理
    }
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.sellerCard}>
        <View style={styles.sellerAvatar}>
          {params.sellerAvatar ? (
            <Image style={styles.sellerAvatarImg} source={resolveImageUrl(params.sellerAvatar)} contentFit="cover" />
          ) : (
            <Text style={styles.sellerAvatarText}>{sellerName.charAt(0)}</Text>
          )}
        </View>
        <View style={styles.sellerInfo}>
          <Text style={styles.sellerName}>{sellerName}</Text>
          <Text style={styles.sellerHint}>交易已完成，给TA一个评价吧</Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>评分</Text>
        <View style={styles.starRow}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Pressable key={i} onPress={() => setRating(i)}>
              <Text style={[styles.star, i <= rating && styles.starActive]}>{i <= rating ? '★' : '☆'}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.ratingText}>{RATING_TEXT[rating]}</Text>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>
          评价<Text style={styles.optionalHint}>（选填）</Text>
        </Text>
        <TextInput
          style={styles.textarea}
          value={reviewText}
          onChangeText={setReviewText}
          placeholder="说说你的交易体验吧~"
          placeholderTextColor={colors.placeholder}
          maxLength={300}
          multiline
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{reviewText.length}/300</Text>
      </View>

      <Pressable style={styles.submitBtn} onPress={onSubmit}>
        <Text style={styles.submitText}>提交评价</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { padding: rpx(20) },
  sellerCard: {
    backgroundColor: colors.white,
    borderRadius: rpx(20),
    padding: rpx(30),
    flexDirection: 'row',
    alignItems: 'center',
    gap: rpx(20),
    marginBottom: rpx(20),
  },
  sellerAvatar: {
    width: rpx(88),
    height: rpx(88),
    borderRadius: rpx(44),
    backgroundImage: primaryGradient,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sellerAvatarImg: { width: '100%', height: '100%' },
  sellerAvatarText: { fontSize: rpx(40), color: colors.white, fontWeight: 'bold' },
  sellerInfo: { flex: 1 },
  sellerName: { fontSize: rpx(30), color: colors.text, fontWeight: 'bold' },
  sellerHint: { fontSize: rpx(24), color: colors.textMuted, marginTop: rpx(6) },
  sectionCard: { backgroundColor: colors.white, borderRadius: rpx(20), padding: rpx(30), marginBottom: rpx(20) },
  sectionTitle: { fontSize: rpx(28), color: colors.text, fontWeight: 'bold', marginBottom: rpx(24) },
  optionalHint: { fontSize: rpx(24), color: colors.textMuted, fontWeight: 'normal' },
  starRow: { flexDirection: 'row', justifyContent: 'center', gap: rpx(20) },
  star: { fontSize: rpx(64), color: '#dddddd' },
  starActive: { color: '#f0ad4e' },
  ratingText: { textAlign: 'center', fontSize: rpx(26), color: '#f0ad4e', marginTop: rpx(16) },
  textarea: {
    height: rpx(200),
    backgroundColor: colors.background,
    borderRadius: rpx(12),
    padding: rpx(20),
    fontSize: rpx(28),
    color: colors.text,
  },
  charCount: { textAlign: 'right', fontSize: rpx(22), color: '#cccccc', marginTop: rpx(10) },
  submitBtn: {
    height: rpx(88),
    borderRadius: rpx(44),
    backgroundImage: primaryGradient,
    boxShadow: '0 4px 12px rgba(0, 97, 60, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: { color: colors.white, fontSize: rpx(32), fontWeight: 'bold' },
});
