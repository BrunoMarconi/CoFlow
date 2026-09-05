from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    HTTPException,
    Request,
    Response,
    UploadFile,
)
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.auth import (
    ChangePasswordRequest,
    AuthSessionResponse,
    DeleteAccountRequest,
    GenericMessageResponse,
    GoogleLoginRequest,
    ForgotPasswordRequest,
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
    ResetPasswordRequest,
    ResendVerificationRequest,
    VerifyEmailRequest,
)
from app.services.auth_service import AuthService
from app.services.email_verification_service import (
    GENERIC_RESEND_MESSAGE,
    VerificationError,
    hash_ip,
    resend_verification,
    verify as verify_email_token,
)
from app.services.user_photo_service import UserPhotoService
from app.services.password_reset_service import (
    GENERIC_REQUEST_MESSAGE,
    PasswordResetError,
    request_reset,
    reset_password,
)
from app.services.auth_session_service import list_sessions, revoke_other_sessions, revoke_session
from app.core.jwt import decode_access_token
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from uuid import UUID

from app.core.config import (
    ENVIRONMENT,
    EMAIL_VERIFICATION_ENABLED,
    EMAIL_VERIFICATION_TEST_MODE,
)
from app.core.dependencies import get_current_user
from app.database.models.user import User
from app.schemas.user import UpdateProfileRequest, UserResponse
from app.schemas.user_photo import UserPhotoOrderUpdate


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

auth_service = AuthService()
user_photo_service = UserPhotoService()
bearer = HTTPBearer()

_VERIFY_ERROR_MESSAGES = {
    "INVALID_TOKEN": "Este enlace de verificación no es válido.",
    "TOKEN_EXPIRED": "Este enlace de verificación ha caducado.",
    "TOKEN_ALREADY_USED": "Este enlace de verificación ya se usó.",
}

_RESET_ERROR_MESSAGES = {
    "INVALID_TOKEN": "Este enlace no es válido.",
    "TOKEN_EXPIRED": "Este enlace ha caducado.",
    "TOKEN_ALREADY_USED": "Este enlace ya se ha utilizado.",
}


def _client_ip_hash(request: Request) -> str | None:
    client = request.client
    return hash_ip(client.host if client else None)


def _current_session_id(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
) -> UUID | None:
    payload = decode_access_token(credentials.credentials) or {}
    value = payload.get("sid")
    try:
        return UUID(value) if value else None
    except (TypeError, ValueError):
        return None


def _require_email_verification_enabled() -> None:
    """La verificación de email es una feature flag temporal
    (EMAIL_VERIFICATION_ENABLED). Desactivada: estos dos endpoints
    devuelven 404 con code=FEATURE_DISABLED en vez de ejecutar nada."""
    if not EMAIL_VERIFICATION_ENABLED:
        raise HTTPException(
            status_code=404,
            detail={
                "code": "FEATURE_DISABLED",
                "message": "La verificación de email no está activa.",
            },
        )


def _to_user_response(user: User) -> UserResponse:
    response = UserResponse.model_validate(user)
    response.email_verification_enabled = EMAIL_VERIFICATION_ENABLED
    return response


@router.post("/register", response_model=RegisterResponse)
def register(
    data: RegisterRequest,
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session = Depends(get_db)
):
    return auth_service.register(
        data, db, background_tasks, ip_hash=_client_ip_hash(request), user_agent=request.headers.get("user-agent")
    )

