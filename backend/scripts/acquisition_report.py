"""Cuantas altas trajo cada campana, leyendo users.signup_*.

Responde a "cuantos registros vinieron de ESN Malaga": agrupa las cuentas
creadas por origen/medio/campana en una ventana de tiempo. Los NULL se
muestran como "(organico / sin campana)", que es lo que significan.

Ojo con lo que NO cuenta: solo ve REGISTROS, no visitas. Cuantas personas
pasaron por la landing sin registrarse esta en Vercel Web Analytics, que
es otro panel distinto. La conversion de una cosa a otra hay que mirarla
cruzando ambos.

La atribucion solo se guarda si la persona acepto la analitica en el
banner de cookies, asi que estos numeros son un suelo, no un total.

Uso:
    cd backend

    # ultimos 30 dias de la base de datos local
    python -m scripts.acquisition_report

    # otra ventana, o todo el historico
    python -m scripts.acquisition_report --days 90
    python -m scripts.acquisition_report --all

    # ver las cuentas concretas de una campana
    python -m scripts.acquisition_report --source esn_malaga --list

Contra produccion (solo lectura), cargando backend/.env.production:
    DATABASE_URL="$(grep ^DATABASE_URL .env.production | cut -d= -f2-)" \
        python -m scripts.acquisition_report --days 30
"""

import argparse
import sys
from datetime import datetime, timedelta, timezone

from sqlalchemy import func

from app.database.models.user import User
from app.database.session import SessionLocal


def main() -> int:
    parser = argparse.ArgumentParser(description="Altas por campana de adquisicion.")
    parser.add_argument("--days", type=int, default=30, help="Ventana en dias (por defecto 30)")
    parser.add_argument("--all", action="store_true", help="Todo el historico, ignora --days")
    parser.add_argument("--source", help="Filtra por un signup_source concreto")
    parser.add_argument("--list", action="store_true", help="Lista las cuentas, no solo el recuento")
    args = parser.parse_args()

    db = SessionLocal()
    try:
        since = None if args.all else datetime.now(timezone.utc) - timedelta(days=args.days)
        window = "todo el historico" if args.all else f"ultimos {args.days} dias"

        base = db.query(User)
        if since is not None:
            base = base.filter(User.created_at >= since)
        if args.source:
            base = base.filter(User.signup_source == args.source.strip().lower())

        total = base.count()
        if total == 0:
            print(f"Sin altas en {window}" + (f" para source={args.source!r}" if args.source else "") + ".")
            return 0

        if args.list:
            print(f"Cuentas ({window}):\n")
            for user in base.order_by(User.created_at.desc()).all():
                origin = user.signup_source or "(organico)"
                print(f"  {user.created_at:%Y-%m-%d}  {user.email:38} {origin}")
            print(f"\n{total} cuentas.")
            return 0

        rows = (
            base.with_entities(
                User.signup_source,
                User.signup_medium,
                User.signup_campaign,
                func.count(User.id),
            )
            .group_by(User.signup_source, User.signup_medium, User.signup_campaign)
            .order_by(func.count(User.id).desc())
            .all()
        )

        print(f"Altas por campana - {window}\n")
        print(f"  {'ORIGEN':<16} {'MEDIO':<12} {'CAMPANA':<16} {'ALTAS':>6}   %")
        print(f"  {'-' * 16} {'-' * 12} {'-' * 16} {'-' * 6}  ---")

        attributed = 0
        for source, medium, campaign, count in rows:
            share = count * 100 / total
            if source is None:
                print(f"  {'(organico / sin campana)':<46} {count:>6}  {share:4.1f}%")
            else:
                attributed += count
                print(f"  {source:<16} {medium or '-':<12} {campaign or '-':<16} {count:>6}  {share:4.1f}%")

        print(f"\n  Total: {total} altas, {attributed} con campana ({attributed * 100 / total:.1f}%).")
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(main())
