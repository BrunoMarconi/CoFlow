from datetime import datetime, timezone

import stripe
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.config import (
    CURRENT_OWNER_TERMS_VERSION,
    CURRENT_TERMS_VERSION,
    PROPERTY_SUBSCRIPTION_PRICE_CENTS,
    PROPERTY_SUBSCRIPTION_TRIAL_DAYS,
    STRIPE_PUBLISHABLE_KEY,
    STRIPE_SECRET_KEY,
)
from app.database.models.owner_profile import OwnerProfile
from app.database.models.property import (
    Property,
    PropertyStatus,
    PropertySubscriptionStatus,
)
from app.database.models.property_billing_consent import PropertyBillingConsent
from app.database.models.user import User

# Mapea el status de una Subscription de Stripe a nuestro enum interno.
# Stripe usa "trialing"/"active"/"past_due"/"canceled"/"unpaid"/
# "incomplete"/"incomplete_expired" (ver
# https://docs.stripe.com/api/subscriptions/object#subscription_object-status).
_STRIPE_STATUS_MAP = {
    "trialing": PropertySubscriptionStatus.TRIALING,
    "active": PropertySubscriptionStatus.ACTIVE,
    "past_due": PropertySubscriptionStatus.PAST_DUE,
    "unpaid": PropertySubscriptionStatus.PAST_DUE,
    "canceled": PropertySubscriptionStatus.CANCELED,
    "incomplete_expired": PropertySubscriptionStatus.CANCELED,
}


def _require_configured() -> None:
    if not STRIPE_SECRET_KEY:
        raise RuntimeError(
            "STRIPE_SECRET_KEY no está configurada: define las claves de "
            "Stripe (modo prueba) en backend/.env antes de usar /billing."
        )
    stripe.api_key = STRIPE_SECRET_KEY


def _get_owner_profile(db: Session, current_user: User) -> OwnerProfile:
    profile = (
        db.query(OwnerProfile)
        .filter(OwnerProfile.user_id == current_user.id)
        .first()
    )

    if profile is None:
        raise HTTPException(
            status_code=403,
            detail="You need an owner profile to manage billing",
        )

    return profile


def _get_or_create_customer(
    db: Session,
    owner_profile: OwnerProfile,
    current_user: User,
) -> str:
    if owner_profile.stripe_customer_id:
        return owner_profile.stripe_customer_id

    customer = stripe.Customer.create(
        email=current_user.email,
        name=owner_profile.display_name,
        metadata={
            "owner_profile_id": str(owner_profile.id),
            "user_id": str(current_user.id),
        },
    )

    owner_profile.stripe_customer_id = customer.id
    db.commit()

    return customer.id


def create_setup_intent(db: Session, current_user: User) -> tuple[str, str]:
    """Crea un SetupIntent para guardar una tarjeta sin cobrar nada."""
    _require_configured()

    profile = _get_owner_profile(db, current_user)
    customer_id = _get_or_create_customer(db, profile, current_user)

    # Restringido a "card" a propósito: Apple Pay y Google Pay NO son
    # tipos de payment_method aparte, viajan como "card" por debajo, así
    # que el Payment Element los sigue ofreciendo como botones express
    # cuando el navegador/dominio los soporta. automatic_payment_methods
    # (probado antes) también activa métodos sueltos configurados en el
    # Dashboard de Stripe (Klarna, Bancontact, Kakao Pay...) que no
    # sirven para una suscripción recurrente y solo confunden aquí.
    setup_intent = stripe.SetupIntent.create(
        customer=customer_id,
        payment_method_types=["card"],
    )

    return setup_intent.client_secret, STRIPE_PUBLISHABLE_KEY


def confirm_payment_method(
    db: Session,
    current_user: User,
    payment_method_id: str,
) -> None:
    """Fija la tarjeta recién guardada como método de pago por defecto
    del propietario (se reutiliza para todos sus pisos)."""
    _require_configured()

    profile = _get_owner_profile(db, current_user)

    if not profile.stripe_customer_id:
        raise HTTPException(
            status_code=409,
            detail="No hay ningún cliente de Stripe asociado todavía",
        )

    stripe.PaymentMethod.attach(
        payment_method_id,
        customer=profile.stripe_customer_id,
    )
    stripe.Customer.modify(
        profile.stripe_customer_id,
        invoice_settings={"default_payment_method": payment_method_id},
    )


def get_payment_method_summary(
    db: Session, current_user: User
) -> tuple[bool, str | None, str | None]:
    """Devuelve (tiene_tarjeta, marca, últimos_4) de la tarjeta por
    defecto del propietario, si tiene alguna guardada."""
    _require_configured()

    profile = _get_owner_profile(db, current_user)

    if not profile.stripe_customer_id:
        return False, None, None

    customer = stripe.Customer.retrieve(
        profile.stripe_customer_id,
        expand=["invoice_settings.default_payment_method"],
    )
    payment_method = customer.invoice_settings.default_payment_method

    if not payment_method:
        return False, None, None

    card = payment_method.get("card") if payment_method else None
    return True, card.get("brand") if card else None, card.get("last4") if card else None


_PROPERTY_PRICE_LOOKUP_KEY = "property_subscription_monthly"


def _get_or_create_property_price() -> str:
    """Devuelve el id del Price de Stripe para la cuota mensual por
    piso (23,99€/mes), creándolo una única vez. Subscription.create no
    admite crear el Product al vuelo (a diferencia de Price.create o
    Checkout Session), así que hace falta un Price ya existente."""
    existing = stripe.Price.list(
        lookup_keys=[_PROPERTY_PRICE_LOOKUP_KEY],
        active=True,
        limit=1,
    )
    if existing.data:
        return existing.data[0].id

    price = stripe.Price.create(
        currency="eur",
        unit_amount=PROPERTY_SUBSCRIPTION_PRICE_CENTS,
        recurring={"interval": "month"},
        product_data={"name": "Publicación de piso en CoFlow"},
        lookup_key=_PROPERTY_PRICE_LOOKUP_KEY,
    )
    return price.id


