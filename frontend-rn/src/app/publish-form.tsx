import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { resolveImageUrl } from '@/api/client';
import { publishItem } from '@/api/item';
import { publishWanted, updateWanted } from '@/api/wanted';
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
import { PUBLISH_CAMPUS_OPTIONS, PUBLISH_CATEGORIES, PUBLISH_CONDITION_OPTIONS } from '@/constants/options';
import { useWantedDetail } from '@/queries/wanted';
import { useAuthStore } from '@/stores/auth';
import { hideLoading, showLoading, showToast } from '@/stores/toast';
import { colors, primaryGradient, rpx } from '@/theme';
import type { WantedDetail } from '@/types/api';

const CATEGORY_LABELS = PUBLISH_CATEGORIES.map((c) => c.name);

export default function PublishFormScreen() {
  const params = useLocalSearchParams<{ type?: string; edit?: string; id?: string }>();
  const publishType = params.type === 'buy' ? 'buy' : 'sell';
  const isEdit = params.edit === '1';
  const editId = Number(params.id) || undefined;
  // 编辑求购时直接读详情缓存（详情页已加载过），代替原来的 editWantedData 本地存储
  const editing = useWantedDetail(isEdit ? editId : undefined);

  const sell = publishType === 'sell';
  const title = isEdit ? '编辑求购信息' : sell ? '发布闲置好物' : '发布求购信息';
  const sub = isEdit ? '修改你的求购需求' : sell ? '让闲置流动起来，助力绿色校园' : '快速找到你想要的宝贝';

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.hero}>
        <Text style={styles.heroIcon}>{sell ? '📸' : '📋'}</Text>
        <Text style={styles.heroTitle}>{title}</Text>
        <Text style={styles.heroSub}>{sub}</Text>
      </View>
      {sell ? (
        <SellForm />
      ) : isEdit ? (
        // 编辑模式等详情加载完再渲染表单，保证初始值正确
        editing.data && editId ? <BuyForm initial={editing.data} editId={editId} /> : null
      ) : (
        <BuyForm />
      )}
    </ScrollView>
  );
}

function SellForm() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [categoryIndex, setCategoryIndex] = useState<number | null>(null);
  const [campus, setCampus] = useState('');
  const [condition, setCondition] = useState('');
  const [desc, setDesc] = useState('');
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    if (!title) return showToast('请输入商品名称');
    if (!price) return showToast('请输入价格');
    if (categoryIndex === null) return showToast('请选择分类');
    const user = useAuthStore.getState().user;
    if (!user) return showToast('请先登录');

    setSubmitting(true);
    try {
      showLoading('上传图片中...');
      const imageUrls = await uploadEntries(images);
      hideLoading();
      const data = await publishItem({
        userId: user.id,
        title,
        price: Number(price),
        categoryId: PUBLISH_CATEGORIES[categoryIndex].id,
        campus: campus || undefined,
        conditionLevel: condition || undefined,
        description: desc || undefined,
        imageUrls,
      });
      // 代替原来的 needRefreshHomeGoods 标记：首页、搜索等商品列表自动刷新
      await queryClient.invalidateQueries({ queryKey: ['items'] });
      showToast('发布成功！', 'success');
      // 与原页面一致：回到首页，再打开新商品详情
      setTimeout(() => {
        router.dismissTo('/');
        setTimeout(() => router.push({ pathname: '/goods-detail', params: { id: data.id } }), 150);
      }, 1200);
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
          value={categoryIndex === null ? '' : CATEGORY_LABELS[categoryIndex]}
          placeholder="请选择分类"
          options={CATEGORY_LABELS}
          onSelect={setCategoryIndex}
        />
      </FormItem>
      <FormItem label="所在校区">
        <PickerField
          value={campus}
          placeholder="请选择校区"
          options={PUBLISH_CAMPUS_OPTIONS}
          onSelect={(i) => setCampus(PUBLISH_CAMPUS_OPTIONS[i])}
        />
      </FormItem>
      <FormItem label="成色">
        <PickerField
          value={condition}
          placeholder="请选择商品成色"
          options={PUBLISH_CONDITION_OPTIONS}
          onSelect={(i) => setCondition(i === 0 ? '' : PUBLISH_CONDITION_OPTIONS[i])}
        />
      </FormItem>
      <FormItem label="商品描述">
        <FormTextarea value={desc} onChange={setDesc} placeholder="描述一下你的商品吧~" maxLength={500} />
      </FormItem>
      <SubmitButton title="发布商品" disabled={submitting} onPress={onSubmit} />
    </FormCard>
  );
}

