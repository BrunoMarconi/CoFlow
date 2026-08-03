from datetime import datetime, timedelta, timezone

import pytest
from fastapi import HTTPException

from app.core.passport_tokens import compute_share_token, verify_share_token
from app.database.models.financial_analysis import FinancialAnalysisStatus
from app.database.models.solvency_passport import SolvencyPassportStatus
from app.services.solvency_passport_service import SolvencyPassportService

service = SolvencyPassportService()


def test_issue_creates_passport_snapshot(db_session, make_user, make_completed_analysis):
    user = make_user("issue")
    analysis = make_completed_analysis(user)

    passport = service.issue(db_session, user)

    assert passport.status == SolvencyPassportStatus.ISSUED
    assert passport.financial_analysis_id == analysis.id
    assert passport.recurring_monthly_income == analysis.recurring_monthly_income
    assert passport.months_analyzed == analysis.months_analyzed
    assert passport.public_id.startswith("SP-")
    # Comparación en segundos (no en delta de reloj local) para no
    # depender de cambios de horario de verano/invierno entre las dos
    # fechas al recuperarlas de Postgres con zona horaria local.
    delta_seconds = (passport.expires_at - passport.issued_at).total_seconds()
    assert delta_seconds == pytest.approx(timedelta(days=90).total_seconds(), abs=3600)


def test_issue_does_not_duplicate_for_same_analysis(
    db_session, make_user, make_completed_analysis
):
    user = make_user("dup")
    make_completed_analysis(user)

    first = service.issue(db_session, user)
    second = service.issue(db_session, user)

    assert first.id == second.id
    assert first.public_id == second.public_id


def test_issue_rejects_without_completed_analysis(db_session, make_user):
    user = make_user("noanalysis")

    with pytest.raises(HTTPException) as exc_info:
        service.issue(db_session, user)

    assert exc_info.value.status_code == 400


def test_issue_rejects_outdated_analysis(db_session, make_user, make_completed_analysis):
    user = make_user("outdated")
    make_completed_analysis(user, status=FinancialAnalysisStatus.OUTDATED)

    with pytest.raises(HTTPException) as exc_info:
        service.issue(db_session, user)

    assert exc_info.value.status_code == 400


def test_issue_rejects_fewer_than_three_months(
    db_session, make_user, make_completed_analysis
):
    user = make_user("fewmonths")
    make_completed_analysis(user, months_analyzed=2)

    with pytest.raises(HTTPException) as exc_info:
        service.issue(db_session, user)

    assert exc_info.value.status_code == 400


def test_snapshot_does_not_change_when_analysis_changes_later(
    db_session, make_user, make_completed_analysis
):
    user = make_user("snapshot")
    analysis = make_completed_analysis(user)

    passport = service.issue(db_session, user)
    original_income = passport.recurring_monthly_income

    analysis.recurring_monthly_income = original_income + 999
    db_session.commit()

    refreshed = service.get_by_id(db_session, user, str(passport.id))
    assert refreshed.recurring_monthly_income == original_income


def test_passport_expires_when_past_expiry_date(
    db_session, make_user, make_completed_analysis
):
    user = make_user("expiry")
    make_completed_analysis(user)
    passport = service.issue(db_session, user)

    passport.expires_at = datetime.now(timezone.utc) - timedelta(days=1)
    db_session.commit()

    refreshed = service.get_by_id(db_session, user, str(passport.id))
    assert refreshed.status == SolvencyPassportStatus.EXPIRED


def test_revoke_marks_passport_revoked(db_session, make_user, make_completed_analysis):
    user = make_user("revoke")
    make_completed_analysis(user)
    passport = service.issue(db_session, user)

    revoked = service.revoke(db_session, user, str(passport.id))

    assert revoked.status == SolvencyPassportStatus.REVOKED
    assert revoked.revoked_at is not None

    with pytest.raises(HTTPException):
        service.revoke(db_session, user, str(passport.id))


def test_regenerate_share_link_invalidates_previous_token(
    db_session, make_user, make_completed_analysis
):
    user = make_user("regen")
    make_completed_analysis(user)
    passport = service.issue(db_session, user)

    old_token = compute_share_token(
        str(passport.id), passport.share_nonce, passport.share_token_version
    )

    service.regenerate_share_link(db_session, user, str(passport.id))
    db_session.refresh(passport)

    assert not verify_share_token(
        old_token, str(passport.id), passport.share_nonce, passport.share_token_version
    )

    new_token = compute_share_token(
        str(passport.id), passport.share_nonce, passport.share_token_version
    )
    assert verify_share_token(
        new_token, str(passport.id), passport.share_nonce, passport.share_token_version
    )


def test_get_public_rejects_wrong_token(db_session, make_user, make_completed_analysis):
    user = make_user("publicwrong")
    make_completed_analysis(user)
    passport = service.issue(db_session, user)

    with pytest.raises(HTTPException) as exc_info:
        service.get_public(db_session, passport.public_id, "not-the-right-token")

    assert exc_info.value.status_code == 404


def test_get_public_rejects_unknown_public_id(db_session):
    with pytest.raises(HTTPException) as exc_info:
        service.get_public(db_session, "SP-DOESNOTEXIST", "irrelevant")

    assert exc_info.value.status_code == 404


def test_get_public_succeeds_with_correct_token(
    db_session, make_user, make_completed_analysis
):
    user = make_user("publicok")
    make_completed_analysis(user)
    passport = service.issue(db_session, user)

    share_url = service.get_share_url(passport)
    token = share_url.split("token=")[1]

    result = service.get_public(db_session, passport.public_id, token)
    assert result.id == passport.id


def test_get_by_id_is_not_accessible_by_other_user(
    db_session, make_user, make_completed_analysis
):
    owner = make_user("owner")
    other = make_user("other")
    make_completed_analysis(owner)
    passport = service.issue(db_session, owner)

    with pytest.raises(HTTPException) as exc_info:
        service.get_by_id(db_session, other, str(passport.id))

    assert exc_info.value.status_code == 404
