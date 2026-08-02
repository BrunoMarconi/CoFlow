"""Cliente para la Data API v1 de TrueLayer (flujo OAuth clásico).

Se usa Data API v1 y no v3 ("Data Connections") porque v3 solo está
disponible para Reino Unido y funciona con un modelo asíncrono basado en
webhooks + client_credentials, sin redirección del usuario al flujo
hospedado de TrueLayer. El flujo que necesita CoFlow (usuario elige banco
en una pantalla de TrueLayer, vuelve con un `code`, el backend lo
intercambia y lee cuentas/saldos/transacciones) es exactamente el flujo
clásico de Data API v1: auth.truelayer(-sandbox).com para autorización y
/connect/token para el intercambio, api.truelayer(-sandbox).com/data/v1/*
para los datos.

No se llama a este cliente desde las rutas directamente: solo desde
BankConnectionService.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from urllib.parse import urlencode

import httpx

from app.core.config import (
    TRUELAYER_API_BASE_URL,
    TRUELAYER_AUTH_BASE_URL,
    TRUELAYER_CLIENT_ID,
    TRUELAYER_CLIENT_SECRET,
    TRUELAYER_REDIRECT_URI,
)

SCOPES = "info accounts balance transactions offline_access"
REQUEST_TIMEOUT_SECONDS = 15.0


class TrueLayerError(Exception):
    """Error traducido de una respuesta de TrueLayer.

    `reason` es un código interno estable (no el texto crudo de
    TrueLayer) que las capas superiores pueden mapear a un mensaje de
    usuario sin filtrar detalles internos.
    """

    def __init__(self, reason: str, status_code: int | None = None):
        self.reason = reason
        self.status_code = status_code
        super().__init__(reason)


@dataclass
class TrueLayerTokens:
    access_token: str
    refresh_token: str | None
    expires_in: int


def _require_credentials() -> None:
    if not TRUELAYER_CLIENT_ID or not TRUELAYER_CLIENT_SECRET or not TRUELAYER_REDIRECT_URI:
        raise RuntimeError(
            "TRUELAYER_CLIENT_ID, TRUELAYER_CLIENT_SECRET y "
            "TRUELAYER_REDIRECT_URI son variables de entorno obligatorias "
            "para usar TrueLayer. Defínelas en backend/.env (desarrollo) "
            "o en las variables de entorno del servicio (despliegue)."
        )


class TrueLayerClient:
    def __init__(self) -> None:
        _require_credentials()
        self._http = httpx.Client(timeout=REQUEST_TIMEOUT_SECONDS)

    def close(self) -> None:
        self._http.close()

    def __enter__(self) -> "TrueLayerClient":
        return self

    def __exit__(self, *_exc_info: object) -> None:
        self.close()

    def build_authorization_url(self, state: str) -> str:
        params = {
            "response_type": "code",
            "client_id": TRUELAYER_CLIENT_ID,
            "redirect_uri": TRUELAYER_REDIRECT_URI,
            "scope": SCOPES,
            "providers": "uk-cs-mock uk-ob-all uk-oauth-all",
            "state": state,
        }
        return f"{TRUELAYER_AUTH_BASE_URL}/?{urlencode(params)}"

    def exchange_code(self, code: str) -> TrueLayerTokens:
        return self._request_token(
            {
                "grant_type": "authorization_code",
                "client_id": TRUELAYER_CLIENT_ID,
                "client_secret": TRUELAYER_CLIENT_SECRET,
                "redirect_uri": TRUELAYER_REDIRECT_URI,
                "code": code,
            }
        )

    def refresh_token(self, refresh_token: str) -> TrueLayerTokens:
        return self._request_token(
            {
                "grant_type": "refresh_token",
                "client_id": TRUELAYER_CLIENT_ID,
                "client_secret": TRUELAYER_CLIENT_SECRET,
                "refresh_token": refresh_token,
            }
        )

    def _request_token(self, data: dict[str, str]) -> TrueLayerTokens:
        try:
            response = self._http.post(
                f"{TRUELAYER_AUTH_BASE_URL}/connect/token",
                data=data,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
        except httpx.TimeoutException as exc:
            raise TrueLayerError("timeout") from exc
        except httpx.HTTPError as exc:
            raise TrueLayerError("network_error") from exc

        if response.status_code == 400:
            raise TrueLayerError("code_invalid_or_expired", response.status_code)

        if response.status_code in (401, 403):
            raise TrueLayerError("invalid_credentials", response.status_code)

        if response.status_code >= 500:
            raise TrueLayerError("provider_unavailable", response.status_code)

        if response.status_code != 200:
            raise TrueLayerError("unknown_error", response.status_code)

        payload = response.json()
        return TrueLayerTokens(
            access_token=payload["access_token"],
            refresh_token=payload.get("refresh_token"),
            expires_in=payload["expires_in"],
        )

    def _get(self, path: str, access_token: str) -> dict:
        try:
            response = self._http.get(
                f"{TRUELAYER_API_BASE_URL}{path}",
                headers={"Authorization": f"Bearer {access_token}"},
            )
        except httpx.TimeoutException as exc:
            raise TrueLayerError("timeout") from exc
        except httpx.HTTPError as exc:
            raise TrueLayerError("network_error") from exc

        if response.status_code in (401, 403):
            raise TrueLayerError("consent_revoked", response.status_code)

        if response.status_code >= 500:
            raise TrueLayerError("provider_unavailable", response.status_code)

        if response.status_code != 200:
            raise TrueLayerError("unknown_error", response.status_code)

        return response.json()

    def get_accounts(self, access_token: str) -> list[dict]:
        return self._get("/data/v1/accounts", access_token).get("results", [])

    def get_balance(self, access_token: str, account_id: str) -> dict | None:
        results = self._get(
            f"/data/v1/accounts/{account_id}/balance", access_token
        ).get("results", [])
        return results[0] if results else None

    def get_transactions(
        self,
        access_token: str,
        account_id: str,
        from_date: date,
        to_date: date,
    ) -> list[dict]:
        query = urlencode(
            {
                "from": from_date.isoformat(),
                "to": to_date.isoformat(),
            }
        )
        return self._get(
            f"/data/v1/accounts/{account_id}/transactions?{query}", access_token
        ).get("results", [])
