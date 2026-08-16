"""Tests para SavedCommunityService y su reflejo en is_saved de
CommunityResponse (ver CommunityService._enrich_community)."""

from app.schemas.community import CommunityCreate, CommunityPreferencesCreate
from app.services.community_service import CommunityService
from app.services.saved_community_service import SavedCommunityService

community_service = CommunityService()
saved_community_service = SavedCommunityService()

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


def test_save_and_unsave_community_round_trip(db_session, make_user):
    owner = make_user("saved-community-owner")
    viewer = make_user("saved-community-viewer")

    community = community_service.create_community(
        db=db_session, current_user=owner, data=_make_community_payload()
    )

    assert (
        saved_community_service.is_saved(db_session, viewer, community.id)
        is False
    )

    saved_community_service.save_community(db_session, viewer, community.id)
    assert (
        saved_community_service.is_saved(db_session, viewer, community.id)
        is True
    )

    saved_community_service.unsave_community(db_session, viewer, community.id)
    assert (
        saved_community_service.is_saved(db_session, viewer, community.id)
        is False
    )


def test_save_community_twice_does_not_error(db_session, make_user):
    owner = make_user("saved-community-owner-2")
    viewer = make_user("saved-community-viewer-2")

    community = community_service.create_community(
        db=db_session, current_user=owner, data=_make_community_payload()
    )

    assert saved_community_service.save_community(
        db_session, viewer, community.id
    ) is True
    assert saved_community_service.save_community(
        db_session, viewer, community.id
    ) is True


def test_get_communities_reflects_is_saved_for_current_viewer(
    db_session, make_user
):
    owner = make_user("saved-community-owner-3")
    viewer = make_user("saved-community-viewer-3")

    community = community_service.create_community(
        db=db_session, current_user=owner, data=_make_community_payload()
    )
    saved_community_service.save_community(db_session, viewer, community.id)

    results = community_service.get_communities(db=db_session, current_user=viewer)
    result = next(item for item in results if item.id == community.id)
    assert result.is_saved is True

    owner_results = community_service.get_communities(db=db_session, current_user=owner)
    owner_view = next(item for item in owner_results if item.id == community.id)
    assert owner_view.is_saved is False
