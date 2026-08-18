import stripe
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.config import PROPERTY_SUBSCRIPTION_PRICE_CENTS, STRIPE_WEBHOOK_SECRET
from app.core.dependencies import get_current_user
from app.database.models.user import User
from app.database.session import get_db
from app.schemas.billing import PaymentMethodStatusResponse, SetupIntentResponse
from app.services import billing_service
from app.services.billing_email_service import (
    send_payment_failed_email,
    send_trial_ending_email,
)

router = APIRouter()


class ConfirmPaymentMethodRequest(BaseModel):
    payment_method_id: str


@router.post("/setup-intent", response_model=SetupIntentResponse)
def create_setup_intent(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    client_secret, publishable_key = billing_service.create_setup_intent(
        db=db,
        current_user=current_user,
    )

    return SetupIntentResponse(
        client_secret=client_secret,
        publishable_key=publishable_key,
    )


@router.post("/payment-method")
def confirm_payment_method(
    data: ConfirmPaymentMethodRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    billing_service.confirm_payment_method(
        db=db,
        current_user=current_user,
        payment_method_id=data.payment_method_id,
    )
    return {"ok": True}


@router.get("/payment-method", response_model=PaymentMethodStatusResponse)
def get_payment_method_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    has_pm, brand, last4 = billing_service.get_payment_method_summary(
        db=db,
        current_user=current_user,
    )
    return PaymentMethodStatusResponse(
        has_payment_method=has_pm,
        card_brand=brand,
        card_last4=last4,
    )


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    if not STRIPE_WEBHOOK_SECRET:
        raise HTTPException(
            status_code=500,
            detail="STRIPE_WEBHOOK_SECRET no está configurada",
        )

    payload = await request.body()
    signature = request.headers.get("stripe-signature", "")

    try:
        event = stripe.Webhook.construct_event(
            payload, signature, STRIPE_WEBHOOK_SECRET
        )
    except (ValueError, stripe.SignatureVerificationError):
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    event_type = event["type"]
    data_object = event["data"]["object"]

    subscription_events = {
        "customer.subscription.created",
        "customer.subscription.updated",
        "customer.subscription.deleted",
        "invoice.paid",
        "invoice.payment_failed",
    }

    if event_type in subscription_events:
        subscription_id = (
            data_object["id"]
            if event_type.startswith("customer.subscription")
            else data_object.get("subscription")
        )

        if subscription_id:
            if event_type == "invoice.payment_failed":
                status = "past_due"
            elif event_type.startswith("customer.subscription"):
                status = data_object["status"]
            else:
                status = "active"

            billing_service.sync_subscription_status(
                db=db,
                stripe_subscription_id=subscription_id,
                stripe_status=status,
            )

            found = billing_service.get_property_and_owner_by_subscription(
                db, subscription_id
            )

            if found:
                property_obj, owner = found

                if event_type == "customer.subscription.deleted":
                    billing_service.pause_property_from_deleted_subscription(
                        db, property_obj
                    )

                if event_type == "invoice.payment_failed":
                    background_tasks.add_task(
                        send_payment_failed_email,
                        to_email=owner.email,
                        first_name=owner.first_name,
                        property_id=property_obj.id,
                        property_title=property_obj.title,
                    )

    # Stripe dispara este evento un número fijo de días antes de que
    # termine el trial (3, por diseño de Stripe — no configurable a 7
    # sin un scheduler propio que este proyecto todavía no tiene).
    elif event_type == "customer.subscription.trial_will_end":
        found = billing_service.get_property_and_owner_by_subscription(
            db, data_object["id"]
        )
        if found:
            property_obj, owner = found
            trial_end = property_obj.trial_ends_at
            background_tasks.add_task(
                send_trial_ending_email,
                to_email=owner.email,
                first_name=owner.first_name,
                property_id=property_obj.id,
                property_title=property_obj.title,
                trial_end_date=(
                    billing_service.format_spanish_date(trial_end)
                    if trial_end else "próximamente"
                ),
                price_label=f"{PROPERTY_SUBSCRIPTION_PRICE_CENTS / 100:.2f} €/mes".replace(".", ","),
            )

    return {"received": True}
