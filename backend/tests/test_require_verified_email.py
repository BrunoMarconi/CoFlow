from unittest.mock import patch

import pytest
from fastapi import HTTPException

from app.core.dependencies import require_verified_email


class _FakeUser:
    def __init__(self, is_email_verified: bool):
        self.is_email_verified = is_email_verified


def test_require_verified_email_allows_verified_user():
    user = _FakeUser(is_email_verified=True)

    with patch("app.core.dependencies.EMAIL_VERIFICATION_ENABLED", True):
        result = require_verified_email(current_user=user)

    assert result is user


def test_require_verified_email_blocks_unverified_user():
    user = _FakeUser(is_email_verified=False)

    with patch("app.core.dependencies.EMAIL_VERIFICATION_ENABLED", True):
        with pytest.raises(HTTPException) as exc_info:
            require_verified_email(current_user=user)

    assert exc_info.value.status_code == 403
    assert exc_info.value.detail["code"] == "EMAIL_NOT_VERIFIED"


def test_require_verified_email_bypasses_check_when_feature_disabled():
    # Con la feature flag EMAIL_VERIFICATION_ENABLED desactivada, incluso
    # un usuario no verificado debe poder continuar.
    user = _FakeUser(is_email_verified=False)

    with patch("app.core.dependencies.EMAIL_VERIFICATION_ENABLED", False):
        result = require_verified_email(current_user=user)

    assert result is user