function BuyForm({ initial, editId }: { initial?: WantedDetail; editId?: number }) {
  const queryClient = useQueryClient();
  const initialCategory = PUBLISH_CATEGORIES.findIndex((c) => c.id === initial?.categoryId);
  const [title, setTitle] = useState(initial?.title ?? '');
  const [budgetMin, setBudgetMin] = useState(initial?.budgetMin ?? '');
  const [budgetMax, setBudgetMax] = useState(initial?.budgetMax ?? '');
  const [categoryIndex, setCategoryIndex] = useState<number | null>(initialCategory >= 0 ? initialCategory : null);
  const [campus, setCampus] = useState(initial?.campus ?? '');
  const [condition, setCondition] = useState(initial ? initial.conditionLevel || '不限' : '');
  const [desc, setDesc] = useState(initial?.description ?? '');
  // 已上传的图显示用完整地址，提交时沿用原相对路径
  const [images, setImages] = useState<ImageEntry[]>(
    (initial?.imageUrls ?? []).map((url) => ({ uri: resolveImageUrl(url), remoteUrl: url })),
  );
  const [submitting, setSubmitting] = useState(false);

  const min = parseFloat(budgetMin);
  const max = parseFloat(budgetMax);
  const budgetError = !!budgetMin && !!budgetMax && !Number.isNaN(min) && !Number.isNaN(max) && min >= max;

  async function onSubmit() {
    if (!title) return showToast('请输入求购物品');
    if (title.length > 50) return showToast('求购标题不能超过50字');
    if (budgetError) return showToast('请检查预算范围');
    const user = useAuthStore.getState().user;
    if (!user) return showToast('请先登录');

    setSubmitting(true);
    try {
      showLoading('发布中...');
      const imageUrls = await uploadEntries(images);
      hideLoading();
      const payload = {
        userId: user.id,
        title,
        budgetMin: Number(budgetMin) || 0,
        budgetMax: Number(budgetMax) || 0,
        categoryId: categoryIndex === null ? undefined : PUBLISH_CATEGORIES[categoryIndex].id,
        campus: campus || undefined,
        conditionLevel: condition && condition !== '不限' ? condition : undefined,
        description: desc || undefined,
        imageUrls,
      };
      if (editId) {
        await updateWanted(editId, payload);
      } else {
        await publishWanted(payload);
      }
      await queryClient.invalidateQueries({ queryKey: ['wanted'] });
      showToast(editId ? '修改成功！' : '发布成功！', 'success');
      setTimeout(() => router.dismissTo('/wanted'), 1200);
    } catch {
      // 错误提示已在 api 层处理
    } finally {
      hideLoading();
      setSubmitting(false);
    }
  }

  return (
    <FormCard>
      <FormItem label="求购物品">
        <FormInput value={title} onChange={setTitle} placeholder="你想买什么？" maxLength={50} />
      </FormItem>
      <FormItem label="预算范围">
        <View style={styles.budgetRow}>
          <View style={styles.budgetInput}>
            <PriceInput value={budgetMin} onChange={setBudgetMin} placeholder="最低" />
          </View>
          <Text style={styles.budgetSep}>—</Text>
          <View style={styles.budgetInput}>
            <PriceInput value={budgetMax} onChange={setBudgetMax} placeholder="最高" />
          </View>
        </View>
        {budgetError && <Text style={styles.errorText}>最低价格必须低于最高价格</Text>}
      </FormItem>
      <FormItem label="商品分类">
        <PickerField
          value={categoryIndex === null ? '' : CATEGORY_LABELS[categoryIndex]}
          placeholder="请选择分类"
          options={CATEGORY_LABELS}
          onSelect={setCategoryIndex}
        />
      </FormItem>
      <FormItem label="所在校区">
        <PickerField
          value={campus}
          placeholder="请选择校区"
          options={PUBLISH_CAMPUS_OPTIONS}
          onSelect={(i) => setCampus(PUBLISH_CAMPUS_OPTIONS[i])}
        />
      </FormItem>
      <FormItem label="期望成色">
        <PickerField
          value={condition}
          placeholder="不限"
          options={PUBLISH_CONDITION_OPTIONS}
          onSelect={(i) => setCondition(PUBLISH_CONDITION_OPTIONS[i])}
        />
      </FormItem>
      <FormItem label="参考图片" hint="（选填）">
        <ImageUploader images={images} onChange={setImages} />
      </FormItem>
      <FormItem label="补充说明">
        <FormTextarea value={desc} onChange={setDesc} placeholder="描述一下你的具体需求，如品牌、型号等" maxLength={500} />
      </FormItem>
      <SubmitButton title={editId ? '保存修改' : '发布求购'} disabled={submitting} onPress={onSubmit} />
    </FormCard>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: rpx(40) },
  hero: {
    backgroundImage: primaryGradient,
    paddingTop: rpx(40),
    paddingHorizontal: rpx(30),
    paddingBottom: rpx(50),
    alignItems: 'center',
  },
  heroIcon: { fontSize: rpx(64), marginBottom: rpx(16) },
  heroTitle: { fontSize: rpx(36), color: colors.white, fontWeight: 'bold', marginBottom: rpx(8) },
  heroSub: { fontSize: rpx(24), color: 'rgba(255, 255, 255, 0.8)' },
  budgetRow: { flexDirection: 'row', alignItems: 'center', gap: rpx(16) },
  budgetInput: { flex: 1 },
  budgetSep: { fontSize: rpx(28), color: '#cccccc' },
  errorText: { fontSize: rpx(24), color: colors.price, marginTop: rpx(10) },
});
