import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.config import STRIPE_WEBHOOK_SECRET
from app.core.dependencies import get_current_user
from app.database.models.user import User
from app.database.session import get_db
from app.schemas.billing import PaymentMethodStatusResponse, SetupIntentResponse
from app.services import billing_service

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
    return PaymentMethodStatusResponse(
        has_payment_method=billing_service.has_payment_method(
            db=db,
            current_user=current_user,
        )
    )


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
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

    subscription_events = {
        "customer.subscription.created",
        "customer.subscription.updated",
        "customer.subscription.deleted",
        "invoice.paid",
        "invoice.payment_failed",
    }

    if event["type"] in subscription_events:
        data_object = event["data"]["object"]
        subscription_id = (
            data_object["id"]
            if event["type"].startswith("customer.subscription")
            else data_object.get("subscription")
        )

        if subscription_id:
            if event["type"] == "invoice.payment_failed":
                status = "past_due"
            elif event["type"].startswith("customer.subscription"):
                status = data_object["status"]
            else:
                status = "active"

            billing_service.sync_subscription_status(
                db=db,
                stripe_subscription_id=subscription_id,
                stripe_status=status,
            )

    return {"received": True}
