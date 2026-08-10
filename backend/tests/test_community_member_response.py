"""Tests de los campos añadidos a CommunityMemberUserResponse (age,
is_email_verified) — necesarios para mostrar la edad de cada miembro y
el % de perfiles verificados en la página de detalle de comunidad."""

from app.schemas.community import (
    CommunityCreate,
    CommunityMemberUserResponse,
    CommunityPreferencesCreate,
)
from app.services.community_service import CommunityService

service = CommunityService()

_PREFERENCES = CommunityPreferencesCreate(
    cleanliness="Limpieza básica semanal",
    atmosphere="Tranquilo, con algunos momentos sociales",
    visits="Preferimos que se avise antes",
    sleepovers="Permitido con previo aviso",
    smoking="No aceptamos fumadores",
    pets="Depende del animal",
    rules="Normas claras pero flexibles",
    lifestyle="Tener una relación cordial",
)


def _make_community_payload(**overrides) -> CommunityCreate:
    base = dict(
        name="Casa Málaga",
        description="Una comunidad tranquila cerca del centro de Málaga.",
        city="Málaga",
        province=None,
        neighborhood=None,
        max_members=4,
        preferences=_PREFERENCES,
        profile_type="MIXED",
        profile_description=None,
        join_type="REQUEST",
        open_spots=1,
        urgency="NORMAL",
        monthly_rent=400,
        deposit=None,
        move_in_date=None,
        room_description=None,
    )
    base.update(overrides)
    return CommunityCreate(**base)


def test_member_response_includes_age_and_verification(db_session, make_user):
    owner = make_user("member-fields-owner")
    owner.age = 29
    owner.is_email_verified = True
    db_session.commit()

    community = service.create_community(
        db=db_session, current_user=owner, data=_make_community_payload()
    )

    member = community.members[0]
    response = CommunityMemberUserResponse.model_validate(member.user)
    assert response.age == 29
    assert response.is_email_verified is True


def test_member_response_defaults_when_unset(db_session, make_user):
    owner = make_user("member-fields-defaults")

    community = service.create_community(
        db=db_session, current_user=owner, data=_make_community_payload()
    )

    member = community.members[0]
    response = CommunityMemberUserResponse.model_validate(member.user)
    assert response.age is None
    assert response.is_email_verified is False
