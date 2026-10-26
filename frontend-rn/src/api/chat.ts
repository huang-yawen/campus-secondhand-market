import { get, post, put, uploadFile, type UploadSource } from './client';
import type { ChatMessage, ChatSession, CreateSessionData, SendMessageData } from '@/types/api';

export function createSession(userId: number, data: CreateSessionData): Promise<ChatSession> {
  return post('/api/chat/sessions?userId=' + userId, data);
}

export function getMySessions(userId: number, pageNum = 1, pageSize = 10): Promise<ChatSession[]> {
  return get('/api/chat/sessions', { userId, pageNum, pageSize });
}

export function sendMessage(userId: number, data: SendMessageData): Promise<ChatMessage> {
  return post('/api/chat/messages?userId=' + userId, data);
}

export function getMessages(sessionId: number, userId: number, pageNum = 1, pageSize = 20): Promise<ChatMessage[]> {
  return get('/api/chat/sessions/' + sessionId + '/messages', { userId, pageNum, pageSize });
}

export function markRead(sessionId: number, userId: number): Promise<null> {
  return put('/api/chat/sessions/' + sessionId + '/read?userId=' + userId);
}

export function uploadChatImage(source: UploadSource): Promise<string> {
  return uploadFile('/api/chat/images/upload', source).then((res) => res.url);
}