def start_property_subscription(
    db: Session,
    current_user: User,
    property_obj: Property,
    *,
    ip_hash: str | None = None,
    user_agent: str | None = None,
) -> Property:
    """Crea la Subscription de Stripe de un piso: 23,99€/mes con 30 días
    de prueba gratuita desde hoy (el momento en que el piso pasa a
    READY). Requiere que el propietario ya tenga una tarjeta guardada.
    Deja constancia legal del consentimiento (precio, periodicidad,
    renovación automática) en PropertyBillingConsent — el caller ya
    validó que terms_accepted es True antes de llegar aquí."""
    _require_configured()

    if property_obj.stripe_subscription_id:
        return property_obj

    profile = _get_owner_profile(db, current_user)

    if not profile.stripe_customer_id:
        raise HTTPException(
            status_code=409,
            detail="Añade una tarjeta antes de publicar un piso",
        )

    customer = stripe.Customer.retrieve(profile.stripe_customer_id)
    if not customer.invoice_settings.default_payment_method:
        raise HTTPException(
            status_code=409,
            detail="Añade una tarjeta antes de publicar un piso",
        )

    price_id = _get_or_create_property_price()

    subscription = stripe.Subscription.create(
        customer=profile.stripe_customer_id,
        items=[{"price": price_id}],
        trial_period_days=PROPERTY_SUBSCRIPTION_TRIAL_DAYS,
        metadata={
            "property_id": str(property_obj.id),
            "owner_id": str(current_user.id),
            "owner_profile_id": str(profile.id),
            "coflow_plan": "property_listing",
        },
    )

    property_obj.stripe_subscription_id = subscription.id
    property_obj.subscription_status = _STRIPE_STATUS_MAP.get(
        subscription.status, PropertySubscriptionStatus.TRIALING
    )
    property_obj.trial_ends_at = (
        datetime.fromtimestamp(subscription.trial_end, tz=timezone.utc)
        if subscription.trial_end
        else None
    )

    db.add(
        PropertyBillingConsent(
            owner_id=current_user.id,
            property_id=property_obj.id,
            terms_version=CURRENT_TERMS_VERSION,
            owner_terms_version=CURRENT_OWNER_TERMS_VERSION,
            price_accepted=PROPERTY_SUBSCRIPTION_PRICE_CENTS / 100,
            currency="EUR",
            billing_interval="month",
            trial_days=PROPERTY_SUBSCRIPTION_TRIAL_DAYS,
            automatic_renewal_accepted=True,
            accepted_at=datetime.now(timezone.utc),
            ip_address_hash=ip_hash,
            user_agent=user_agent[:500] if user_agent else None,
        )
    )
    db.commit()

    return property_obj


def cancel_property_subscription(
    db: Session,
    property_obj: Property,
    *,
    at_period_end: bool = True,
) -> None:
    """Cancela la suscripción de un piso. Por defecto, al final del
    periodo ya pagado (no se cobra de nuevo, pero no hay reembolso del
    periodo en curso) — usado al pausar/archivar un piso. Con
    at_period_end=False cancela de inmediato — usado al eliminar la
    cuenta del propietario, donde no tiene sentido seguir cobrando."""
    if not property_obj.stripe_subscription_id:
        return

    _require_configured()

    try:
        if at_period_end:
            stripe.Subscription.modify(
                property_obj.stripe_subscription_id,
                cancel_at_period_end=True,
            )
        else:
            stripe.Subscription.cancel(property_obj.stripe_subscription_id)
    except stripe.InvalidRequestError:
        # Ya no existe en Stripe (borrada manualmente, etc.) — no bloquea
        # la acción del propietario en nuestro lado.
        pass


def sync_subscription_status(
    db: Session,
    stripe_subscription_id: str,
    stripe_status: str,
) -> None:
    """Actualiza subscription_status desde un evento de webhook."""
    property_obj = (
        db.query(Property)
        .filter(Property.stripe_subscription_id == stripe_subscription_id)
        .first()
    )

    if property_obj is None:
        return

    property_obj.subscription_status = _STRIPE_STATUS_MAP.get(
        stripe_status, property_obj.subscription_status
    )
    db.commit()


def get_property_and_owner_by_subscription(
    db: Session, stripe_subscription_id: str
) -> tuple[Property, User] | None:
    property_obj = (
        db.query(Property)
        .filter(Property.stripe_subscription_id == stripe_subscription_id)
        .first()
    )
    if property_obj is None:
        return None

    owner = (
        db.query(User)
        .join(OwnerProfile, OwnerProfile.user_id == User.id)
        .filter(OwnerProfile.id == property_obj.owner_profile_id)
        .first()
    )
    if owner is None:
        return None

    return property_obj, owner


def pause_property_from_deleted_subscription(
    db: Session, property_obj: Property
) -> None:
    """Cuando Stripe cierra de verdad una suscripción cancelada
    (customer.subscription.deleted — ya no es "cancel_at_period_end",
    el periodo ya se agotó), el piso deja de estar cubierto: se pausa
    en vez de quedar publicado sin facturación detrás. No se toca si ya
    está alquilado o archivado."""
    if property_obj.status in (PropertyStatus.READY, PropertyStatus.PUBLISHED):
        property_obj.status = PropertyStatus.PAUSED
        db.commit()


_SPANISH_MONTHS = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
]


def format_spanish_date(value: datetime) -> str:
    return f"{value.day} de {_SPANISH_MONTHS[value.month - 1]} de {value.year}"
