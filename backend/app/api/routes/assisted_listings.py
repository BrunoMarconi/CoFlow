import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from app.core.config import CURRENT_PRIVACY_VERSION, CURRENT_TERMS_VERSION, FRONTEND_URL, MINIMUM_REGISTRATION_AGE
from app.core.dependencies import require_team_member
from app.core.security import hash_password
from app.database.models.owner_claim_token import OwnerClaimToken
from app.database.models.owner_profile import OwnerProfile, OwnerType
from app.database.models.property import Property, PropertyStatus, PropertyType
from app.database.models.user import User
from app.database.session import get_db
from app.schemas.assisted_listing import AssistedListingCreate, AssistedListingResponse, AssistedOwnerCreate, OwnerClaimPreview, OwnerClaimRequest
from app.schemas.property import PropertyResponse
from app.services.property_image_service import PropertyImageService
from app.services.property_service import PropertyService
from app.services.assisted_listing_email_service import send_owner_claim_email

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


def _existing_owner_profile(db: Session, owner_profile_id: int) -> OwnerProfile:
    profile = db.query(OwnerProfile).options(selectinload(OwnerProfile.user)).filter(OwnerProfile.id == owner_profile_id).first()
    if profile is None:
        raise HTTPException(status_code=404, detail="No hemos encontrado ese cliente.")
    return profile


def _create_owner(db: Session, data: AssistedOwnerCreate, email: str) -> OwnerProfile:
    owner = User(
        first_name=(data.first_name or "Propietario").strip(),
        last_name=(data.last_name or "").strip(),
        email=email,
        phone=(data.phone or "").strip() or None,
        password_hash=None,
        role="OWNER",
        is_email_verified=False,
        onboarding_completed=False,
        is_looking_for_roommates=False,
    )
    db.add(owner)
    db.flush()
    company_name = (data.company_name or "").strip() or None
    person_name = f"{owner.first_name} {owner.last_name}".strip()
    profile = OwnerProfile(
        user_id=owner.id,
        owner_type=data.owner_type,
        display_name=(company_name if data.owner_type != OwnerType.INDIVIDUAL and company_name else person_name)[:120],
        company_name=company_name if data.owner_type != OwnerType.INDIVIDUAL else None,
        phone=owner.phone or "",
        contact_email=email,
    )
    db.add(profile)
    db.flush()
    return profile


# El alta asistida cubre toda la provincia de Málaga, no solo la capital.
# Manda el código postal: sus dos primeros dígitos son el código INE de
# provincia (29 = Málaga). Es más fiable que el nombre de provincia, que
# el geocodificador a veces devuelve como la comunidad ("Andalucía").
MALAGA_POSTAL_PREFIX = "29"


def _in_malaga_province(province: str | None, postal_code: str | None) -> bool:
    postal = (postal_code or "").strip()
    if postal:
        return postal.startswith(MALAGA_POSTAL_PREFIX)
    name = (province or "").strip().casefold()
    if name:
        return name in {"málaga", "malaga"}
    # Sin ubicación todavía: aquí nada es obligatorio y la dirección se
    # completa antes de publicar.
    return True


@router.post("", response_model=AssistedListingResponse)
def create_assisted_listing(data: AssistedListingCreate, background_tasks: BackgroundTasks, admin: User = Depends(require_team_member), db: Session = Depends(get_db)):
    # Alta asistida: nada es obligatorio en el formulario, el equipo
    # rellena lo que le ha dado tiempo a anotar. Lo que la base de datos
    # exige de verdad (email único, nombre, ciudad, tipo...) se completa
    # aquí con valores por defecto; el resto se termina de rellenar antes
    # de publicar (ver mark_ready_admin).
    city = (data.property.city or "Málaga").strip()
    if not _in_malaga_province(data.property.province, data.property.postal_code):
        raise HTTPException(status_code=422, detail="El alta asistida solo admite viviendas de la provincia de Málaga.")

    raw_email = ""
    if data.owner_profile_id is None:
        raw_email = (data.owner.email or "").strip().lower()
        if raw_email:
            existing = db.query(User).filter(func.lower(User.email) == raw_email).first()
            if existing is not None:
                existing_profile = db.query(OwnerProfile).filter(OwnerProfile.user_id == existing.id).first()
                if existing_profile is not None:
                    # El caso típico: segundo piso de un cliente que ya
                    # dimos de alta. El frontend ofrece añadirlo a su cuenta.
                    raise HTTPException(
                        status_code=409,
                        detail={
                            "code": "OWNER_EXISTS",
                            "message": "Este correo ya es de un cliente de CoFlow. Añade la vivienda a su cuenta.",
                            "owner_profile_id": existing_profile.id,
                            "display_name": existing_profile.display_name,
                        },
                    )
                raise HTTPException(status_code=409, detail="Ya existe una cuenta con este correo. El propietario debe entrar en su cuenta.")

    try:
        if data.owner_profile_id is not None:
            profile = _existing_owner_profile(db, data.owner_profile_id)
        else:
            profile = _create_owner(db, data.owner, raw_email or f"sin-email-{uuid.uuid4().hex}@coflow.pending")
        owner = profile.user if data.owner_profile_id is not None else db.query(User).filter(User.id == profile.user_id).one()

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

        # Solo un cliente nuevo necesita enlace para activar su cuenta; a
        # uno existente se le añade la vivienda sin mandarle nada.
        raw_token = None
        if data.owner_profile_id is None:
            raw_token = secrets.token_urlsafe(32)
            db.add(
                OwnerClaimToken(
                    user_id=owner.id,
                    property_id=property_obj.id,
                    created_by_id=admin.id,
                    token_hash=_hash_token(raw_token),
                    expires_at=datetime.now(timezone.utc) + timedelta(days=7),
                )
            )
        db.commit()
    except Exception:
        db.rollback()
        raise

    claim_url = None
    if raw_token:
        frontend_url = FRONTEND_URL.rstrip("/") or "http://localhost:3000"
        claim_url = f"{frontend_url}/activar-propietario/{raw_token}"
        if raw_email:
            background_tasks.add_task(
                send_owner_claim_email,
                to_email=raw_email,
                first_name=owner.first_name,
                claim_url=claim_url,
                property_title=property_obj.title,
            )
    return AssistedListingResponse(
        property_id=property_obj.id,
        owner_profile_id=profile.id,
        owner_display_name=profile.display_name,
        owner_email=raw_email or ("(sin email)" if owner.email.endswith("@coflow.pending") else owner.email),
        is_new_owner=data.owner_profile_id is None,
        claim_url=claim_url,
    )


@router.post("/{property_id}/images", response_model=PropertyResponse)
async def upload_assisted_listing_images(property_id: int, files: list[UploadFile] = File(...), admin: User = Depends(require_team_member), db: Session = Depends(get_db)):
    return await property_image_service.upload_images_admin(db=db, property_id=property_id, files=files)


@router.post("/{property_id}/ready", response_model=PropertyResponse)
def mark_assisted_listing_ready(property_id: int, admin: User = Depends(require_team_member), db: Session = Depends(get_db)):
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
