import hashlib
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import CURRENT_PRIVACY_VERSION, CURRENT_TERMS_VERSION, MINIMUM_REGISTRATION_AGE
from app.core.dependencies import require_admin
from app.core.security import hash_password
from app.database.models.owner_claim_token import OwnerClaimToken
from app.database.models.owner_profile import OwnerProfile, OwnerType
from app.database.models.property import Property, PropertyStatus, PropertyType
from app.database.models.user import User
from app.database.session import get_db
from app.schemas.assisted_listing import AssistedListingCreate, AssistedListingResponse, OwnerClaimPreview, OwnerClaimRequest
from app.schemas.property import PropertyResponse
from app.services.property_image_service import PropertyImageService
from app.services.property_service import PropertyService

router = APIRouter()
property_service = PropertyService()
property_image_service = PropertyImageService()


def _hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def _active_claim(db: Session, raw_token: str) -> OwnerClaimToken:
    claim = db.query(OwnerClaimToken).filter(OwnerClaimToken.token_hash == _hash_token(raw_token)).first()
    now = datetime.now(timezone.utc)
    if claim is None or claim.claimed_at is not None or claim.expires_at <= now:
        raise HTTPException(status_code=404, detail="Este enlace no existe o ya ha caducado.")
    return claim


@router.post("", response_model=AssistedListingResponse)
def create_assisted_listing(data: AssistedListingCreate, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    # Alta asistida: nada es obligatorio en el formulario, el admin
    # rellena lo que le ha dado tiempo a anotar en la llamada. Lo que la
    # base de datos exige de verdad (email único, nombre, ciudad,
    # tipo...) se completa aquí con valores por defecto; el resto se
    # termina de rellenar antes de publicar (ver mark_ready_admin).
    raw_email = (data.owner.email or "").strip().lower()

    if raw_email:
        if db.query(User).filter(func.lower(User.email) == raw_email).first():
            raise HTTPException(status_code=409, detail="Ya existe una cuenta con este correo. El propietario debe entrar en su cuenta.")
        email = raw_email
    else:
        email = f"sin-email-{uuid.uuid4().hex}@coflow.pending"

    city = (data.property.city or "Málaga").strip()
    if city.casefold() not in {"málaga", "malaga"}:
        raise HTTPException(status_code=422, detail="El lanzamiento asistido está limitado a Málaga.")

    try:
        owner = User(
            first_name=(data.owner.first_name or "Propietario").strip(),
            last_name=(data.owner.last_name or "").strip(),
            email=email,
            phone=(data.owner.phone or "").strip() or None,
            password_hash=None,
            role="OWNER",
            is_email_verified=False,
            onboarding_completed=False,
            is_looking_for_roommates=False,
        )
        db.add(owner)
        db.flush()
        profile = OwnerProfile(user_id=owner.id, owner_type=OwnerType.INDIVIDUAL, display_name=f"{owner.first_name} {owner.last_name}".strip(), phone=owner.phone, contact_email=raw_email or None)
        db.add(profile)
        db.flush()
        prop_data = data.property
        property_obj = Property(
            owner_profile_id=profile.id,
            title=(prop_data.title or "").strip(),
            description=(prop_data.description or "").strip(),
            property_type=prop_data.property_type or PropertyType.OTHER,
            status=PropertyStatus.DRAFT,
            address_line=(prop_data.address_line or "").strip(),
            city=city,
            province=(prop_data.province or "Málaga").strip(),
            postal_code=(prop_data.postal_code or "").strip(),
            neighborhood=prop_data.neighborhood.strip() if prop_data.neighborhood else None,
            latitude=prop_data.latitude,
            longitude=prop_data.longitude,
            surface_m2=prop_data.surface_m2,
            bedrooms=prop_data.bedrooms if prop_data.bedrooms is not None else 0,
            bathrooms=prop_data.bathrooms if prop_data.bathrooms is not None else 1,
            floor=prop_data.floor,
            has_elevator=prop_data.has_elevator,
            furnished=prop_data.furnished,
            max_tenants=prop_data.max_tenants if prop_data.max_tenants is not None else 1,
            total_monthly_rent=prop_data.total_monthly_rent,
            deposit=prop_data.deposit,
            utilities_included=prop_data.utilities_included,
            available_from=prop_data.available_from,
            minimum_stay_months=prop_data.minimum_stay_months,
            pets_allowed=prop_data.pets_allowed,
            smoking_allowed=prop_data.smoking_allowed,
            couples_allowed=prop_data.couples_allowed,
            students_allowed=prop_data.students_allowed,
            registration_allowed=prop_data.registration_allowed,
            additional_requirements=prop_data.additional_requirements,
        )
        db.add(property_obj)
        db.flush()
        property_service._set_amenities(db, property_obj, prop_data.amenity_ids)
        db.commit()
    except Exception:
        db.rollback()
        raise

    return AssistedListingResponse(property_id=property_obj.id, owner_email=raw_email or "(sin email)")


@router.post("/{property_id}/images", response_model=PropertyResponse)
async def upload_assisted_listing_images(property_id: int, files: list[UploadFile] = File(...), admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return await property_image_service.upload_images_admin(db=db, property_id=property_id, files=files)


@router.post("/{property_id}/ready", response_model=PropertyResponse)
def mark_assisted_listing_ready(property_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return property_service.mark_ready_admin(db=db, property_id=property_id)


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
