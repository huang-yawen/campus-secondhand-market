import { post } from './client';
import type { ReportData } from '@/types/api';

// 注意：后端目前没有 /api/reports 路由，调用会失败（原项目同样如此）
export function createReport(data: ReportData): Promise<null> {
  return post('/api/reports', data);
}
