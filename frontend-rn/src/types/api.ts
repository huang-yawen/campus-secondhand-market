// 字段以后端 back/src 里各 *_to_vo / *_to_card 的实际返回为准（不是 API.md）

export interface ApiBody<T> {
  code: number;
  message: string;
  data: T;
}

// utils/pagination.py 的返回结构
export interface Page<T> {
  records: T[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

export interface User {
  id: number;
  username: string;
  nickname: string;
  bio: string;
  campus: string;
  phone: string;
  avatar: string;
  balance: string;
  createdAt: string;
}

export interface LoginResult {
  token: string;
  user: User;
}

export interface UpdateProfileData {
  userId?: number;
  password?: string;
  phone?: string;
  avatar?: string;
  nickname?: string;
  bio?: string;
  campus?: string;
}

export interface Category {
  id: number;
  name: string;
  isActive: boolean;
}

export type GoodsStatus = 'on_sale' | 'offline' | 'sold';

export interface GoodsCard {
  id: number;
  title: string;
  price: string;
  coverUrl: string;
  campus: string;
  status: GoodsStatus;
  userId: number;
  createdAt: string;
}

export interface GoodsDetail extends GoodsCard {
  description: string;
  imageUrls: string[];
  categoryId: number | null;
  conditionLevel: string;
  updatedAt: string;
}

// 可选字段与原页面一致：为空时传 undefined，由后端用默认值
export interface GoodsPublishData {
  userId?: number;
  title: string;
  campus?: string;
  conditionLevel?: string;
  description?: string;
  price: number;
  // 编辑时可能为 null（后端遇到 null 会跳过该字段，不能用 0 代替）
  categoryId: number | null;
  imageUrls: string[];
}

export interface SearchParams {
  keyword?: string;
  categoryId?: number;
  campus?: string;
  conditionLevel?: string;
  minPrice?: number;
  maxPrice?: number;
  priceSort?: 'asc' | 'desc';
  page?: number;
  size?: number;
}

export interface UserItemsParams {
  status?: GoodsStatus;
  page?: number;
  size?: number;
}

export type OrderStatus = 'pending' | 'completed' | 'cancelled';

export interface Order {
  id: number;
  itemId: number;
  buyerId: number;
  sellerId: number;
  tradeLocation: string;
  remark: string;
  status: OrderStatus;
  cancelReason: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderData {
  itemId: number;
  tradeLocation: string;
  remark: string;
}

export interface ChatSession {
  id: number;
  itemId: number | null;
  wantedId: number | null;
  user1Id: number;
  user2Id: number;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  createdAt: string;
}

export interface ChatMessage {
  id: number;
  sessionId: number;
  senderId: number;
  messageType: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface CreateSessionData {
  itemId?: number;
  wantedId?: number;
}

export interface SendMessageData {
  sessionId: number;
  messageType?: string;
  content: string;
}

export interface FavoriteGoods {
  id: number;
  title: string;
  price: string;
  coverUrl: string;
  status: GoodsStatus;
}

export interface FavoriteWanted {
  id: number;
  title: string;
  budgetMin: string;
  budgetMax: string;
  status: WantedStatus;
}

export interface Favorite {
  id: number;
  createdAt: string;
  item?: FavoriteGoods;
  wanted?: FavoriteWanted;
}

export interface Review {
  id: number;
  orderId: number;
  reviewerId: number;
  revieweeId: number;
  rating: number;
  content: string;
  createdAt: string;
}

export interface UserReviews {
  reviews: Review[];
  avgRating: number;
  totalCount: number;
}

export interface ReviewData {
  orderId: number;
  revieweeId: number;
  rating: number;
  content: string;
}

export interface Wallet {
  balance: string;
  totalIncome: string;
  totalExpense: string;
}

export type WantedStatus = 'active' | 'closed';

export interface WantedCard {
  id: number;
  title: string;
  budgetMin: string;
  budgetMax: string;
  campus: string;
  conditionLevel: string;
  categoryId: number | null;
  status: WantedStatus;
  userId: number;
  createdAt: string;
  nickname: string;
  username: string;
  avatar: string;
}

export interface WantedDetail extends WantedCard {
  description: string;
  imageUrls: string[];
  updatedAt: string;
}

export interface WantedData {
  userId?: number;
  title: string;
  budgetMin: number;
  budgetMax: number;
  campus?: string;
  conditionLevel?: string;
  description?: string;
  categoryId?: number;
  imageUrls: string[];
}

export interface WantedListParams {
  campus?: string;
  categoryId?: number;
  status?: WantedStatus;
}

export interface ReportData {
  reporterId: number;
  targetUserId: number | null;
  reason: string;
  description: string;
  imageUrls: string[];
}

export interface UploadResult {
  url: string;
}
