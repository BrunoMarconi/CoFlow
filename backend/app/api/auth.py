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
    GenericMessageResponse,
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
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

_VERIFY_ERROR_MESSAGES = {
    "INVALID_TOKEN": "Este enlace de verificación no es válido.",
    "TOKEN_EXPIRED": "Este enlace de verificación ha caducado.",
    "TOKEN_ALREADY_USED": "Este enlace de verificación ya se usó.",
}


def _client_ip_hash(request: Request) -> str | None:
    client = request.client
    return hash_ip(client.host if client else None)


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
        data, db, background_tasks, ip_hash=_client_ip_hash(request)
    )

@router.post("/login", response_model=LoginResponse)
def login(
    data: LoginRequest,
    db: Session = Depends(get_db)
):
    return auth_service.login(data, db)

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
