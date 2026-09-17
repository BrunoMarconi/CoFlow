"""Elimina por completo una cuenta desde la base de datos, por email.

Hace las mismas comprobaciones que la baja de cuenta de la app
(auth_service.delete_account) menos la de contraseña, porque aquí el
borrado lo ejecuta el equipo, no la persona dueña de la cuenta:

  - si la cuenta es OWNER de alguna comunidad, aborta: community.owner_id
    no tiene ON DELETE, así que Postgres rechazaría el DELETE de todas
    formas. Hay que transferir o borrar la comunidad primero.
  - cancela en Stripe las suscripciones de sus pisos ANTES de borrar.
    Esto es lo importante de usar este script y no un DELETE a pelo:
    Stripe no se entera de que la cuenta desaparece y seguiría cobrando
    cada mes.

Todo lo demás (mensajes, solicitudes, conexiones, fotos, notificaciones,
tokens, perfil de owner, conexiones bancarias...) cae solo por
ON DELETE CASCADE.

Por defecto es un SIMULACRO: enseña qué se borraría y no toca nada.
Hay que pasar --yes para que escriba.

Uso:
    cd backend

    # simulacro
    python -m scripts.delete_user alguien@ejemplo.com

    # borrado real
    python -m scripts.delete_user alguien@ejemplo.com --yes

Contra produccion, cargando backend/.env.production (gitignored):
    DATABASE_URL="$(grep ^DATABASE_URL .env.production | cut -d= -f2-)" \
        python -m scripts.delete_user alguien@ejemplo.com --yes
"""

import argparse
import sys

from sqlalchemy.exc import IntegrityError

from app.database.models.user import User
from app.database.session import SessionLocal
from app.services import billing_service


def main() -> int:
    parser = argparse.ArgumentParser(description="Elimina una cuenta por email.")
    parser.add_argument("email", help="Email de la cuenta a eliminar")
    parser.add_argument(
        "--yes",
        action="store_true",
        help="Ejecuta el borrado de verdad (sin esto solo simula)",
    )
    args = parser.parse_args()

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email.ilike(args.email.strip())).first()
        if user is None:
            print(f"No existe ninguna cuenta con el email {args.email!r}.")
            return 1

        print(f"Cuenta:  {user.email} ({user.first_name} {user.last_name})")
        print(f"Id:      {user.id}")
        print(f"Rol:     {user.role}")
        print(f"Alta:    {user.created_at}")

        owned = list(user.owned_communities)
        if owned:
            print("\nNo se puede borrar: es OWNER de estas comunidades:")
            for community in owned:
                print(f"  - [{community.id}] {community.name}")
            print(
                "\nTransfiere la propiedad a otro miembro o elimina la "
                "comunidad antes de borrar la cuenta."
            )
            return 1

        # Pisos con suscripcion viva: hay que cancelarlos en Stripe o
        # seguirian cobrando a una cuenta que ya no existe.
        subscribed = []
        if user.owner_profile:
            subscribed = [
                p for p in user.owner_profile.properties if p.stripe_subscription_id
            ]

        if subscribed:
            print("\nPisos con suscripcion de Stripe activa (se cancelaran):")
            for property_obj in subscribed:
                print(f"  - [{property_obj.id}] {property_obj.title}")

        if not args.yes:
            print("\n--- SIMULACRO: no se ha borrado nada. Repite con --yes. ---")
            return 0

        for property_obj in subscribed:
            billing_service.cancel_property_subscription(
                db, property_obj, at_period_end=False
            )
            print(f"Suscripcion cancelada: piso {property_obj.id}")

        try:
            db.delete(user)
            db.commit()
        except IntegrityError as exc:
            db.rollback()
            print("\nPostgres ha rechazado el borrado por datos vinculados:")
            print(f"  {exc.orig}")
            print(
                "Alguna tabla apunta a este usuario sin ON DELETE CASCADE. "
                "Mira el nombre de la constraint de arriba y limpia esa fila "
                "antes de reintentar."
            )
            return 1

        print(f"\nCuenta {args.email} eliminada.")
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(main())
