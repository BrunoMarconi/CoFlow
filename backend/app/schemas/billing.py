from pydantic import BaseModel


class SetupIntentResponse(BaseModel):
    client_secret: str
    publishable_key: str


class PaymentMethodStatusResponse(BaseModel):
    has_payment_method: bool
    card_brand: str | None = None
    card_last4: str | None = None
