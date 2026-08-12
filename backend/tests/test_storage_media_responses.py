from datetime import datetime, timezone
from types import SimpleNamespace
from uuid import uuid4

from app.schemas.user import UserResponse
from app.schemas.user_photo import UserPhotoResponse
from app.services import storage_service


def test_user_response_rebuilds_avatar_url_from_storage_key(monkeypatch):
    monkeypatch.setattr(
        storage_service,
        "generate_public_url",
        lambda key: f"https://media.example.com/{key}",
    )

    user = SimpleNamespace(
        id=uuid4(),
        first_name="Bruno",
        last_name="Marconi",
        email="bruno@example.com",
        phone=None,
        role="USER",
        onboarding_completed=True,
        rental_budget=None,
        is_looking_for_roommates=True,
        is_email_verified=True,
        avatar_storage_key="avatars/stable.webp",
        avatar_url="https://old-host.example/avatar.webp",
        photos=[],
        age=None,
        occupation=None,
        bio=None,
    )

    response = UserResponse.model_validate(user)

    assert response.avatar_url == (
        "https://media.example.com/avatars/stable.webp"
    )
    assert "avatar_storage_key" not in response.model_dump()
    assert (
        "avatar_storage_key"
        not in UserResponse.model_json_schema().get("properties", {})
    )


def test_photo_response_rebuilds_image_url_from_storage_key(monkeypatch):
    monkeypatch.setattr(
        storage_service,
        "generate_public_url",
        lambda key: f"https://media.example.com/{key}",
    )

    photo = SimpleNamespace(
        id=1,
        user_id=uuid4(),
        storage_key="user_photos/stable.webp",
        image_url="https://old-host.example/photo.webp",
        position=0,
        created_at=datetime.now(timezone.utc),
    )

    response = UserPhotoResponse.model_validate(photo)

    assert response.image_url == (
        "https://media.example.com/user_photos/stable.webp"
    )
    assert "storage_key" not in response.model_dump()
    assert (
        "storage_key"
        not in UserPhotoResponse.model_json_schema().get("properties", {})
    )
