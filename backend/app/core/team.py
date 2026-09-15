from app.core.config import TEAM_MEMBER_EMAILS


def is_team_member(role: str | None, email: str | None) -> bool:
    """Doble candado para las herramientas internas de vivienda: rol
    ADMIN (solo asignable desde la base de datos) y un email de la lista
    TEAM_MEMBER_EMAILS. Así, ni otro ADMIN ni alguien que se registre con
    uno de esos emails pueden ver todas las viviendas por sí solos."""
    if role != "ADMIN" or not email:
        return False

    return email.strip().lower() in TEAM_MEMBER_EMAILS
