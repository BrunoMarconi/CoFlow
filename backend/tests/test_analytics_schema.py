import uuid

import pytest
from pydantic import ValidationError

from app.schemas.analytics import ProductEventCreate


def _event(**overrides):
    data = {
        "event_id": uuid.uuid4(),
        "session_id": uuid.uuid4(),
        "name": "page_view",
        "path": "/personas/:id",
        "source": "web",
    }
    data.update(overrides)
    return data


def test_accepts_minimized_product_event():
    event = ProductEventCreate.model_validate(_event())
    assert event.name == "page_view"
    assert event.path == "/personas/:id"


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("name", "message_content_captured"),
        ("path", "https://example.com/private"),
        ("source", "advertising-network"),
    ],
)
def test_rejects_unapproved_analytics_values(field, value):
    with pytest.raises(ValidationError):
        ProductEventCreate.model_validate(_event(**{field: value}))
