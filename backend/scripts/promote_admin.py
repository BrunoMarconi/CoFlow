"""Asigna (o retira) el rol ADMIN a una cuenta ya existente.

El rol ADMIN no se puede pedir desde la API a propósito — no hay ningún
endpoint que lo conceda (ver app/api/routes/admin.py), así que la única
forma de darlo es desde la base de datos. Este script es esa forma.

Ojo con las dos capas de permiso (ver app/core/team.py):
  - role == "ADMIN"            -> panel de admin (/admin, require_admin)
  - ADMIN + email en TEAM_MEMBER_EMAILS -> además, herramientas internas
    de vivienda: alta asistida y panel con TODAS las viviendas
    (require_team_member)

Si el email del socio no está en TEAM_MEMBER_EMAILS, tendrá el panel de
admin pero no las herramientas de vivienda; añádelo a esa variable en
app/core/config.py o en el entorno de Render.

Uso:
    cd backend

    # ver el rol actual (no escribe nada)
    python -m scripts.promote_admin socio@ejemplo.com --check

    # promover a ADMIN
    python -m scripts.promote_admin socio@ejemplo.com

    # revertir a usuario normal
    python -m scripts.promote_admin socio@ejemplo.com --revoke

Contra producción, cargando backend/.env.production (gitignored):
    DATABASE_URL="$(grep ^DATABASE_URL .env.production | cut -d= -f2-)" \
        python -m scripts.promote_admin socio@ejemplo.com
"""

import argparse
import sys

from app.core.config import TEAM_MEMBER_EMAILS
from app.database.models.user import User
from app.database.session import SessionLocal


def main() -> int:
    parser = argparse.ArgumentParser(description="Gestiona el rol ADMIN de una cuenta.")
    parser.add_argument("email", help="Email de la cuenta, tal y como se registró")
    parser.add_argument(
        "--check",
        action="store_true",
        help="Solo muestra el estado actual, no modifica nada",
    )
    parser.add_argument(
        "--revoke",
        action="store_true",
        help="Devuelve la cuenta a rol USER en lugar de promoverla",
    )
    args = parser.parse_args()

    email = args.email.strip().lower()
    db = SessionLocal()
    try:
        # El email se guarda tal cual lo escribió el usuario al
        # registrarse, así que comparamos en minúsculas por si acaso.
        user = db.query(User).filter(User.email.ilike(email)).first()
        if user is None:
            print(f"No existe ninguna cuenta con el email {args.email!r}.")
            print("Tu socio tiene que registrarse primero en CoFlow con ese email.")
            return 1

        in_team_list = email in TEAM_MEMBER_EMAILS
        print(f"Cuenta:   {user.email} ({user.first_name} {user.last_name})")
        print(f"Rol:      {user.role}")
        print(f"Email verificado: {user.is_email_verified}")
        print(f"En TEAM_MEMBER_EMAILS: {in_team_list}")

        if args.check:
            return 0

        target = "USER" if args.revoke else "ADMIN"
        if user.role == target:
            print(f"\nNo hay nada que hacer: ya tiene rol {target}.")
            return 0

        user.role = target
        db.commit()
        print(f"\nHecho: {user.email} pasa de rol a {target}.")

        if target == "ADMIN":
            if not in_team_list:
                print(
                    "\nAviso: este email NO está en TEAM_MEMBER_EMAILS, así que "
                    "tendrá el panel de admin pero no la alta asistida ni el "
                    "panel de todas las viviendas. Añádelo a esa variable si "
                    "también necesita eso."
                )
            if not user.is_email_verified:
                print(
                    "\nAviso: su email no está verificado todavía. Si "
                    "EMAIL_VERIFICATION_ENABLED está en true, tendrá que "
                    "confirmarlo antes de poder entrar."
                )
            print("Que cierre sesión y vuelva a entrar para que el token recoja el rol nuevo.")

        return 0
    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(main())
