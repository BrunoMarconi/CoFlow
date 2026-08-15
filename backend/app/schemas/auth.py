from datetime import date
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.core.config import MINIMUM_REGISTRATION_AGE
from app.schemas.user import UserResponse


class RegisterRequest(BaseModel):
    first_name: str = Field(min_length=2, max_length=100)
    last_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: Literal["USER", "OWNER"] = "USER"
    birth_date: date
    # Debe ser True para poder registrarse (ver validador). No es
    # opcional: el checkbox de Términos y Condiciones es obligatorio.
    terms_accepted: bool
    marketing_consent: bool = False

    @field_validator("terms_accepted")
    @classmethod
    def validate_terms_accepted(cls, value: bool) -> bool:
        if not value:
            raise ValueError("Debes aceptar los Términos y Condiciones para crear una cuenta.")
        return value

    @field_validator("birth_date")
    @classmethod
    def validate_minimum_age(cls, value: date) -> date:
        today = date.today()
        age = today.year - value.year - ((today.month, today.day) < (value.month, value.day))
        if age < MINIMUM_REGISTRATION_AGE:
            raise ValueError(
                f"Debes tener al menos {MINIMUM_REGISTRATION_AGE} años para crear una cuenta en CoFlow."
            )
        if value > today:
            raise ValueError("La fecha de nacimiento no puede ser futura.")
        return value


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterResponse(BaseModel):
    message: str
    # Token de sesión de la cuenta recién creada — evita que el
    # frontend tenga que hacer un login por separado justo después de
    # registrarse (un round-trip HTTP + un verify_password de bcrypt
    # menos en el camino crítico de registro).
    access_token: str
    token_type: str = "bearer"
    # El usuario completo, igual que devolvería GET /auth/me — así el
    # frontend no necesita otra petición para saber el rol o el estado
    # de onboarding antes de decidir a dónde navegar.
    user: UserResponse
    # Solo presente si EMAIL_VERIFICATION_TEST_MODE está activo y
    # ENVIRONMENT != "production" — nunca en producción.
    debug_token: str | None = None


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    is_email_verified: bool
    # Refleja la feature flag EMAIL_VERIFICATION_ENABLED del backend, para
    # que el frontend nunca tenga que adivinar/duplicar ese estado.
    email_verification_enabled: bool
    # El usuario completo — evita que el frontend tenga que encadenar
    # un GET /auth/me justo después de iniciar sesión.
    user: UserResponse


class VerifyEmailRequest(BaseModel):
    token: str = Field(min_length=1)


class ResendVerificationRequest(BaseModel):
    email: EmailStr


class GenericMessageResponse(BaseModel):
    message: str
    debug_token: str | None = None
