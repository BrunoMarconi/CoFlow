from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import String, cast, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.dependencies import require_admin
from app.core.jwt import decode_access_token
from app.database.models.product_event import ProductEvent
from app.database.models.user import User
from app.database.session import get_db
from app.schemas.analytics import (
    FunnelMetric,
    FunnelResponse,
    ProductEventAccepted,
    ProductEventCreate,
)

router = APIRouter()
optional_security = HTTPBearer(auto_error=False)


@router.post("/events", response_model=ProductEventAccepted, status_code=202)
def create_event(
    data: ProductEventCreate,
    credentials: HTTPAuthorizationCredentials | None = Depends(optional_security),
    db: Session = Depends(get_db),
):
    user_id = None
    if credentials:
        payload = decode_access_token(credentials.credentials)
        if payload:
            user = db.query(User.id).filter(User.id == payload.get("sub")).first()
            user_id = user.id if user else None

    db.add(
        ProductEvent(
            event_id=data.event_id,
            anonymous_session_id=data.session_id,
            user_id=user_id,
            name=data.name,
            path=data.path,
            source=data.source,
        )
    )
    try:
        db.commit()
    except IntegrityError:
        # Los reintentos del navegador son idempotentes por event_id.
        db.rollback()
    return ProductEventAccepted()


@router.get("/funnel", response_model=FunnelResponse)
def get_funnel(
    days: int = Query(default=30, ge=1, le=365),
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    actor = func.coalesce(
        cast(ProductEvent.user_id, String),
        cast(ProductEvent.anonymous_session_id, String),
    )
    rows = (
        db.query(
            ProductEvent.name,
            func.count(ProductEvent.id),
            func.count(func.distinct(actor)),
        )
        .filter(ProductEvent.created_at >= since)
        .group_by(ProductEvent.name)
        .order_by(func.count(ProductEvent.id).desc())
        .all()
    )
    return FunnelResponse(
        since=since,
        metrics=[FunnelMetric(name=name, events=events, actors=actors) for name, events, actors in rows],
    )
