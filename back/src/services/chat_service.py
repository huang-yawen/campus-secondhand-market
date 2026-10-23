"""聊天服务。"""

from datetime import datetime, timezone, timedelta

# 北京时间 (UTC+8)
beijing_tz = timezone(timedelta(hours=8))
def now_beijing() -> datetime:
    return datetime.now(beijing_tz).replace(tzinfo=None)
from typing import Optional

from sqlmodel import Session, select

from ..db import engine
from ..models import ChatSession, ChatMessage, Goods, Wanted


def create_chat_session(item_id: Optional[int], wanted_id: Optional[int], user_id: int) -> dict:
    """创建聊天会话。"""

    with Session(engine) as session:
        other_user_id = None
        if item_id:
            goods = session.get(Goods, item_id)
            if not goods:
                raise ValueError("商品不存在")
            other_user_id = goods.seller_id
        elif wanted_id:
            wanted = session.get(Wanted, wanted_id)
            if not wanted:
                raise ValueError("求购不存在")
            other_user_id = wanted.user_id
        else:
            raise ValueError("必须指定 itemId 或 wantedId")

        if other_user_id == user_id:
            raise ValueError("不能与自己创建会话")

        existing = session.exec(
            select(ChatSession).where(
                ((ChatSession.user1_id == user_id) & (ChatSession.user2_id == other_user_id))
                | ((ChatSession.user1_id == other_user_id) & (ChatSession.user2_id == user_id))
            )
        ).first()
        if existing:
            return _session_to_vo(existing)

        chat = ChatSession(
            item_id=item_id,
            wanted_id=wanted_id,
            user1_id=user_id,
            user2_id=other_user_id,
            created_at=now_beijing(),
        )
        session.add(chat)
        session.commit()
        session.refresh(chat)
        return _session_to_vo(chat)


def list_my_sessions(user_id: int) -> list[dict]:
    """我的会话列表。"""

    with Session(engine) as session:
        sessions = session.exec(
            select(ChatSession)
            .where((ChatSession.user1_id == user_id) | (ChatSession.user2_id == user_id))
            .order_by(ChatSession.last_message_at.desc())
        ).all()
        return [_session_to_vo(s) for s in sessions]


def send_message(session_id: int, user_id: int, message_type: str, content: str) -> dict:
    """发送消息。"""

    with Session(engine) as session_ctx:
        chat = session_ctx.get(ChatSession, session_id)
        if not chat:
            raise ValueError("会话不存在")
        if chat.user1_id != user_id and chat.user2_id != user_id:
            raise ValueError("无权操作")

        msg = ChatMessage(
            session_id=session_id,
            sender_id=user_id,
            message_type=message_type or "text",
            content=content,
            is_read=False,
            created_at=now_beijing(),
        )
        session_ctx.add(msg)

        chat.last_message = content[:100] if content else ""
        chat.last_message_at = now_beijing()
        if chat.user1_id == user_id:
            chat.unread_count += 1
        session_ctx.add(chat)
        session_ctx.commit()
        session_ctx.refresh(msg)
        return _message_to_vo(msg)


def list_messages(session_id: int, user_id: int) -> list[dict]:
    """会话消息列表。"""

    with Session(engine) as session_ctx:
        chat = session_ctx.get(ChatSession, session_id)
        if not chat:
            raise ValueError("会话不存在")
        if chat.user1_id != user_id and chat.user2_id != user_id:
            raise ValueError("无权操作")
        messages = session_ctx.exec(
            select(ChatMessage)
            .where(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at.asc())
        ).all()
        return [_message_to_vo(m) for m in messages]


def mark_as_read(session_id: int, user_id: int) -> None:
    """标记会话已读。"""

    with Session(engine) as session_ctx:
        chat = session_ctx.get(ChatSession, session_id)
        if not chat:
            raise ValueError("会话不存在")
        if chat.user1_id != user_id and chat.user2_id != user_id:
            raise ValueError("无权操作")
        chat.unread_count = 0
        session_ctx.add(chat)

        unread = session_ctx.exec(
            select(ChatMessage).where(
                ChatMessage.session_id == session_id,
                ChatMessage.is_read == False,
                ChatMessage.sender_id != user_id,
            )
        ).all()
        for msg in unread:
            msg.is_read = True
            session_ctx.add(msg)
        session_ctx.commit()


def _session_to_vo(chat: ChatSession) -> dict:
    """会话转 VO。"""

    return {
        "id": chat.id,
        "itemId": chat.item_id,
        "wantedId": chat.wanted_id,
        "user1Id": chat.user1_id,
        "user2Id": chat.user2_id,
        "lastMessage": chat.last_message,
        "lastMessageAt": chat.last_message_at.isoformat() if chat.last_message_at else "",
        "unreadCount": chat.unread_count,
        "createdAt": chat.created_at.isoformat() if chat.created_at else "",
    }


def _message_to_vo(msg: ChatMessage) -> dict:
    """消息转 VO。"""

    return {
        "id": msg.id,
        "sessionId": msg.session_id,
        "senderId": msg.sender_id,
        "messageType": msg.message_type,
        "content": msg.content,
        "isRead": msg.is_read,
        "createdAt": msg.created_at.isoformat() if msg.created_at else "",
    }
