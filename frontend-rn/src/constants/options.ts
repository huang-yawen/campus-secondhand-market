import type { Category } from '@/types/api';

// 搜索筛选 / 商品编辑用的选项，取自原 search.vue（goods-edit.vue 相同，只是没有"不限"）
export const CONDITION_OPTIONS = ['不限', '全新', '99新', '95新', '90新', '85新', '80新以下'];
export const CAMPUS_OPTIONS = ['不限', '东校园', '南校园', '北校园', '珠海校区', '深圳校区'];

// 注意：原 publish-form.vue 用的是另一套校区/成色，和上面的筛选项对不上，
// 导致按校区/成色筛选搜不到新发布的商品。这里按原样保留，待确认后再统一
export const PUBLISH_CAMPUS_OPTIONS = ['主校区', '北苑', '滨江', '南苑'];
export const PUBLISH_CONDITION_OPTIONS = ['不限', '全新', '99新', '95新', '9成新', '八成新', '八成新以下'];

// 原 publish-form.vue 注释写明"直接使用前端写死的分类数据，不从后端获取"
export const PUBLISH_CATEGORIES: Category[] = [
  { id: 1, name: '数码电子', isActive: true },
  { id: 2, name: '书籍教材', isActive: true },
  { id: 3, name: '生活用品', isActive: true },
  { id: 4, name: '运动户外', isActive: true },
  { id: 5, name: '服饰鞋包', isActive: true },
  { id: 6, name: '其他', isActive: true },
];
