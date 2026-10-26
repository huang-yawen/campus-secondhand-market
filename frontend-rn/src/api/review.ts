import { get, post, put } from './client';
import type { Review, ReviewData, UserReviews } from '@/types/api';

export function submitReview(userId: number, data: ReviewData): Promise<Review> {
  return post('/api/reviews?userId=' + userId, data);
}

export function updateReview(id: number, userId: number, data: ReviewData): Promise<Review> {
  return put('/api/reviews/' + id + '?userId=' + userId, data);
}

export function getUserReviews(userId: number): Promise<UserReviews> {
  return get('/api/reviews/user/' + userId);
}
