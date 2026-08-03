import re

from app.core.passport_tokens import (
    build_share_url,
    compute_share_token,
    generate_public_id,
    generate_share_nonce,
    verify_share_token,
)

_PUBLIC_ID_RE = re.compile(r"^SP-[0-9A-F]{12}$")


def test_generate_public_id_is_readable_and_non_sequential():
    ids = {generate_public_id() for _ in range(20)}

    assert len(ids) == 20  # ninguna colisión en 20 intentos
    for public_id in ids:
        assert _PUBLIC_ID_RE.match(public_id)


def test_compute_share_token_is_deterministic():
    nonce = generate_share_nonce()
    token_a = compute_share_token("passport-1", nonce, 1)
    token_b = compute_share_token("passport-1", nonce, 1)

    assert token_a == token_b
    assert len(token_a) == 64  # hexdigest de sha256


def test_verify_share_token_accepts_correct_and_rejects_variations():
    nonce = generate_share_nonce()
    token = compute_share_token("passport-1", nonce, 1)

    assert verify_share_token(token, "passport-1", nonce, 1) is True

    # Cualquier variación (nonce, versión o id de pasaporte distintos)
    # invalida el token.
    assert verify_share_token(token, "passport-2", nonce, 1) is False
    assert verify_share_token(token, "passport-1", generate_share_nonce(), 1) is False
    assert verify_share_token(token, "passport-1", nonce, 2) is False
    assert verify_share_token("not-the-token", "passport-1", nonce, 1) is False
    assert verify_share_token("", "passport-1", nonce, 1) is False


def test_regenerating_nonce_changes_the_resulting_token():
    old_nonce = generate_share_nonce()
    new_nonce = generate_share_nonce()

    old_token = compute_share_token("passport-1", old_nonce, 1)
    new_token = compute_share_token("passport-1", new_nonce, 1)

    assert old_token != new_token
    assert verify_share_token(old_token, "passport-1", new_nonce, 1) is False


def test_build_share_url_includes_public_id_and_token():
    url = build_share_url("SP-ABC123", "sometoken")

    assert "/verificar/pasaporte/SP-ABC123" in url
    assert "token=sometoken" in url
