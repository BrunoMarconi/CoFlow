import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import CURRENT_PRIVACY_VERSION, CURRENT_TERMS_VERSION, FRONTEND_URL, MINIMUM_REGISTRATION_AGE
from app.core.dependencies import require_admin
from app.core.security import hash_password
from app.database.models.owner_claim_token import OwnerClaimToken
from app.database.models.owner_profile import OwnerProfile, OwnerType
from app.database.models.property import Property, PropertyStatus
from app.database.models.user import User
from app.database.session import get_db
from app.schemas.assisted_listing import AssistedListingCreate, AssistedListingResponse, OwnerClaimPreview, OwnerClaimRequest
from app.services.assisted_listing_email_service import send_owner_claim_email
from app.services.property_service import PropertyService

router = APIRouter()
property_service = PropertyService()


def _hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def _active_claim(db: Session, raw_token: str) -> OwnerClaimToken:
    claim = db.query(OwnerClaimToken).filter(OwnerClaimToken.token_hash == _hash_token(raw_token)).first()
    now = datetime.now(timezone.utc)
    if claim is None or claim.claimed_at is not None or claim.expires_at <= now:
        raise HTTPException(status_code=404, detail="Este enlace no existe o ya ha caducado.")
    return claim


@router.post("", response_model=AssistedListingResponse)
def create_assisted_listing(data: AssistedListingCreate, background_tasks: BackgroundTasks, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    email = data.owner.email.lower().strip()
    if db.query(User).filter(func.lower(User.email) == email).first():
        raise HTTPException(status_code=409, detail="Ya existe una cuenta con este correo. El propietario debe entrar en su cuenta.")

    if data.property.city.strip().casefold() not in {"málaga", "malaga"}:
        raise HTTPException(status_code=422, detail="El lanzamiento asistido está limitado a Málaga.")

    raw_token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    try:
        owner = User(first_name=data.owner.first_name.strip(), last_name=data.owner.last_name.strip(), email=email, phone=data.owner.phone.strip(), password_hash=None, role="OWNER", is_email_verified=False, onboarding_completed=False, is_looking_for_roommates=False)
        db.add(owner)
        db.flush()
        profile = OwnerProfile(user_id=owner.id, owner_type=OwnerType.INDIVIDUAL, display_name=f"{owner.first_name} {owner.last_name}", phone=owner.phone, contact_email=email)
        db.add(profile)
        db.flush()
        prop_data = data.property
        property_obj = Property(owner_profile_id=profile.id, title=prop_data.title.strip(), description=prop_data.description.strip(), property_type=prop_data.property_type, status=PropertyStatus.DRAFT, address_line=prop_data.address_line.strip(), city=prop_data.city.strip(), province=prop_data.province.strip(), postal_code=prop_data.postal_code.strip(), neighborhood=prop_data.neighborhood.strip() if prop_data.neighborhood else None, latitude=prop_data.latitude, longitude=prop_data.longitude, surface_m2=prop_data.surface_m2, bedrooms=prop_data.bedrooms, bathrooms=prop_data.bathrooms, floor=prop_data.floor, has_elevator=prop_data.has_elevator, furnished=prop_data.furnished, max_tenants=prop_data.max_tenants, total_monthly_rent=prop_data.total_monthly_rent, deposit=prop_data.deposit, utilities_included=prop_data.utilities_included, available_from=prop_data.available_from, minimum_stay_months=prop_data.minimum_stay_months, pets_allowed=prop_data.pets_allowed, smoking_allowed=prop_data.smoking_allowed, couples_allowed=prop_data.couples_allowed, students_allowed=prop_data.students_allowed, registration_allowed=prop_data.registration_allowed, additional_requirements=prop_data.additional_requirements)
        db.add(property_obj)
        db.flush()
        property_service._set_amenities(db, property_obj, prop_data.amenity_ids)
        db.add(OwnerClaimToken(user_id=owner.id, property_id=property_obj.id, created_by_id=admin.id, token_hash=_hash_token(raw_token), expires_at=expires_at, owner_consent_recorded_at=datetime.now(timezone.utc)))
        db.commit()
    except Exception:
        db.rollback()
        raise

    claim_url = f"{FRONTEND_URL or 'http://localhost:3000'}/activar-propietario/{raw_token}"
    background_tasks.add_task(send_owner_claim_email, to_email=email, first_name=owner.first_name, claim_url=claim_url, property_title=property_obj.title)
    return AssistedListingResponse(property_id=property_obj.id, owner_email=email, claim_url=claim_url, expires_at=expires_at)


@router.get("/claim/{token}", response_model=OwnerClaimPreview)
def preview_claim(token: str, db: Session = Depends(get_db)):
    claim = _active_claim(db, token)
    user = db.query(User).filter(User.id == claim.user_id).one()
    prop = db.query(Property).filter(Property.id == claim.property_id).one()
    return OwnerClaimPreview(first_name=user.first_name, property_title=prop.title, property_city=prop.city, expires_at=claim.expires_at)


@router.post("/claim/{token}")
def claim_owner_account(token: str, data: OwnerClaimRequest, db: Session = Depends(get_db)):
    claim = _active_claim(db, token)
    user = db.query(User).filter(User.id == claim.user_id).one()
    now = datetime.now(timezone.utc)
    today = now.date()
    age = today.year - data.birth_date.year - ((today.month, today.day) < (data.birth_date.month, data.birth_date.day))
    if age < MINIMUM_REGISTRATION_AGE:
        raise HTTPException(status_code=422, detail=f"Debes tener al menos {MINIMUM_REGISTRATION_AGE} años.")
    user.password_hash = hash_password(data.password)
    user.birth_date = data.birth_date
    user.is_email_verified = True
    user.email_verified_at = now
    user.terms_version = CURRENT_TERMS_VERSION
    user.terms_accepted_at = now
    user.privacy_version = CURRENT_PRIVACY_VERSION
    claim.claimed_at = now
    db.commit()
    return {"message": "Cuenta activada. Ya puedes iniciar sesión y revisar tu anuncio."}
