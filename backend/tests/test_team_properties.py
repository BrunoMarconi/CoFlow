from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.core import config, team
from app.core.dependencies import get_current_user
from app.database.models.property import PropertyStatus
from app.database.session import get_db
from app.main import app
from app.schemas.user import UserResponse


@pytest.fixture
def team_setup(db_session, make_user, monkeypatch):
    member = make_user("team_member")
    member.role = "ADMIN"
    other_admin = make_user("other_admin")
    other_admin.role = "ADMIN"
    regular = make_user("regular")
    db_session.commit()

    monkeypatch.setattr(team, "TEAM_MEMBER_EMAILS", frozenset({member.email}))

    state = {"user": member}
    app.dependency_overrides[get_db] = lambda: db_session
    app.dependency_overrides[get_current_user] = lambda: state["user"]

    try:
        yield {
            "client": TestClient(app),
            "state": state,
            "member": member,
            "other_admin": other_admin,
            "regular": regular,
        }
    finally:
        app.dependency_overrides.clear()


def _listing(owner=None, owner_profile_id=None, **property_fields):
    payload = {
        "property": {"title": "Piso en Teatinos", "city": "Málaga", **property_fields},
        "owner_consent": True,
    }
    if owner_profile_id is not None:
        payload["owner_profile_id"] = owner_profile_id
    else:
        payload["owner"] = owner
    return payload


def _create(client, payload):
    with patch("app.api.routes.assisted_listings.send_owner_claim_email"):
        return client.post("/assisted-listings", json=payload)


def test_default_team_is_the_two_founders():
    assert config.TEAM_MEMBER_EMAILS == frozenset(
        {"bmarconi2009@gmail.com", "dsegadovizcaino@gmail.com"}
    )


def test_team_membership_requires_admin_role_and_listed_email(monkeypatch):
    monkeypatch.setattr(team, "TEAM_MEMBER_EMAILS", frozenset({"socio@example.com"}))

    assert team.is_team_member("ADMIN", "Socio@Example.com ") is True
    assert team.is_team_member("USER", "socio@example.com") is False
    assert team.is_team_member("OWNER", "socio@example.com") is False
    assert team.is_team_member("ADMIN", "otro@example.com") is False
    assert team.is_team_member("ADMIN", None) is False


def test_user_response_exposes_team_flag(team_setup):
    assert UserResponse.model_validate(team_setup["member"]).is_team_member is True
    assert UserResponse.model_validate(team_setup["other_admin"]).is_team_member is False
    assert UserResponse.model_validate(team_setup["regular"]).is_team_member is False


@pytest.mark.parametrize("who", ["other_admin", "regular"])
def test_only_team_members_reach_team_tools(team_setup, who):
    client = team_setup["client"]
    team_setup["state"]["user"] = team_setup[who]

    assert client.get("/team/properties").status_code == 403
    assert client.get("/team/owners").status_code == 403
    assert client.get("/team/properties/1").status_code == 403
    assert _create(client, _listing(owner={"first_name": "X"})).status_code == 403


def test_agency_gets_all_listings_in_one_account(team_setup):
    client = team_setup["client"]

    first = _create(client, _listing(owner={
        "first_name": "Carmen",
        "last_name": "Ruiz",
        "email": "carmen-agencia-test@example.com",
        "phone": "+34600000000",
        "owner_type": "AGENCY",
        "company_name": "Inmobiliaria Prueba Sol",
    }))
    assert first.status_code == 200, first.text
    first_body = first.json()
    assert first_body["is_new_owner"] is True
    assert first_body["claim_url"]
    assert first_body["owner_display_name"] == "Inmobiliaria Prueba Sol"

    # Repetir el correo no crea otra cuenta: el backend señala el cliente.
    duplicate = _create(client, _listing(owner={"email": "carmen-agencia-test@example.com"}))
    assert duplicate.status_code == 409
    assert duplicate.json()["detail"]["code"] == "OWNER_EXISTS"
    owner_profile_id = duplicate.json()["detail"]["owner_profile_id"]
    assert owner_profile_id == first_body["owner_profile_id"]

    second = _create(client, _listing(owner_profile_id=owner_profile_id, title="Ático en el Centro"))
    assert second.status_code == 200, second.text
    assert second.json()["is_new_owner"] is False
    assert second.json()["claim_url"] is None

    owners = client.get("/team/owners", params={"q": "prueba sol"}).json()
    assert [owner["property_count"] for owner in owners] == [2]
    assert owners[0]["owner_type"] == "AGENCY"
    assert owners[0]["account_activated"] is False

    listed = client.get("/team/properties", params={"q": "Prueba Sol"}).json()
    assert {item["title"] for item in listed} == {"Piso en Teatinos", "Ático en el Centro"}
    assert all("fotografías" in item["missing_fields"] for item in listed)

    drafts = client.get("/team/properties", params={"owner_profile_id": owner_profile_id, "status": "READY"}).json()
    assert drafts == []


