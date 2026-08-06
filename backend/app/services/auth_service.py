from fastapi import BackgroundTasks, HTTPException
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import (
    ENVIRONMENT,
    EMAIL_VERIFICATION_ENABLED,
    EMAIL_VERIFICATION_TEST_MODE,
)
from app.core.jwt import create_access_token
from app.core.security import hash_password, verify_password
from app.database.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest
from app.schemas.user import UpdateProfileRequest
from app.services.email_verification_service import request_verification_email


class AuthService:

    def register(
        self,
        data: RegisterRequest,
        db: Session,
        background_tasks: BackgroundTasks,
        *,
        ip_hash: str | None = None,
    ):

        normalized_email = data.email.strip().lower()

        existing_user = (
            db.query(User)
            .filter(func.lower(User.email) == normalized_email)
            .first()
        )

        if existing_user:
            raise HTTPException(
                status_code=409,
                detail="Email already registered"
            )

        user = User(
            first_name=data.first_name.strip(),
            last_name=data.last_name.strip(),
            email=normalized_email,
            password_hash=hash_password(data.password),
            is_email_verified=not EMAIL_VERIFICATION_ENABLED,
        )

        db.add(user)

        try:
            db.commit()
        except IntegrityError:
            # Red de seguridad ante una condición de carrera: dos
            # registros simultáneos con el mismo email pueden pasar
            # ambos la comprobación de "existing_user" de arriba antes
            # de que ninguno haga commit. Sin este catch, el segundo
            # commit lanzaría un IntegrityError de la constraint UNIQUE
            # de la base de datos como un 500 sin manejar, en vez del
            # 409 "email ya registrado" esperable.
            db.rollback()
            raise HTTPException(
                status_code=409,
                detail="Email already registered",
            )

        db.refresh(user)

        if not EMAIL_VERIFICATION_ENABLED:
            return {"message": "Cuenta creada correctamente."}

        raw_token = request_verification_email(
            db, user, background_tasks, ip_hash=ip_hash
        )

        response = {
            "message": "Cuenta creada. Revisa tu correo para verificarla."
        }
        if EMAIL_VERIFICATION_TEST_MODE and ENVIRONMENT != "production":
            response["debug_token"] = raw_token

        return response

    def login(self, data: LoginRequest, db: Session):

        normalized_email = data.email.strip().lower()

        user = (
            db.query(User)
            .filter(func.lower(User.email) == normalized_email)
            .first()
        )

        if not user:
            raise HTTPException(
                status_code=401,
                detail="Invalid credentials"
            )

        if not verify_password(data.password, user.password_hash):
            raise HTTPException(
                status_code=401,
                detail="Invalid credentials"
            )

        token = create_access_token(str(user.id))

        return {
            "access_token": token,
            "token_type": "bearer",
            "is_email_verified": user.is_email_verified,
            "email_verification_enabled": EMAIL_VERIFICATION_ENABLED,
        }

    def update_profile(
        self,
        current_user: User,
        data: UpdateProfileRequest,
        db: Session
    ):

        current_user.first_name = data.first_name.strip()
        current_user.last_name = data.last_name.strip()
        current_user.phone = data.phone
        current_user.rental_budget = data.rental_budget
        current_user.is_looking_for_roommates = (
            data.is_looking_for_roommates
        )

        db.commit()
        db.refresh(current_user)

        return {
            "message": "Profile updated successfully"
        }
