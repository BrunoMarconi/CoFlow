"""Alta asistida: disponible en toda la provincia de Málaga, no solo en la
capital. Decide el código postal (29xxx) y, si no lo hay, el nombre de
provincia; sin ubicación no se bloquea porque se completa antes de publicar."""

from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.core.dependencies import require_team_member
from app.database.session import get_db
from app.main import app


def _payload(email: str, location: dict) -> dict:
    return {
        "owner": {
            "first_name": "Laura",
            "last_name": "Propietaria",
            "email": email,
            "phone": "+34600111222",
        },
        "property": {
            "title": "Piso de prueba",
            "description": "Descripción de prueba.",
            "property_type": "APARTMENT",
            "address_line": "Calle Prueba 1",
            "bedrooms": 2,
            "bathrooms": 1,
            "has_elevator": False,
            "furnished": False,
            "max_tenants": 2,
            "total_monthly_rent": 700,
            "deposit": 700,
            "utilities_included": False,
            "available_from": "2026-10-01",
            "amenity_ids": [],
            **location,
        },
        "owner_consent": True,
    }


@pytest.mark.parametrize(
    ("case", "location", "expected_status"),
    [
        ("capital", {"city": "Málaga", "province": "Málaga", "postal_code": "29001"}, 200),
        ("otro_municipio", {"city": "Marbella", "province": "Málaga", "postal_code": "29601"}, 200),
        # El geocodificador puede guardar la comunidad como provincia: el
        # código postal sigue identificándola como Málaga.
        ("provincia_como_comunidad", {"city": "Vélez-Málaga", "province": "Andalucía", "postal_code": "29700"}, 200),
        ("sin_codigo_postal", {"city": "Nerja", "province": "Málaga"}, 200),
        ("sin_ubicacion", {}, 200),
        ("fuera_por_codigo_postal", {"city": "Sevilla", "province": "Sevilla", "postal_code": "41001"}, 422),
        ("fuera_por_provincia", {"city": "Granada", "province": "Granada"}, 422),
    ],
)
def test_assisted_listing_accepts_whole_malaga_province(db_session, make_user, case, location, expected_status):
    admin = make_user(f"province_admin_{case}")
    admin.role = "ADMIN"
    db_session.commit()

    app.dependency_overrides[get_db] = lambda: db_session
    app.dependency_overrides[require_team_member] = lambda: admin
    client = TestClient(app)

    try:
        with patch("app.api.routes.assisted_listings.send_owner_claim_email"):
            response = client.post("/assisted-listings", json=_payload(f"province-{case}@example.com", location))
        assert response.status_code == expected_status, response.text
    finally:
        app.dependency_overrides.clear()
