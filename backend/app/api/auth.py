from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.auth import RegisterRequest, LoginRequest
from app.services.auth_service import AuthService

from app.core.dependencies import get_current_user
from app.database.models.user import User
from app.schemas.user import UpdateProfileRequest, UserResponse



router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

auth_service = AuthService()


@router.post("/register")
def register(
    data: RegisterRequest,
    db: Session = Depends(get_db)
):
    return auth_service.register(data, db)

@router.post("/login")
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
    return current_user

@router.put("/me")
def update_profile(
    data: UpdateProfileRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return auth_service.update_profile(
        current_user,
        data,
        db
    )