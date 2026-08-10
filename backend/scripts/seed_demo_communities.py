"""Seed de datos de demostración: usuarios y comunidades falsas con
foto de perfil, para poder ver de verdad el diseño de las tarjetas de
comunidad (portada con avatares agrupados) en desarrollo.

Idempotente: se puede ejecutar varias veces sin duplicar nada — los
usuarios se identifican por email (dominio @demo.coflow.local) y las
comunidades por nombre exacto.

Uso:
    cd backend
    python -m scripts.seed_demo_communities
"""

from app.core.security import hash_password
from app.database.models.community import (
    Community,
    CommunityJoinType,
    CommunityProfileType,
    CommunityUrgency,
)
from app.database.models.community_member import (
    CommunityMember,
    CommunityMemberRole,
)
from app.database.models.community_preferences import CommunityPreferences
from app.database.models.user import User
from app.database.session import SessionLocal

# i.pravatar.cc sirve fotos de stock estables por número (1-70), sin
# necesidad de API key ni de subir nada al storage real — perfecto
# para avatar_url de demo.
DEMO_USERS = [
    dict(first_name="Marta", last_name="Ruiz", age=27, occupation="Diseñadora UX", avatar=5),
    dict(first_name="Diego", last_name="Torres", age=28, occupation="Desarrollador", avatar=12),
    dict(first_name="Lucía", last_name="Fernández", age=23, occupation="Estudiante de Máster", avatar=9),
    dict(first_name="Pau", last_name="Serra", age=26, occupation="Ingeniero", avatar=15),
    dict(first_name="Nora", last_name="Gil", age=29, occupation="Enfermera", avatar=25),
    dict(first_name="Adrián", last_name="Vega", age=24, occupation="Músico", avatar=33),
    dict(first_name="Carla", last_name="Ibáñez", age=25, occupation="Fotógrafa", avatar=44),
    dict(first_name="Hugo", last_name="Navarro", age=30, occupation="Consultor", avatar=51),
    dict(first_name="Sara", last_name="Moreno", age=22, occupation="Estudiante de Grado", avatar=47),
    dict(first_name="Iván", last_name="Castro", age=31, occupation="Arquitecto", avatar=59),
    dict(first_name="Elena", last_name="Ortiz", age=26, occupation="Marketing", avatar=20),
    dict(first_name="Marc", last_name="Puig", age=27, occupation="Profesor", avatar=13),
]

DEMO_COMMUNITIES = [
    dict(
        name="Casa Málaga",
        city="Málaga",
        neighborhood="Centro",
        description=(
            "Piso tranquilo cerca del centro de Málaga, buscamos gente "
            "respetuosa y con ganas de buena convivencia."
        ),
        cover_color="sage",
        profile_type=CommunityProfileType.STUDENTS,
        monthly_rent=400,
        atmosphere="Tranquilo, con algunos momentos sociales",
        member_names=["Marta Ruiz", "Lucía Fernández", "Sara Moreno"],
        owner_name="Marta Ruiz",
        max_members=4,
        open_spots=1,
    ),
    dict(
        name="Piso Chamberí",
        city="Madrid",
        neighborhood="Chamberí",
        description=(
            "Compartimos piso reformado en Chamberí, ideal para "
            "profesionales con horarios de oficina."
        ),
        cover_color="cream",
        profile_type=CommunityProfileType.YOUNG_PROFESSIONALS,
        monthly_rent=600,
        atmosphere="Tranquilo y ordenado",
        member_names=["Diego Torres", "Hugo Navarro"],
        owner_name="Diego Torres",
        max_members=3,
        open_spots=1,
    ),
    dict(
        name="Casa Ruzafa",
        city="Valencia",
        neighborhood="Ruzafa",
        description=(
            "Comunidad joven y social en pleno Ruzafa, cerca de todo y "
            "con muy buen ambiente."
        ),
        cover_color="sand",
        profile_type=CommunityProfileType.MIXED,
        monthly_rent=420,
        atmosphere="Social, nos gusta compartir cenas",
        member_names=["Carla Ibáñez", "Adrián Vega", "Elena Ortiz", "Marc Puig"],
        owner_name="Carla Ibáñez",
        max_members=5,
        open_spots=1,
    ),
    dict(
        name="Casa Poblenou",
        city="Barcelona",
        neighborhood="Poblenou",
        description=(
            "Piso luminoso en Poblenou, buscamos a alguien nómada "
            "digital o freelance que trabaje desde casa."
        ),
        cover_color="smoke",
        profile_type=CommunityProfileType.DIGITAL_NOMADS,
        monthly_rent=550,
        atmosphere="Tranquilo, cada uno con su espacio",
        member_names=["Pau Serra", "Nora Gil"],
        owner_name="Pau Serra",
        max_members=3,
        open_spots=1,
    ),
    dict(
        name="Casa Triana",
        city="Sevilla",
        neighborhood="Triana",
        description=(
            "Comunidad relajada en Triana a dos pasos del río, buen "
            "rollo y respeto ante todo."
        ),
        cover_color="forest",
        profile_type=CommunityProfileType.WORKERS,
        monthly_rent=380,
        atmosphere="Buen rollo, respeto y flexibilidad",
        member_names=["Iván Castro"],
        owner_name="Iván Castro",
        max_members=4,
        open_spots=2,
    ),
]

