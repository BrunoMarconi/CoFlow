from datetime import date
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.core.dependencies import require_admin
from app.database.models.property import PropertyStatus
from app.database.models.user import User
from app.database.session import get_db
from app.main import app


def test_admin_can_create_draft_and_owner_can_claim(db_session, make_user):
    admin = make_user("assisted_admin")
    admin.role = "ADMIN"
    db_session.commit()

    app.dependency_overrides[get_db] = lambda: db_session
    app.dependency_overrides[require_admin] = lambda: admin
    client = TestClient(app)

    payload = {
        "owner": {
            "first_name": "Laura",
            "last_name": "Propietaria",
            "email": "owner-claim-test@example.com",
            "phone": "+34600111222",
        },
        "property": {
            "title": "Habitación luminosa en Málaga",
            "description": "Habitación exterior y amueblada cerca del centro de Málaga.",
            "property_type": "SHARED_APARTMENT",
            "address_line": "Calle Prueba 1",
            "city": "Málaga",
            "province": "Málaga",
            "postal_code": "29001",
            "bedrooms": 2,
            "bathrooms": 1,
            "has_elevator": True,
            "furnished": True,
            "max_tenants": 2,
            "total_monthly_rent": 550,
            "deposit": 550,
            "utilities_included": False,
            "available_from": "2026-09-01",
            "amenity_ids": [],
        },
        "owner_consent": True,
    }

    try:
        with patch("app.api.routes.assisted_listings.send_owner_claim_email"):
            created = client.post("/assisted-listings", json=payload)
        assert created.status_code == 200
        body = created.json()
        token = body["claim_url"].rsplit("/", 1)[-1]

        preview = client.get(f"/assisted-listings/claim/{token}")
        assert preview.status_code == 200
        assert preview.json()["property_title"] == payload["property"]["title"]

        claimed = client.post(
            f"/assisted-listings/claim/{token}",
            json={
                "password": "secure-password-123",
                "birth_date": date(1985, 6, 2).isoformat(),
                "terms_accepted": True,
            },
        )
        assert claimed.status_code == 200

        owner = db_session.query(User).filter(User.email == payload["owner"]["email"]).one()
        assert owner.is_email_verified is True
        assert owner.owner_profile.properties[0].status == PropertyStatus.DRAFT

        reused = client.get(f"/assisted-listings/claim/{token}")
        assert reused.status_code == 404
    finally:
        app.dependency_overrides.clear()
