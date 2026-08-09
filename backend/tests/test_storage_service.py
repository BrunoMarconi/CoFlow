"""Tests de app/services/storage_service.py: la fachada única de
subida/borrado/validación de imágenes, y su selección de backend
(R2 vs disco local).

Como estos tests corren sin credenciales reales de Cloudflare R2, el
backend R2 se ejercita simulando sus piezas externas (boto3) — nunca
se hace una llamada de red real."""

import io
from unittest.mock import MagicMock

import pytest
from botocore.exceptions import ClientError
from fastapi import HTTPException
from PIL import Image

from app.services import storage_service
from app.services.storage import r2 as r2_module
from app.services.storage.r2 import R2ConfigurationError, R2Storage, R2UploadError

FAKE_R2_CONFIG = {
    "R2_ACCOUNT_ID": "test-account",
    "R2_ACCESS_KEY_ID": "test-key",
    "R2_SECRET_ACCESS_KEY": "test-secret",
    "R2_BUCKET_NAME": "test-bucket",
    "R2_PUBLIC_BASE_URL": "https://media.example.com",
}


def _configure_fake_r2(monkeypatch):
    for name, value in FAKE_R2_CONFIG.items():
        monkeypatch.setattr(r2_module, name, value)


def _valid_png_bytes(color=(10, 20, 30)) -> bytes:
    buffer = io.BytesIO()
    Image.new("RGB", (4, 4), color=color).save(buffer, format="PNG")
    return buffer.getvalue()


def _make_upload_file():
    from fastapi import UploadFile

    return UploadFile(filename="avatar.png", file=io.BytesIO(_valid_png_bytes()))


# --- validate_image -----------------------------------------------------


def test_validate_image_normalizes_to_webp():
    validated = storage_service.validate_image(
        _valid_png_bytes(), max_size_bytes=8 * 1024 * 1024
    )

    assert validated.content_type == "image/webp"
    assert validated.extension == "webp"
    # El contenido normalizado debe decodificar como WebP real.
    with Image.open(io.BytesIO(validated.content)) as image:
        assert image.format == "WEBP"


def test_validate_image_rejects_oversized_file():
    content = _valid_png_bytes() + b"0" * 100

    with pytest.raises(HTTPException) as exc_info:
        storage_service.validate_image(content, max_size_bytes=10)

    assert exc_info.value.status_code == 400
    assert "smaller than" in exc_info.value.detail


def test_validate_image_rejects_invalid_mime():
    with pytest.raises(HTTPException) as exc_info:
        storage_service.validate_image(b"not an image", max_size_bytes=8 * 1024 * 1024)

    assert exc_info.value.status_code == 400
    assert "JPEG, PNG or WebP" in exc_info.value.detail


def test_validate_image_rejects_svg_disguised_as_allowed_type():
    # Ningún SVG (texto) puede superar el chequeo de magic bytes: no
    # empieza por ninguna de las firmas binarias de JPEG/PNG/WebP.
    svg = b"<?xml version='1.0'?><svg xmlns='http://www.w3.org/2000/svg'></svg>"

    with pytest.raises(HTTPException) as exc_info:
        storage_service.validate_image(svg, max_size_bytes=8 * 1024 * 1024)

    assert exc_info.value.status_code == 400


def test_validate_image_rejects_corrupt_file_with_valid_magic_bytes():
    # Cabecera PNG real, pero el resto del archivo no es una imagen
    # válida: pasa el chequeo de magic bytes pero Pillow no puede
    # decodificarlo. Esto es justo lo que la doble validación (magic
    # bytes + Pillow) está pensada para atrapar.
    fake_png = b"\x89PNG\r\n\x1a\n" + b"garbage-not-a-real-png" * 4

    with pytest.raises(HTTPException) as exc_info:
        storage_service.validate_image(fake_png, max_size_bytes=8 * 1024 * 1024)

    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "Invalid image file"


# --- generate_public_url -------------------------------------------------


def test_generate_public_url_uses_r2_when_configured(monkeypatch):
    _configure_fake_r2(monkeypatch)

    url = storage_service.generate_public_url("avatars/abc123.webp")

    assert url == "https://media.example.com/avatars/abc123.webp"


def test_generate_public_url_falls_back_to_backend_public_url(monkeypatch):
    for name in FAKE_R2_CONFIG:
        monkeypatch.setattr(r2_module, name, "")

    url = storage_service.generate_public_url("avatars/abc123.webp")

    assert url.endswith("/media/avatars/abc123.webp")
    assert "127.0.0.1" in url or "localhost" in url or url.startswith("http")


# --- upload_file / delete_file: backend R2 (mockeado) ---------------------


