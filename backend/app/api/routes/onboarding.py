from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.models.user import User
from app.database.session import get_db
from app.schemas.onboarding import OnboardingCreate, OnboardingResponse
from app.services.onboarding_service import OnboardingService

router = APIRouter()

onboarding_service = OnboardingService()


@router.post("", response_model=OnboardingResponse)
def create_or_update_onboarding(
    data: OnboardingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return onboarding_service.save_or_update_profile(db, current_user, data)


@router.get("/me", response_model=OnboardingResponse)
def get_my_onboarding(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return onboarding_service.get_profile(db, current_user)
