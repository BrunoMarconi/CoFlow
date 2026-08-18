"""Indicador de "escribiendo..." — estado efímero en memoria, no en la
base de datos: no tiene sentido persistir algo que caduca en segundos.
Asume un único proceso de backend (el despliegue actual de Render no
tiene varias instancias detrás de un balanceador); si eso cambiara,
esto tendría que pasar a Redis o similar."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

TYPING_TTL_SECONDS = 6

# thread_key -> { user_id_str: (expira_en, nombre) }
_typing_state: dict[str, dict[str, tuple[datetime, str]]] = {}


def mark_typing(thread_key: str, user_id: str, first_name: str) -> None:
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=TYPING_TTL_SECONDS)
    _typing_state.setdefault(thread_key, {})[user_id] = (expires_at, first_name)


def get_typing_users(thread_key: str, exclude_user_id: str) -> list[str]:
    entries = _typing_state.get(thread_key)
    if not entries:
        return []

    now = datetime.now(timezone.utc)
    active_names = []
    expired_ids = []

    for user_id, (expires_at, first_name) in entries.items():
        if expires_at < now:
            expired_ids.append(user_id)
        elif user_id != exclude_user_id:
            active_names.append(first_name)

    for user_id in expired_ids:
        entries.pop(user_id, None)

    return active_names
