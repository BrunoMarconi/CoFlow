import asyncio
import io

import pytest
from fastapi import HTTPException, UploadFile

from app.database.models.user_photo import UserPhoto
from app.services.user_photo_service import (
    MAX_AVATAR_SIZE_BYTES,
    MAX_PHOTOS_PER_USER,
    UserPhotoService,
)

service = UserPhotoService()

# Cabecera PNG válida (detect_image_type solo mira los primeros bytes).
PNG_BYTES = b"\x89PNG\r\n\x1a\n" + b"0" * 32


def _upload_file(content: bytes = PNG_BYTES, filename: str = "photo.png") -> UploadFile:
    return UploadFile(filename=filename, file=io.BytesIO(content))


def test_upload_avatar_sets_url_and_replaces_previous(db_session, make_user):
    user = make_user("avatar-upload")

    updated = asyncio.run(
        service.upload_avatar(db_session, user, _upload_file())
    )

    assert updated.avatar_url is not None
    first_key = updated.avatar_storage_key

    updated_again = asyncio.run(
        service.upload_avatar(db_session, user, _upload_file())
    )

    assert updated_again.avatar_storage_key is not None
    assert updated_again.avatar_storage_key != first_key


def test_upload_avatar_rejects_oversized_file(db_session, make_user):
    user = make_user("avatar-too-big")
    oversized = PNG_BYTES + b"0" * (MAX_AVATAR_SIZE_BYTES + 1)

    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(service.upload_avatar(db_session, user, _upload_file(oversized)))

    assert exc_info.value.status_code == 400
    assert user.avatar_url is None


def test_upload_avatar_rejects_invalid_image_type(db_session, make_user):
    user = make_user("avatar-bad-type")

    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(
            service.upload_avatar(db_session, user, _upload_file(b"not an image"))
        )

    assert exc_info.value.status_code == 400
    assert user.avatar_url is None


def test_delete_avatar_clears_fields(db_session, make_user):
    user = make_user("avatar-delete")
    asyncio.run(service.upload_avatar(db_session, user, _upload_file()))
    assert user.avatar_url is not None

    updated = service.delete_avatar(db_session, user)

    assert updated.avatar_url is None
    assert updated.avatar_storage_key is None


def test_upload_photos_appends_with_incrementing_position(db_session, make_user):
    user = make_user("photos-upload")

    updated = asyncio.run(
        service.upload_photos(db_session, user, [_upload_file(), _upload_file()])
    )

    assert [photo.position for photo in updated.photos] == [0, 1]


def test_upload_photos_enforces_max_per_user(db_session, make_user):
    user = make_user("photos-max")
    files = [_upload_file() for _ in range(MAX_PHOTOS_PER_USER)]
    asyncio.run(service.upload_photos(db_session, user, files))

    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(service.upload_photos(db_session, user, [_upload_file()]))

    assert exc_info.value.status_code == 400


def test_upload_photos_rolls_back_batch_on_invalid_file(db_session, make_user):
    user = make_user("photos-rollback")

    with pytest.raises(HTTPException):
        asyncio.run(
            service.upload_photos(
                db_session, user, [_upload_file(), _upload_file(b"garbage")]
            )
        )

    remaining = (
        db_session.query(UserPhoto)
        .filter(UserPhoto.user_id == user.id)
        .count()
    )
    assert remaining == 0


def test_delete_photo_removes_row_and_404_for_unknown(db_session, make_user):
    user = make_user("photos-delete")
    updated = asyncio.run(service.upload_photos(db_session, user, [_upload_file()]))
    photo_id = updated.photos[0].id

    after_delete = service.delete_photo(db_session, user, photo_id)
    assert after_delete.photos == []

    with pytest.raises(HTTPException) as exc_info:
        service.delete_photo(db_session, user, photo_id)
    assert exc_info.value.status_code == 404


def test_reorder_photos_updates_positions(db_session, make_user):
    user = make_user("photos-reorder")
    updated = asyncio.run(
        service.upload_photos(db_session, user, [_upload_file(), _upload_file()])
    )
    ids = [photo.id for photo in updated.photos]

    reordered = service.reorder_photos(db_session, user, list(reversed(ids)))

    assert [photo.id for photo in reordered.photos] == list(reversed(ids))


def test_reorder_photos_rejects_mismatched_ids(db_session, make_user):
    user = make_user("photos-reorder-bad")
    asyncio.run(service.upload_photos(db_session, user, [_upload_file()]))

    with pytest.raises(HTTPException) as exc_info:
        service.reorder_photos(db_session, user, [999999])

    assert exc_info.value.status_code == 400
