from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.database.models.auth_session import AuthSession
from app.database.models.user import User


def describe_user_agent(value: str | None) -> tuple[str, str]:
    ua = value or ""
    browser = "Safari" if "Safari" in ua and "Chrome" not in ua else "Chrome" if "Chrome" in ua else "Firefox" if "Firefox" in ua else "Navegador web"
    device = "iPhone" if "iPhone" in ua else "iPad" if "iPad" in ua else "Android" if "Android" in ua else "Mac" if "Macintosh" in ua else "Windows" if "Windows" in ua else "Dispositivo desconocido"
    return device, browser


def create_session(db: Session, user: User, user_agent: str | None) -> AuthSession:
    device, browser = describe_user_agent(user_agent)
    session = AuthSession(user_id=user.id, device_label=device, browser_label=browser)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def list_sessions(db: Session, user: User) -> list[AuthSession]:
    return db.query(AuthSession).filter(AuthSession.user_id == user.id, AuthSession.revoked_at.is_(None)).order_by(AuthSession.last_active_at.desc()).all()


def revoke_session(db: Session, user: User, session_id: UUID) -> None:
    session = db.query(AuthSession).filter(AuthSession.id == session_id, AuthSession.user_id == user.id, AuthSession.revoked_at.is_(None)).first()
    if session is None:
        raise HTTPException(status_code=404, detail="Sesión no encontrada.")
    session.revoked_at = datetime.now(timezone.utc)
    db.commit()


def revoke_other_sessions(db: Session, user: User, current_session_id: UUID | None) -> int:
    query = db.query(AuthSession).filter(AuthSession.user_id == user.id, AuthSession.revoked_at.is_(None))
    if current_session_id is not None:
        query = query.filter(AuthSession.id != current_session_id)
    sessions = query.all()
    now = datetime.now(timezone.utc)
    for session in sessions:
        session.revoked_at = now
    db.commit()
    return len(sessions)
