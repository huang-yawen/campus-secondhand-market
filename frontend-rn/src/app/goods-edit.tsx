import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { resolveImageUrl } from '@/api/client';
import { updateItem } from '@/api/item';
import {
  FormCard,
  FormInput,
  FormItem,
  FormTextarea,
  PickerField,
  PriceInput,
  SubmitButton,
} from '@/components/form';
import { ImageUploader, uploadEntries, type ImageEntry } from '@/components/ImageUploader';
import { PageHeader } from '@/components/PageHeader';
import { CAMPUS_OPTIONS, CONDITION_OPTIONS } from '@/constants/options';
import { useCategories, useGoodsDetail } from '@/queries/items';
import { queryKeys } from '@/queries/keys';
import { useAuthStore } from '@/stores/auth';
import { hideLoading, showLoading, showToast } from '@/stores/toast';
import { colors, rpx } from '@/theme';
import type { GoodsDetail } from '@/types/api';

// 原 goods-edit.vue 的校区/成色列表与搜索页相同，只是没有"不限"
const CAMPUS_LIST = CAMPUS_OPTIONS.slice(1);
const CONDITION_LIST = CONDITION_OPTIONS.slice(1);

export default function GoodsEditScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const goodsId = Number(params.id) || undefined;
  // 从详情页进来时命中缓存，不会重复请求
  const detail = useGoodsDetail(goodsId);

  useEffect(() => {
    if (detail.isError) showToast('加载商品失败');
  }, [detail.isError]);

  return (
    <View style={styles.page}>
      <PageHeader title="编辑物品信息" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {detail.data && goodsId ? <EditForm goodsId={goodsId} initial={detail.data} /> : null}
      </ScrollView>
    </View>
  );
}

function EditForm({ goodsId, initial }: { goodsId: number; initial: GoodsDetail }) {
  const queryClient = useQueryClient();
  const categories = useCategories();
  const [title, setTitle] = useState(initial.title);
  const [price, setPrice] = useState(initial.price);
  const [categoryId, setCategoryId] = useState(initial.categoryId);
  const [campus, setCampus] = useState(initial.campus);
  const [condition, setCondition] = useState(initial.conditionLevel);
  const [desc, setDesc] = useState(initial.description);
  const [images, setImages] = useState<ImageEntry[]>(
    initial.imageUrls.map((url) => ({ uri: resolveImageUrl(url), remoteUrl: url })),
  );
  const [submitting, setSubmitting] = useState(false);

  // 分类名按 id 实时查，避免原页面"分类比商品晚加载导致分类名为空"的问题
  const categoryName = categories.find((c) => c.id === categoryId)?.name ?? '';

  async function onSave() {
    if (!title) return showToast('请输入商品名称');
    if (!price) return showToast('请输入价格');
    const user = useAuthStore.getState().user;
    if (!user) return showToast('请先登录');

    setSubmitting(true);
    try {
      showLoading('上传图片中...');
      const imageUrls = await uploadEntries(images);
      hideLoading();
      // 注意：后端编辑接口目前不处理 imageUrls，图片改动不会保存（原项目同样如此）
      await updateItem(goodsId, {
        userId: user.id,
        title,
        price: Number(price),
        categoryId,
        campus: campus || undefined,
        conditionLevel: condition || undefined,
        description: desc || undefined,
        imageUrls,
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.goods(goodsId) });
      await queryClient.invalidateQueries({ queryKey: ['items'] });
      showToast('保存成功', 'success');
      setTimeout(() => router.back(), 1500);
    } catch {
      // 错误提示已在 api 层处理
    } finally {
      hideLoading();
      setSubmitting(false);
    }
  }

  return (
    <FormCard>
      <FormItem label="商品图片">
        <ImageUploader images={images} onChange={setImages} />
      </FormItem>
      <FormItem label="商品名称">
        <FormInput value={title} onChange={setTitle} placeholder="请输入商品名称" />
      </FormItem>
      <FormItem label="价格">
        <PriceInput value={price} onChange={setPrice} placeholder="0.00" />
      </FormItem>
      <FormItem label="商品分类">
        <PickerField
          value={categoryName}
          placeholder="请选择分类"
          options={categories.map((c) => c.name)}
          onSelect={(i) => setCategoryId(categories[i].id)}
        />
      </FormItem>
      <FormItem label="所在校区">
        <PickerField value={campus} placeholder="请选择校区" options={CAMPUS_LIST} onSelect={(i) => setCampus(CAMPUS_LIST[i])} />
      </FormItem>
      <FormItem label="成色">
        <PickerField
          value={condition}
          placeholder="请选择商品成色"
          options={CONDITION_LIST}
          onSelect={(i) => setCondition(CONDITION_LIST[i])}
        />
      </FormItem>
      <FormItem label="商品描述">
        <FormTextarea value={desc} onChange={setDesc} placeholder="描述一下你的商品吧~" maxLength={500} />
        <Text style={styles.charCount}>{desc.length}/500</Text>
      </FormItem>
      <SubmitButton title="保存修改" disabled={submitting} onPress={onSave} />
    </FormCard>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: rpx(40) },
  charCount: { fontSize: rpx(22), color: '#cccccc', textAlign: 'right', marginTop: rpx(8) },
});
