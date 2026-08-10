"""Tests de la portada de comunidad: color por defecto, cambiarlo,
subir/borrar una imagen personalizada, y que solo el propietario
pueda gestionarla."""

import io

import pytest
from fastapi import HTTPException, UploadFile
from PIL import Image

from app.database.models.user import User
from app.schemas.community import (
    CommunityCreate,
    CommunityPreferencesCreate,
    CommunityUpdate,
)
from app.services.community_service import CommunityService

service = CommunityService()

_PREFERENCES = CommunityPreferencesCreate(
    cleanliness="Limpieza básica semanal",
    atmosphere="Tranquilo, con algunos momentos sociales",
    visits="Preferimos que se avise antes",
    sleepovers="Permitido con previo aviso",
    smoking="No aceptamos fumadores",
    pets="Depende del animal",
    rules="Normas claras pero flexibles",
    lifestyle="Tener una relación cordial",
)


def _make_community_payload(**overrides) -> CommunityCreate:
    base = dict(
        name="Casa Málaga",
        description="Una comunidad tranquila cerca del centro de Málaga.",
        city="Málaga",
        province=None,
        neighborhood=None,
        max_members=4,
        preferences=_PREFERENCES,
        profile_type="MIXED",
        profile_description=None,
        join_type="REQUEST",
        open_spots=1,
        urgency="NORMAL",
        monthly_rent=400,
        deposit=None,
        move_in_date=None,
        room_description=None,
    )
    base.update(overrides)
    return CommunityCreate(**base)


def _valid_png_bytes(color=(90, 130, 90)) -> bytes:
    buffer = io.BytesIO()
    Image.new("RGB", (6, 6), color=color).save(buffer, format="PNG")
    return buffer.getvalue()


def _make_upload_file() -> UploadFile:
    return UploadFile(filename="cover.png", file=io.BytesIO(_valid_png_bytes()))


def _make_owner(db_session, make_user) -> User:
    return make_user("cover-owner")


def test_create_community_defaults_to_sage_cover(db_session, make_user):
    owner = _make_owner(db_session, make_user)

    community = service.create_community(
        db=db_session, current_user=owner, data=_make_community_payload()
    )

    assert community.cover_color == "sage"
    assert community.cover_image_url is None


def test_create_community_accepts_custom_cover_color(db_session, make_user):
    owner = _make_owner(db_session, make_user)

    community = service.create_community(
        db=db_session,
        current_user=owner,
        data=_make_community_payload(cover_color="forest"),
    )

    assert community.cover_color == "forest"


def test_create_community_rejects_invalid_cover_color():
    with pytest.raises(Exception):
        _make_community_payload(cover_color="neon-pink")


def test_update_community_changes_cover_color(db_session, make_user):
    owner = _make_owner(db_session, make_user)
    community = service.create_community(
        db=db_session, current_user=owner, data=_make_community_payload()
    )

    updated = service.update_community(
        db=db_session,
        current_user=owner,
        community_id=community.id,
        data=CommunityUpdate(cover_color="smoke"),
    )

    assert updated.cover_color == "smoke"


def test_upload_cover_image_sets_url_and_replaces_previous(db_session, make_user):
    import asyncio

    owner = _make_owner(db_session, make_user)
    community = service.create_community(
        db=db_session, current_user=owner, data=_make_community_payload()
    )

    updated = asyncio.run(
        service.upload_cover_image(
            db=db_session,
            current_user=owner,
            community_id=community.id,
            file=_make_upload_file(),
        )
    )

    assert updated.cover_image_url is not None
    first_key = updated.cover_storage_key

    updated_again = asyncio.run(
        service.upload_cover_image(
            db=db_session,
            current_user=owner,
            community_id=community.id,
            file=_make_upload_file(),
        )
    )

    assert updated_again.cover_storage_key is not None
    assert updated_again.cover_storage_key != first_key


def test_upload_cover_image_rejects_non_owner(db_session, make_user):
    import asyncio

    owner = _make_owner(db_session, make_user)
    other = make_user("cover-not-owner")

    community = service.create_community(
        db=db_session, current_user=owner, data=_make_community_payload()
    )

    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(
            service.upload_cover_image(
                db=db_session,
                current_user=other,
                community_id=community.id,
                file=_make_upload_file(),
            )
        )

    assert exc_info.value.status_code == 403


def test_upload_cover_image_rejects_invalid_file(db_session, make_user):
    import asyncio

    owner = _make_owner(db_session, make_user)
    community = service.create_community(
        db=db_session, current_user=owner, data=_make_community_payload()
    )

    bad_file = UploadFile(filename="bad.txt", file=io.BytesIO(b"not an image"))

    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(
            service.upload_cover_image(
                db=db_session,
                current_user=owner,
                community_id=community.id,
                file=bad_file,
            )
        )

    assert exc_info.value.status_code == 400

    refreshed = service.get_community_by_id(
        db=db_session, community_id=community.id, current_user=owner
    )
    assert refreshed.cover_image_url is None


def test_delete_cover_image_clears_url_but_keeps_color(db_session, make_user):
    import asyncio

    owner = _make_owner(db_session, make_user)
    community = service.create_community(
        db=db_session,
        current_user=owner,
        data=_make_community_payload(cover_color="sand"),
    )

    asyncio.run(
        service.upload_cover_image(
            db=db_session,
            current_user=owner,
            community_id=community.id,
            file=_make_upload_file(),
        )
    )

    updated = service.delete_cover_image(
        db=db_session, current_user=owner, community_id=community.id
    )

    assert updated.cover_image_url is None
    assert updated.cover_storage_key is None
    assert updated.cover_color == "sand"


def test_delete_cover_image_rejects_non_owner(db_session, make_user):
    owner = _make_owner(db_session, make_user)
    other = make_user("cover-delete-not-owner")

    community = service.create_community(
        db=db_session, current_user=owner, data=_make_community_payload()
    )

    with pytest.raises(HTTPException) as exc_info:
        service.delete_cover_image(
            db=db_session, current_user=other, community_id=community.id
        )

    assert exc_info.value.status_code == 403