def test_listing_requires_exactly_one_owner_source(team_setup):
    client = team_setup["client"]
    both = _listing(owner={"first_name": "A"})
    both["owner_profile_id"] = 1
    assert _create(client, both).status_code == 422

    neither = _listing(owner={"first_name": "A"})
    neither.pop("owner")
    assert _create(client, neither).status_code == 422

    agency_without_name = _listing(owner={"owner_type": "AGENCY"})
    assert _create(client, agency_without_name).status_code == 422


def test_team_edits_photos_and_publishes_a_draft(team_setup, db_session):
    client = team_setup["client"]
    created = _create(client, _listing(owner={"first_name": "Lola"}))
    property_id = created.json()["property_id"]

    # Borrador a medias: el equipo puede guardar textos cortos o vacíos.
    partial = client.put(f"/team/properties/{property_id}", json={"title": "", "bedrooms": None, "neighborhood": "Soho"})
    assert partial.status_code == 200, partial.text
    assert partial.json()["title"] == ""
    assert partial.json()["bedrooms"] == 0
    assert partial.json()["neighborhood"] == "Soho"

    not_ready = client.post(f"/team/properties/{property_id}/ready")
    assert not_ready.status_code == 422

    updated = client.put(f"/team/properties/{property_id}", json={
        "title": "Piso reformado en el Soho",
        "description": "Piso exterior y luminoso a cinco minutos del puerto de Málaga.",
        "property_type": "APARTMENT",
        "address_line": "Calle Tomás Heredia 10",
        "postal_code": "29001",
        "bedrooms": 3,
        "bathrooms": 2,
        "max_tenants": 3,
        "total_monthly_rent": 1350,
        "deposit": 1350,
        "available_from": "2026-10-01",
    })
    assert updated.status_code == 200, updated.text
    assert updated.json()["missing_fields"] == ["fotografías"]
    assert updated.json()["owner"]["display_name"] == "Lola"

    uploads = iter([("properties/team-a.webp", "a"), ("properties/team-b.webp", "b")])
    with patch("app.services.property_image_service.storage_service.validate_image", side_effect=lambda content, _max: content), \
         patch("app.services.property_image_service.storage_service.upload_file", side_effect=lambda *_args: next(uploads)):
        uploaded = client.post(
            f"/team/properties/{property_id}/images",
            files=[("files", ("a.jpg", b"a", "image/jpeg")), ("files", ("b.jpg", b"b", "image/jpeg"))],
        )
    assert uploaded.status_code == 200, uploaded.text
    images = uploaded.json()["images"]
    assert [image["is_cover"] for image in images] == [True, False]

    cover = client.post(f"/team/properties/{property_id}/images/{images[1]['id']}/cover")
    assert [image["is_cover"] for image in cover.json()["images"]] == [False, True]

    reordered = client.put(f"/team/properties/{property_id}/images/order", json={"image_ids": [images[1]["id"], images[0]["id"]]})
    assert [image["id"] for image in reordered.json()["images"]] == [images[1]["id"], images[0]["id"]]

    with patch("app.services.property_image_service.storage_service.delete_file") as delete_file:
        removed = client.delete(f"/team/properties/{property_id}/images/{images[0]['id']}")
    assert removed.status_code == 200
    assert len(removed.json()["images"]) == 1
    delete_file.assert_called_once()

    ready = client.post(f"/team/properties/{property_id}/ready")
    assert ready.status_code == 200, ready.text
    assert ready.json()["status"] == PropertyStatus.READY.value
    assert ready.json()["missing_fields"] == []

    detail = client.get(f"/team/properties/{property_id}")
    assert detail.status_code == 200
    assert detail.json()["owner"]["property_count"] == 1