DEFAULT_PREFERENCES = dict(
    cleanliness="Limpieza básica semanal, cada uno su turno",
    visits="Avisar con antelación",
    sleepovers="Permitido con normalidad",
    smoking="No se fuma dentro del piso",
    pets="Depende del animal, se habla en el grupo",
    rules="Normas claras pero flexibles",
    lifestyle="Buscamos una convivencia cordial y respetuosa",
)


def _get_or_create_user(db, data: dict) -> User:
    email = (
        f"{data['first_name'].lower()}.{data['last_name'].lower()}"
        "@demo.coflow.local"
    ).replace(" ", "")

    existing = db.query(User).filter(User.email == email).first()
    if existing is not None:
        return existing

    user = User(
        first_name=data["first_name"],
        last_name=data["last_name"],
        email=email,
        password_hash=hash_password("Demo1234!"),
        is_email_verified=True,
        onboarding_completed=True,
        rental_budget=None,
        is_looking_for_roommates=True,
        avatar_url=f"https://i.pravatar.cc/300?img={data['avatar']}",
        age=data["age"],
        occupation=data["occupation"],
        bio=None,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _create_community(db, spec: dict, users_by_name: dict[str, User]) -> None:
    existing = db.query(Community).filter(Community.name == spec["name"]).first()
    if existing is not None:
        print(f"  ya existe, se omite: {spec['name']}")
        return

    owner = users_by_name[spec["owner_name"]]

    community = Community(
        name=spec["name"],
        description=spec["description"],
        city=spec["city"],
        neighborhood=spec["neighborhood"],
        max_members=spec["max_members"],
        owner_id=owner.id,
        join_type=CommunityJoinType.REQUEST,
        open_spots=spec["open_spots"],
        urgency=CommunityUrgency.NORMAL,
        profile_type=spec["profile_type"],
        monthly_rent=spec["monthly_rent"],
        cover_color=spec["cover_color"],
    )

    community.preferences = CommunityPreferences(
        atmosphere=spec["atmosphere"],
        **DEFAULT_PREFERENCES,
    )

    for member_name in spec["member_names"]:
        member_user = users_by_name[member_name]
        role = (
            CommunityMemberRole.OWNER
            if member_name == spec["owner_name"]
            else CommunityMemberRole.MEMBER
        )
        community.members.append(
            CommunityMember(user_id=member_user.id, role=role)
        )

    db.add(community)
    db.commit()
    print(f"  creada: {spec['name']} ({len(spec['member_names'])} miembros)")


def main() -> None:
    db = SessionLocal()

    try:
        print("Creando usuarios de demo...")
        users_by_name: dict[str, User] = {}

        for data in DEMO_USERS:
            user = _get_or_create_user(db, data)
            full_name = f"{data['first_name']} {data['last_name']}"
            users_by_name[full_name] = user
            print(f"  {full_name} -> {user.email}")

        print("\nCreando comunidades de demo...")
        for spec in DEMO_COMMUNITIES:
            _create_community(db, spec, users_by_name)

        print("\nListo.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
