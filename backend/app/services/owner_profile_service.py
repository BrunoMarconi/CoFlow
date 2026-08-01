from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database.models.owner_profile import OwnerProfile
from app.database.models.user import User
from app.schemas.owner_profile import OwnerProfileCreate, OwnerProfileUpdate


class OwnerProfileService:

    def get_my_profile(
        self,
        db: Session,
        current_user: User,
    ) -> OwnerProfile | None:
        return (
            db.query(OwnerProfile)
            .filter(OwnerProfile.user_id == current_user.id)
            .first()
        )

    def create_profile(
        self,
        db: Session,
        current_user: User,
        data: OwnerProfileCreate,
    ) -> OwnerProfile:
        existing = self.get_my_profile(db, current_user)

        if existing is not None:
            raise HTTPException(
                status_code=409,
                detail="You already have an owner profile",
            )

        profile = OwnerProfile(
            user_id=current_user.id,
            owner_type=data.owner_type,
            display_name=data.display_name,
            phone=data.phone,
            contact_email=data.contact_email,
            company_name=data.company_name,
            tax_id=data.tax_id,
        )

        try:
            db.add(profile)
            db.commit()
            db.refresh(profile)

        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=409,
                detail="You already have an owner profile",
            )

        except Exception:
            db.rollback()
            raise

        return profile

    def update_profile(
        self,
        db: Session,
        current_user: User,
        data: OwnerProfileUpdate,
    ) -> OwnerProfile:
        profile = self.get_my_profile(db, current_user)

        if profile is None:
            raise HTTPException(
                status_code=404,
                detail="Owner profile not found",
            )

        update_data = data.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            setattr(profile, field, value)

        try:
            db.commit()
            db.refresh(profile)

        except Exception:
            db.rollback()
            raise

        return profile
