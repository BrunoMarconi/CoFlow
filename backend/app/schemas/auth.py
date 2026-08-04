from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    first_name: str = Field(min_length=2, max_length=100)
    last_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterResponse(BaseModel):
    message: str
    # Solo presente si EMAIL_VERIFICATION_TEST_MODE está activo y
    # ENVIRONMENT != "production" — nunca en producción.
    debug_token: str | None = None


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    is_email_verified: bool


class VerifyEmailRequest(BaseModel):
    token: str = Field(min_length=1)


class ResendVerificationRequest(BaseModel):
    email: EmailStr


class GenericMessageResponse(BaseModel):
    message: str
    debug_token: str | None = None
