from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.jwt import create_access_token
from app.core.security import hash_password, verify_password
from app.database.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest
from app.schemas.user import UpdateProfileRequest


class AuthService:

    def register(self, data: RegisterRequest, db: Session):

        normalized_email = data.email.strip().lower()

        existing_user = (
            db.query(User)
            .filter(func.lower(User.email) == normalized_email)
            .first()
        )

        if existing_user:
            raise HTTPException(
                status_code=409,
                detail="Email already registered"
            )

        user = User(
            first_name=data.first_name.strip(),
            last_name=data.last_name.strip(),
            email=normalized_email,
            password_hash=hash_password(data.password),
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        return {
            "message": "User created successfully"
        }

    def login(self, data: LoginRequest, db: Session):

        normalized_email = data.email.strip().lower()

        user = (
            db.query(User)
            .filter(func.lower(User.email) == normalized_email)
            .first()
        )

        if not user:
            raise HTTPException(
                status_code=401,
                detail="Invalid credentials"
            )

        if not verify_password(data.password, user.password_hash):
            raise HTTPException(
                status_code=401,
                detail="Invalid credentials"
            )

        token = create_access_token(str(user.id))

        return {
            "access_token": token,
            "token_type": "bearer"
        }

    def update_profile(
        self,
        current_user: User,
        data: UpdateProfileRequest,
        db: Session
    ):

        current_user.first_name = data.first_name.strip()
        current_user.last_name = data.last_name.strip()
        current_user.phone = data.phone
        current_user.rental_budget = data.rental_budget
        current_user.is_looking_for_roommates = (
            data.is_looking_for_roommates
        )

        db.commit()
        db.refresh(current_user)

        return {
            "message": "Profile updated successfully"
        }