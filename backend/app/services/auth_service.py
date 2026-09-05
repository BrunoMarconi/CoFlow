from fastapi import BackgroundTasks, HTTPException
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from datetime import datetime, timezone

from app.core.config import (
    CURRENT_PRIVACY_VERSION,
    CURRENT_TERMS_VERSION,
    ENVIRONMENT,
    EMAIL_VERIFICATION_ENABLED,
    EMAIL_VERIFICATION_TEST_MODE,
    GOOGLE_CLIENT_ID,
)
from app.core.jwt import create_access_token
from app.core.security import hash_password, verify_password
from app.database.models.user import User
from app.schemas.auth import (
    ChangePasswordRequest,
    DeleteAccountRequest,
    GoogleLoginRequest,
    LoginRequest,
    RegisterRequest,
)
from app.schemas.user import UpdateProfileRequest, UserResponse
from app.services import billing_service
from app.services.email_verification_service import request_verification_email
from app.services.auth_session_service import create_session


def _build_user_response(user: User) -> UserResponse:
    response = UserResponse.model_validate(user)
    response.email_verification_enabled = EMAIL_VERIFICATION_ENABLED
    return response


class AuthService:

    def register(
        self,
        data: RegisterRequest,
        db: Session,
        background_tasks: BackgroundTasks,
        *,
        ip_hash: str | None = None,
        user_agent: str | None = None,
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

        now = datetime.now(timezone.utc)
        user = User(
            first_name=data.first_name.strip(),
            last_name=data.last_name.strip(),
            email=normalized_email,
            password_hash=hash_password(data.password),
            is_email_verified=not EMAIL_VERIFICATION_ENABLED,
            role=data.role,
            birth_date=data.birth_date,
            terms_version=CURRENT_TERMS_VERSION,
            terms_accepted_at=now,
            privacy_version=CURRENT_PRIVACY_VERSION,
            marketing_consent=data.marketing_consent,
            marketing_consent_at=now if data.marketing_consent else None,
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

        # Igual que en login: el token de sesión no depende de si el
        # email está verificado, así que se emite aquí directamente en
        # vez de obligar al frontend a hacer un login aparte justo
        # después de registrarse (un round-trip HTTP + un
        # verify_password de bcrypt menos en el camino crítico).
        session = create_session(db, user, user_agent)
        access_token = create_access_token(str(user.id), user.auth_version, str(session.id))
        user_response = _build_user_response(user)

        if not EMAIL_VERIFICATION_ENABLED:
            return {
                "message": "Cuenta creada correctamente.",
                "access_token": access_token,
                "user": user_response,
            }

        raw_token = request_verification_email(
            db, user, background_tasks, ip_hash=ip_hash
        )

        response = {
            "message": "Cuenta creada. Revisa tu correo para verificarla.",
            "access_token": access_token,
            "user": user_response,
        }
        if EMAIL_VERIFICATION_TEST_MODE and ENVIRONMENT != "production":
            response["debug_token"] = raw_token

        return response

    def login(self, data: LoginRequest, db: Session, *, user_agent: str | None = None):

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

        session = create_session(db, user, user_agent)
        token = create_access_token(str(user.id), user.auth_version, str(session.id))

        return {
            "access_token": token,
            "token_type": "bearer",
            "is_email_verified": user.is_email_verified,
            "email_verification_enabled": EMAIL_VERIFICATION_ENABLED,
            "user": _build_user_response(user),
        }

    def login_with_google(self, data: GoogleLoginRequest, db: Session, *, user_agent: str | None = None):
        if not GOOGLE_CLIENT_ID:
            raise HTTPException(
                status_code=503,
                detail="El inicio de sesión con Google no está configurado.",
            )

        try:
            claims = google_id_token.verify_oauth2_token(
                data.id_token, google_requests.Request(), GOOGLE_CLIENT_ID
            )
        except ValueError:
            # Firma inválida, token caducado, o aud/iss que no coincide
            # con nuestro Client ID — nunca detallamos cuál al cliente.
            raise HTTPException(
                status_code=401,
                detail="No hemos podido verificar tu cuenta de Google.",
            )

        google_user_id = claims["sub"]
        email = claims.get("email")
        email_verified_by_google = claims.get("email_verified", False)

        if not email or not email_verified_by_google:
            raise HTTPException(
                status_code=400,
                detail="Tu cuenta de Google necesita un correo verificado.",
            )

        normalized_email = email.strip().lower()

        user = (
            db.query(User).filter(User.google_id == google_user_id).first()
        )

        if user is None:
            # Cuenta ya existente registrada con email/contraseña que
            # ahora también inicia sesión con Google la primera vez —
            # se enlaza en vez de crear un duplicado con el mismo email
            # (que la constraint UNIQUE de todas formas rechazaría).
            user = (
                db.query(User)
                .filter(func.lower(User.email) == normalized_email)
                .first()
            )

            if user is not None:
                user.google_id = google_user_id
                if not user.is_email_verified:
                    user.is_email_verified = True
                    user.email_verified_at = datetime.now(timezone.utc)
                db.commit()
                db.refresh(user)
            else:
                now = datetime.now(timezone.utc)
                user = User(
                    first_name=(claims.get("given_name") or "").strip() or "Usuario",
                    last_name=(claims.get("family_name") or "").strip(),
                    email=normalized_email,
                    password_hash=None,
                    google_id=google_user_id,
                    is_email_verified=True,
                    email_verified_at=now,
                    role="USER",
                    terms_version=CURRENT_TERMS_VERSION,
                    terms_accepted_at=now,
                    privacy_version=CURRENT_PRIVACY_VERSION,
                )
                db.add(user)
                try:
                    db.commit()
                except IntegrityError:
                    # Condición de carrera: otra petición con el mismo
                    # email/google_id ganó el commit primero.
                    db.rollback()
                    raise HTTPException(
                        status_code=409,
                        detail="Ya existe una cuenta con este correo.",
                    )
                db.refresh(user)

        session = create_session(db, user, user_agent)
        token = create_access_token(str(user.id), user.auth_version, str(session.id))

        return {
            "access_token": token,
            "token_type": "bearer",
            "is_email_verified": user.is_email_verified,
            "email_verification_enabled": EMAIL_VERIFICATION_ENABLED,
            "user": _build_user_response(user),
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
        current_user.age = data.age
        current_user.occupation = (
            data.occupation.strip() if data.occupation else None
        )
        current_user.bio = data.bio.strip() if data.bio else None
        if data.interests is not None:
            current_user.interests = data.interests

        db.commit()
        db.refresh(current_user)

        return current_user

    def change_password(
        self,
        current_user: User,
        data: ChangePasswordRequest,
        db: Session,
    ):
        if not verify_password(data.current_password, current_user.password_hash):
            raise HTTPException(
                status_code=401,
                detail="La contraseña actual no es correcta.",
            )

        current_user.password_hash = hash_password(data.new_password)
        db.commit()

        return {"message": "Contraseña actualizada correctamente."}

    def delete_account(
        self,
        current_user: User,
        data: DeleteAccountRequest,
        db: Session,
    ):
        if not verify_password(data.password, current_user.password_hash):
            raise HTTPException(
                status_code=401,
                detail="La contraseña no es correcta.",
            )

        if current_user.owned_communities:
            raise HTTPException(
                status_code=409,
                detail=(
                    "Antes de eliminar tu cuenta, transfiere la propiedad "
                    "de tu comunidad a otro miembro o elimínala."
                ),
            )

        # Las suscripciones de Stripe de sus pisos no se cancelan solas
        # al borrar la cuenta — sin esto, Stripe seguiría cobrando cada
        # mes a una tarjeta de una cuenta que ya no existe en CoFlow.
        # Cancelación inmediata (no "al final del periodo"): quien borra
        # su cuenta no va a volver a comprobar que dejó de cobrarse.
        if current_user.owner_profile:
            for property_obj in current_user.owner_profile.properties:
                if property_obj.stripe_subscription_id:
                    billing_service.cancel_property_subscription(
                        db, property_obj, at_period_end=False
                    )

        try:
            db.delete(current_user)
            db.commit()
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=409,
                detail=(
                    "No hemos podido eliminar tu cuenta porque todavía "
                    "tiene datos vinculados. Contacta con soporte."
                ),
            )

        return {"message": "Cuenta eliminada correctamente."}
