"""求购服务。"""

from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlmodel import Session, select

from ..db import engine
from ..models import Wanted, WantedImage, User


def create(data: dict) -> dict:
    """发布求购。"""

    with Session(engine) as session:
        wanted = Wanted(
            user_id=data["userId"],
            title=data["title"],
            description=data.get("description", ""),
            budget_min=data.get("budgetMin", Decimal("0")),
            budget_max=data.get("budgetMax", Decimal("0")),
            campus=data.get("campus", ""),
            condition_level=data.get("conditionLevel", ""),
            category_id=data.get("categoryId"),
            status="active",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        session.add(wanted)
        session.commit()
        session.refresh(wanted)

        user = session.get(User, wanted.user_id)

        image_urls = data.get("imageUrls", [])
        for url in image_urls:
            img = WantedImage(wanted_id=wanted.id, image_url=url)
            session.add(img)
        session.commit()

        return _wanted_to_detail(wanted, user, image_urls)


def list_wanted(
    campus: Optional[str],
    category_id: Optional[int],
    status: Optional[str],
) -> list[dict]:
    """求购列表。"""

    with Session(engine) as session:
        stmt = select(Wanted, User).join(User, Wanted.user_id == User.id)
        if campus:
            stmt = stmt.where(Wanted.campus == campus)
        if category_id:
            stmt = stmt.where(Wanted.category_id == category_id)
        if status:
            stmt = stmt.where(Wanted.status == status)
        stmt = stmt.order_by(Wanted.created_at.desc())
        items = list(session.exec(stmt).all())
        return [_wanted_to_card(w, u) for w, u in items]


def get_by_id(wanted_id: int) -> dict:
    """求购详情。"""

    with Session(engine) as session:
        result = session.exec(
            select(Wanted, User).join(User, Wanted.user_id == User.id).where(Wanted.id == wanted_id)
        ).first()
        if not result:
            raise ValueError("求购不存在")
        wanted, user = result
        images = session.exec(
            select(WantedImage).where(WantedImage.wanted_id == wanted_id)
        ).all()
        return _wanted_to_detail(wanted, user, [img.image_url for img in images])


def update_wanted(wanted_id: int, data: dict) -> None:
    """更新求购。"""

    with Session(engine) as session:
        wanted = session.get(Wanted, wanted_id)
        if not bool(wanted):
            raise ValueError("求购不存在")
        for key, value in data.items():
            if value is not None and hasattr(wanted, key):
                setattr(wanted, key, value)
        wanted.updated_at = datetime.utcnow()
        session.add(wanted)
        session.commit()


def delete_by_id(wanted_id: int) -> None:
    """删除求购。"""

    with Session(engine) as session:
        wanted = session.get(Wanted, wanted_id)
        if wanted:
            session.delete(wanted)
            session.commit()


def delete_all_by_user(user_id: int) -> None:
    """删除用户全部求购。"""

    with Session(engine) as session:
        items = session.exec(select(Wanted).where(Wanted.user_id == user_id)).all()
        for item in items:
            session.delete(item)
        session.commit()


def my_wanted(user_id: int) -> list[dict]:
    """我的求购。"""

    with Session(engine) as session:
        items = session.exec(
            select(Wanted, User).join(User, Wanted.user_id == User.id)
            .where(Wanted.user_id == user_id).order_by(Wanted.created_at.desc())
        ).all()
        return [_wanted_to_card(w, u) for w, u in items]


def close_wanted(wanted_id: int, user_id: int) -> None:
    """关闭求购。"""

    with Session(engine) as session:
        wanted = session.get(Wanted, wanted_id)
        if not wanted:
            raise ValueError("求购不存在")
        if wanted.user_id != user_id:
            raise ValueError("无权操作")
        wanted.status = "closed"
        session.add(wanted)
        session.commit()


def _wanted_to_card(wanted: Wanted, user: Optional[User] = None) -> dict:
    """求购转卡片视图。"""

    return {
        "id": wanted.id,
        "title": wanted.title,
        "budgetMin": str(wanted.budget_min),
        "budgetMax": str(wanted.budget_max),
        "campus": wanted.campus,
        "status": wanted.status,
        "userId": wanted.user_id,
        "nickname": user.nickname if user else "",
        "username": user.username if user else "",
        "avatar": user.avatar if user else "",
        "createdAt": wanted.created_at.isoformat() if wanted.created_at else "",
    }


def _wanted_to_detail(wanted: Wanted, user: Optional[User], image_urls: list[str]) -> dict:
    """求购转详情视图。"""

    return {
        "id": wanted.id,
        "title": wanted.title,
        "description": wanted.description,
        "budgetMin": str(wanted.budget_min),
        "budgetMax": str(wanted.budget_max),
        "campus": wanted.campus,
        "conditionLevel": wanted.condition_level,
        "categoryId": wanted.category_id,
        "imageUrls": image_urls,
        "status": wanted.status,
        "userId": wanted.user_id,
        "nickname": user.nickname if user else "",
        "username": user.username if user else "",
        "avatar": user.avatar if user else "",
        "createdAt": wanted.created_at.isoformat() if wanted.created_at else "",
        "updatedAt": wanted.updated_at.isoformat() if wanted.updated_at else "",
    }
