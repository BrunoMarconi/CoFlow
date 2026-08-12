"""Bases de respuesta para imágenes guardadas por CoFlow.

La base de datos conserva tanto la clave estable del objeto como la URL que
se generó al subirlo. La clave es la fuente de verdad: el dominio público del
almacenamiento puede cambiar y una URL guardada puede quedarse obsoleta.

Los campos ``*_storage_key`` se usan únicamente al construir la respuesta y
se excluyen del JSON público.
"""

from typing import Any

from pydantic import BaseModel, ConfigDict, model_validator

from app.services import storage_service


def _response_values(model: type[BaseModel], value: Any) -> dict[str, Any]:
    """Convierte dict/ORM a los campos públicos declarados del esquema."""
    if isinstance(value, dict):
        return dict(value)

    return {
        field_name: getattr(value, field_name)
        for field_name in model.model_fields
        if hasattr(value, field_name)
    }


def _source_value(value: Any, field_name: str) -> Any:
    if isinstance(value, dict):
        return value.get(field_name)
    return getattr(value, field_name, None)


class StorageBackedAvatarResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    avatar_url: str | None = None

    @model_validator(mode="before")
    @classmethod
    def resolve_avatar_url(cls, value: Any):
        storage_key = _source_value(value, "avatar_storage_key")
        public_values = _response_values(cls, value)
        if storage_key:
            public_values["avatar_url"] = storage_service.generate_public_url(
                storage_key
            )
        return public_values


class StorageBackedImageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    image_url: str

    @model_validator(mode="before")
    @classmethod
    def resolve_image_url(cls, value: Any):
        storage_key = _source_value(value, "storage_key")
        public_values = _response_values(cls, value)
        if storage_key:
            public_values["image_url"] = storage_service.generate_public_url(
                storage_key
            )
        return public_values


class StorageBackedCommunityCoverResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    cover_image_url: str | None = None

    @model_validator(mode="before")
    @classmethod
    def resolve_cover_image_url(cls, value: Any):
        storage_key = _source_value(value, "cover_storage_key")
        public_values = _response_values(cls, value)
        if storage_key:
            public_values["cover_image_url"] = storage_service.generate_public_url(
                storage_key
            )
        return public_values
