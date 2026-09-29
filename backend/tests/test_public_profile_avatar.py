"""El avatar tiene dos orígenes y el perfil público debe servir los dos.

Quien sube una foto guarda una clave de R2 (``avatar_storage_key``) y la
URL pública se regenera a partir de ella. Quien elige uno de los
personajes de CoFlow no tiene clave: guarda una ruta relativa a un asset
del frontend en ``avatar_url`` y ``avatar_storage_key`` se queda a None
(ver user_photo_service.set_preset_avatar).

El segundo caso se perdía: build_public_profile pasaba la clave pero no
la URL, así que sin clave no quedaba nada que servir y la persona salía
sin foto para todo el mundo menos para sí misma.
"""

from app.services.user_service import UserService


user_service = UserService()

PRESET_URL = "/images/avatar-presets/avatar-terracota.webp"


def test_preset_avatar_survives_in_public_profile(db_session, make_user):
    """Un avatar de preset no tiene storage_key: la URL relativa es el
    único dato que hay, y tiene que llegar al perfil público."""
    owner = make_user("preset_avatar_owner")
    viewer = make_user("preset_avatar_viewer")
    owner.avatar_url = PRESET_URL
    owner.avatar_storage_key = None
    db_session.commit()

    profile = user_service.get_public_profile(db_session, owner.id, viewer)

    assert profile.avatar_url == PRESET_URL


def test_uploaded_avatar_is_still_rebuilt_from_storage_key(db_session, make_user):
    """La clave sigue mandando sobre la URL guardada: el dominio público
    del almacenamiento puede cambiar y dejar obsoleta la URL antigua."""
    owner = make_user("uploaded_avatar_owner")
    viewer = make_user("uploaded_avatar_viewer")
    owner.avatar_url = "https://dominio-viejo.example/avatars/abc.webp"
    owner.avatar_storage_key = "avatars/abc.webp"
    db_session.commit()

    profile = user_service.get_public_profile(db_session, owner.id, viewer)

    assert profile.avatar_url is not None
    assert "dominio-viejo.example" not in profile.avatar_url
    assert profile.avatar_url.endswith("avatars/abc.webp")


def test_user_without_avatar_has_none(db_session, make_user):
    owner = make_user("no_avatar_owner")
    viewer = make_user("no_avatar_viewer")
    owner.avatar_url = None
    owner.avatar_storage_key = None
    db_session.commit()

    profile = user_service.get_public_profile(db_session, owner.id, viewer)

    assert profile.avatar_url is None