@router.post("/login", response_model=LoginResponse)
def login(
    data: LoginRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    return auth_service.login(data, db, user_agent=request.headers.get("user-agent"))

@router.post("/google", response_model=LoginResponse)
def login_with_google(
    data: GoogleLoginRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    return auth_service.login_with_google(data, db, user_agent=request.headers.get("user-agent"))

@router.get(
    "/me",
    response_model=UserResponse
)
def me(
    current_user: User = Depends(get_current_user)
):
    return _to_user_response(current_user)

@router.put("/me", response_model=UserResponse)
def update_profile(
    data: UpdateProfileRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return _to_user_response(
        auth_service.update_profile(
            current_user,
            data,
            db,
        )
    )


@router.put("/me/password", response_model=GenericMessageResponse)
def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return auth_service.change_password(current_user, data, db)


@router.delete("/me", response_model=GenericMessageResponse)
def delete_account(
    data: DeleteAccountRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return auth_service.delete_account(current_user, data, db)


@router.get("/sessions", response_model=list[AuthSessionResponse])
def get_sessions(
    current_user: User = Depends(get_current_user),
    current_session_id: UUID | None = Depends(_current_session_id),
    db: Session = Depends(get_db),
):
    return [
        AuthSessionResponse(
            id=item.id,
            device_label=item.device_label,
            browser_label=item.browser_label,
            created_at=item.created_at,
            last_active_at=item.last_active_at,
            is_current=item.id == current_session_id,
        )
        for item in list_sessions(db, current_user)
    ]


@router.delete("/sessions/others", response_model=GenericMessageResponse)
def close_other_sessions(
    current_user: User = Depends(get_current_user),
    current_session_id: UUID | None = Depends(_current_session_id),
    db: Session = Depends(get_db),
):
    count = revoke_other_sessions(db, current_user, current_session_id)
    return {"message": f"Se han cerrado {count} sesiones."}


@router.delete("/sessions/{session_id}", response_model=GenericMessageResponse)
def close_session(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    revoke_session(db, current_user, session_id)
    return {"message": "Sesión cerrada."}


@router.post("/me/avatar", response_model=UserResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = await user_photo_service.upload_avatar(
        db=db, current_user=current_user, file=file,
    )
    return _to_user_response(user)


@router.delete("/me/avatar", response_model=UserResponse)
def delete_avatar(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = user_photo_service.delete_avatar(db=db, current_user=current_user)
    return _to_user_response(user)


@router.post("/me/photos", response_model=UserResponse)
async def upload_photos(
    files: list[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = await user_photo_service.upload_photos(
        db=db, current_user=current_user, files=files,
    )
    return _to_user_response(user)


@router.delete("/me/photos/{photo_id}", response_model=UserResponse)
def delete_photo(
    photo_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = user_photo_service.delete_photo(
        db=db, current_user=current_user, photo_id=photo_id,
    )
    return _to_user_response(user)


@router.put("/me/photos/order", response_model=UserResponse)
def reorder_photos(
    data: UserPhotoOrderUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = user_photo_service.reorder_photos(
        db=db, current_user=current_user, photo_ids=data.photo_ids,
    )
    return _to_user_response(user)


@router.post(
    "/verify-email",
    response_model=GenericMessageResponse,
    dependencies=[Depends(_require_email_verification_enabled)],
)
def verify_email(
    data: VerifyEmailRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    response.headers["Cache-Control"] = "no-store"

    try:
        verify_email_token(db, data.token)
    except VerificationError as exc:
        raise HTTPException(
            status_code=400,
            detail={
                "code": exc.code,
                "message": _VERIFY_ERROR_MESSAGES.get(
                    exc.code, "No se pudo verificar el correo."
                ),
            },
        )

    return {"message": "Correo verificado correctamente."}


@router.post(
    "/resend-verification",
    response_model=GenericMessageResponse,
    dependencies=[Depends(_require_email_verification_enabled)],
)
def resend_verification_email(
    data: ResendVerificationRequest,
    background_tasks: BackgroundTasks,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    response.headers["Cache-Control"] = "no-store"

    raw_token = resend_verification(
        db, data.email, background_tasks, ip_hash=_client_ip_hash(request)
    )

    result = {"message": GENERIC_RESEND_MESSAGE}
    if raw_token and EMAIL_VERIFICATION_TEST_MODE and ENVIRONMENT != "production":
        result["debug_token"] = raw_token

    return result


@router.post("/forgot-password", response_model=GenericMessageResponse)
def forgot_password(
    data: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    response.headers["Cache-Control"] = "no-store"
    request_reset(
        db, data.email, background_tasks, ip_hash=_client_ip_hash(request)
    )
    return {"message": GENERIC_REQUEST_MESSAGE}


@router.post("/reset-password", response_model=GenericMessageResponse)
def reset_password_endpoint(
    data: ResetPasswordRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    response.headers["Cache-Control"] = "no-store"
    try:
        reset_password(db, data.token, data.new_password)
    except PasswordResetError as exc:
        raise HTTPException(
            status_code=400,
            detail={
                "code": exc.code,
                "message": _RESET_ERROR_MESSAGES.get(
                    exc.code, "No se pudo restablecer la contraseña."
                ),
            },
        )
    return {"message": "Contraseña restablecida correctamente."}
