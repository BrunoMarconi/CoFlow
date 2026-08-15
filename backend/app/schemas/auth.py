from typing import Literal

from pydantic import BaseModel, EmailStr, Field

from app.schemas.user import UserResponse


class RegisterRequest(BaseModel):
    first_name: str = Field(min_length=2, max_length=100)
    last_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: Literal["USER", "OWNER"] = "USER"


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
