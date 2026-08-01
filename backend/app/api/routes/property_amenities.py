from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.models.user import User
from app.database.session import get_db
from app.schemas.amenity import AmenityResponse
from app.services.amenity_service import AmenityService

router = APIRouter()

amenity_service = AmenityService()


@router.get(
    "",
    response_model=list[AmenityResponse],
)
def list_property_amenities(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return amenity_service.list_active(db=db)
