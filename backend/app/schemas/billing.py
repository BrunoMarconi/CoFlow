from pydantic import BaseModel, field_validator


class SetupIntentResponse(BaseModel):
    client_secret: str
    publishable_key: str


class PaymentMethodStatusResponse(BaseModel):
    has_payment_method: bool
    card_brand: str | None = None
    card_last4: str | None = None


class PropertySubscribeRequest(BaseModel):
    # Debe ser True para poder publicar un piso con cobro — el checkbox
    # de condiciones para propietarios es obligatorio, igual que el de
    # Términos y Condiciones al registrarse (ver RegisterRequest).
    terms_accepted: bool

    @field_validator("terms_accepted")
    @classmethod
    def validate_terms_accepted(cls, value: bool) -> bool:
        if not value:
            raise ValueError(
                "Debes aceptar las condiciones de cobro para publicar este piso."
            )
        return value