def test_upload_file_uses_r2_when_configured_and_returns_r2_url(monkeypatch):
    _configure_fake_r2(monkeypatch)

    fake_client = MagicMock()
    monkeypatch.setattr(
        R2Storage, "_get_client", lambda self: fake_client
    )

    validated = storage_service.validate_image(
        _valid_png_bytes(), max_size_bytes=8 * 1024 * 1024
    )

    storage_key, url = storage_service.upload_file(validated, "avatars")

    assert storage_key.startswith("avatars/")
    assert storage_key.endswith(".webp")
    assert url == f"https://media.example.com/{storage_key}"
    fake_client.put_object.assert_called_once()
    call_kwargs = fake_client.put_object.call_args.kwargs
    assert call_kwargs["Bucket"] == "test-bucket"
    assert call_kwargs["Key"] == storage_key
    assert call_kwargs["ContentType"] == "image/webp"


def test_upload_file_r2_failure_raises_and_does_not_return_a_url(monkeypatch):
    _configure_fake_r2(monkeypatch)

    fake_client = MagicMock()
    fake_client.put_object.side_effect = ClientError(
        {"Error": {"Code": "AccessDenied", "Message": "denied"}}, "PutObject"
    )
    monkeypatch.setattr(R2Storage, "_get_client", lambda self: fake_client)

    validated = storage_service.validate_image(
        _valid_png_bytes(), max_size_bytes=8 * 1024 * 1024
    )

    with pytest.raises(R2UploadError):
        storage_service.upload_file(validated, "avatars")


def test_upload_avatar_r2_failure_does_not_modify_db(monkeypatch, db_session, make_user):
    """Requisito explícito: si R2 falla al subir un avatar de
    reemplazo, el avatar anterior (URL, storage_key y archivo) no debe
    perderse ni tocarse en absoluto."""
    import asyncio

    from app.services.user_photo_service import UserPhotoService

    user = make_user("r2-upload-failure")
    service = UserPhotoService()

    # Primero un avatar real, subido con éxito (sin R2 configurado,
    # cae al disco local) — esto es lo que NO debe perderse.
    asyncio.run(service.upload_avatar(db_session, user, _make_upload_file()))
    previous_avatar_url = user.avatar_url
    previous_storage_key = user.avatar_storage_key
    assert previous_avatar_url is not None

    # Ahora R2 se configura pero falla al subir el reemplazo.
    _configure_fake_r2(monkeypatch)
    fake_client = MagicMock()
    fake_client.put_object.side_effect = ClientError(
        {"Error": {"Code": "AccessDenied", "Message": "denied"}}, "PutObject"
    )
    monkeypatch.setattr(R2Storage, "_get_client", lambda self: fake_client)

    with pytest.raises(R2UploadError):
        asyncio.run(service.upload_avatar(db_session, user, _make_upload_file()))

    assert user.avatar_url == previous_avatar_url
    assert user.avatar_storage_key == previous_storage_key


def test_delete_file_swallows_r2_errors(monkeypatch):
    _configure_fake_r2(monkeypatch)

    fake_client = MagicMock()
    fake_client.delete_object.side_effect = ClientError(
        {"Error": {"Code": "NoSuchKey", "Message": "missing"}}, "DeleteObject"
    )
    monkeypatch.setattr(R2Storage, "_get_client", lambda self: fake_client)

    # No debe lanzar, aunque el borrado remoto falle.
    storage_service.delete_file("avatars/does-not-exist.webp", "avatars")


def test_delete_file_no_op_for_empty_storage_key(monkeypatch):
    _configure_fake_r2(monkeypatch)
    fake_client = MagicMock()
    monkeypatch.setattr(R2Storage, "_get_client", lambda self: fake_client)

    storage_service.delete_file("", "avatars")

    fake_client.delete_object.assert_not_called()


def test_r2_client_raises_configuration_error_when_incomplete():
    storage = R2Storage()

    with pytest.raises(R2ConfigurationError):
        storage._get_client()


# --- upload_file: fallback a disco local cuando R2 no está configurado ---


def test_upload_file_falls_back_to_local_storage_when_r2_not_configured(
    monkeypatch,
):
    for name in FAKE_R2_CONFIG:
        monkeypatch.setattr(r2_module, name, "")

    validated = storage_service.validate_image(
        _valid_png_bytes(), max_size_bytes=8 * 1024 * 1024
    )

    storage_key, url = storage_service.upload_file(validated, "avatars")

    assert storage_key.startswith("avatars/")
    assert url.endswith(storage_key.replace("avatars/", "avatars/"))

    storage_service.delete_file(storage_key, "avatars")
