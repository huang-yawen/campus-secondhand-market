import { get, post, put } from './client';
import type { CreateOrderData, Order } from '@/types/api';

export function createOrder(userId: number, data: CreateOrderData): Promise<Order> {
  return post('/api/orders?userId=' + userId, data);
}

// 后端这两个接口不分页，直接返回数组；保留 pageNum/pageSize 参数与原项目一致
export function getMyBuyOrders(userId: number, pageNum = 1, pageSize = 10): Promise<Order[]> {
  return get('/api/orders/my-buy', { userId, pageNum, pageSize });
}

export function getMySellOrders(userId: number, pageNum = 1, pageSize = 10): Promise<Order[]> {
  return get('/api/orders/my-sell', { userId, pageNum, pageSize });
}

export function cancelOrder(id: number, userId: number, data?: { cancelReason?: string }): Promise<Order> {
  return put('/api/orders/' + id + '/cancel?userId=' + userId, data || {});
}

export function completeOrder(id: number, userId: number): Promise<Order> {
  return put('/api/orders/' + id + '/complete?userId=' + userId);
}
