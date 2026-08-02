import hashlib
import secrets
from datetime import date, datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.token_encryption import decrypt_token, encrypt_token
from app.database.models.bank_account_snapshot import BankAccountSnapshot
from app.database.models.bank_auth_state import BankAuthState
from app.database.models.bank_connection import BankConnection, BankConnectionStatus
from app.database.models.bank_transaction_snapshot import BankTransactionSnapshot
from app.database.models.user import User
from app.services.truelayer_client import TrueLayerClient, TrueLayerError

STATE_TTL_MINUTES = 10
TRANSACTIONS_LOOKBACK_DAYS = 90
MAX_DESCRIPTION_LENGTH = 500
TOKEN_REFRESH_MARGIN = timedelta(minutes=2)

ERROR_MESSAGES = {
    "state_missing": (
        "No se encontró la solicitud de conexión. Vuelve a intentarlo "
        "desde el principio."
    ),
    "state_expired": "La conexión ha caducado. Vuelve a intentarlo.",
    "state_used": (
        "Este enlace de conexión ya se usó. Vuelve a intentarlo desde el "
        "principio."
    ),
    "state_mismatch": "No se pudo verificar la conexión. Vuelve a intentarlo.",
    "code_invalid_or_expired": (
        "El código de autorización expiró o ya se usó. Vuelve a intentarlo."
    ),
    "invalid_credentials": "No se pudo conectar con el banco: credenciales inválidas.",
    "consent_revoked": "El consentimiento con tu banco ha sido revocado o ha expirado.",
    "provider_unavailable": "El banco no está disponible en este momento. Inténtalo más tarde.",
    "timeout": "La conexión con el banco ha tardado demasiado. Inténtalo de nuevo.",
    "network_error": "Hubo un problema de red al conectar con el banco. Inténtalo de nuevo.",
    "unknown_error": "No se pudo completar la conexión con el banco.",
    "no_token": "La conexión no tiene un token válido. Vuelve a conectar tu banco.",
}


def _hash_state(state: str) -> str:
    return hashlib.sha256(state.encode()).hexdigest()


def _sanitize_description(raw: str | None) -> str:
    if not raw:
        return ""
    cleaned = "".join(ch for ch in raw if ch.isprintable())
    return cleaned.strip()[:MAX_DESCRIPTION_LENGTH]


def _parse_timestamp(raw: str) -> datetime:
    return datetime.fromisoformat(raw.replace("Z", "+00:00"))


class BankConnectionService:
    def start_connection(
        self, db: Session, current_user: User
    ) -> tuple[str, BankConnection]:
        state = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=STATE_TTL_MINUTES)

        connection = (
            db.query(BankConnection)
            .filter(BankConnection.user_id == current_user.id)
            .first()
        )

        if connection is None:
            connection = BankConnection(
                user_id=current_user.id,
                status=BankConnectionStatus.PENDING,
            )
            db.add(connection)
        else:
            connection.status = BankConnectionStatus.PENDING

        db.add(
            BankAuthState(
                user_id=current_user.id,
                state_hash=_hash_state(state),
                expires_at=expires_at,
            )
        )

        try:
            db.commit()
            db.refresh(connection)
        except Exception:
            db.rollback()
            raise

        with TrueLayerClient() as client:
            authorization_url = client.build_authorization_url(state)

        return authorization_url, connection

    def handle_callback(
        self, db: Session, current_user: User, code: str, state: str
    ) -> tuple[BankConnection, int, int]:
        self._consume_state(db, current_user, state)

        connection = (
            db.query(BankConnection)
            .filter(BankConnection.user_id == current_user.id)
            .first()
        )
        if connection is None:
            raise HTTPException(
                status_code=404, detail="No se encontró la conexión bancaria."
            )

        with TrueLayerClient() as client:
            try:
                tokens = client.exchange_code(code)
                accounts_found, transactions_found, provider_name = (
                    self._fetch_and_store(db, client, connection, tokens.access_token)
                )
            except TrueLayerError as exc:
                db.rollback()
                connection.status = BankConnectionStatus.FAILED
                db.commit()
                raise HTTPException(
                    status_code=502,
                    detail=ERROR_MESSAGES.get(exc.reason, ERROR_MESSAGES["unknown_error"]),
                )
            except Exception:
                db.rollback()
                raise

        now = datetime.now(timezone.utc)
        connection.provider_name = provider_name or connection.provider_name
        connection.status = BankConnectionStatus.CONNECTED
        connection.access_token_encrypted = encrypt_token(tokens.access_token)
        connection.refresh_token_encrypted = (
            encrypt_token(tokens.refresh_token) if tokens.refresh_token else None
        )
        connection.token_expires_at = now + timedelta(seconds=tokens.expires_in)
        connection.connected_at = now
        connection.last_synced_at = now

        try:
            db.commit()
            db.refresh(connection)
        except Exception:
            db.rollback()
            raise

        return connection, accounts_found, transactions_found

    def sync(
        self, db: Session, current_user: User, connection_id: str
    ) -> tuple[BankConnection, int, int]:
        connection = self._get_owned_connection(db, current_user, connection_id)

        if not connection.access_token_encrypted:
            raise HTTPException(status_code=400, detail=ERROR_MESSAGES["no_token"])

        access_token = decrypt_token(connection.access_token_encrypted)
        now = datetime.now(timezone.utc)

        with TrueLayerClient() as client:
            needs_refresh = (
                connection.refresh_token_encrypted
                and connection.token_expires_at is not None
                and connection.token_expires_at <= now + TOKEN_REFRESH_MARGIN
            )

            if needs_refresh:
                try:
                    tokens = client.refresh_token(
                        decrypt_token(connection.refresh_token_encrypted)
                    )
                except TrueLayerError as exc:
                    db.rollback()
                    connection.status = (
                        BankConnectionStatus.REVOKED
                        if exc.reason in ("consent_revoked", "invalid_credentials")
                        else BankConnectionStatus.EXPIRED
                    )
                    db.commit()
                    raise HTTPException(
                        status_code=502,
                        detail=ERROR_MESSAGES.get(
                            exc.reason, ERROR_MESSAGES["unknown_error"]
                        ),
                    )

                access_token = tokens.access_token
                connection.access_token_encrypted = encrypt_token(tokens.access_token)
                if tokens.refresh_token:
                    connection.refresh_token_encrypted = encrypt_token(
                        tokens.refresh_token
                    )
                connection.token_expires_at = now + timedelta(
                    seconds=tokens.expires_in
                )

            try:
                accounts_found, transactions_found, provider_name = (
                    self._fetch_and_store(db, client, connection, access_token)
                )
            except TrueLayerError as exc:
                db.rollback()
                connection.status = (
                    BankConnectionStatus.REVOKED
                    if exc.reason == "consent_revoked"
                    else BankConnectionStatus.EXPIRED
                )
                db.commit()
                raise HTTPException(
                    status_code=502,
                    detail=ERROR_MESSAGES.get(exc.reason, ERROR_MESSAGES["unknown_error"]),
                )
            except Exception:
                db.rollback()
                raise

        connection.last_synced_at = now
        if provider_name:
            connection.provider_name = provider_name
        connection.status = BankConnectionStatus.CONNECTED

        try:
            db.commit()
            db.refresh(connection)
        except Exception:
            db.rollback()
            raise

        return connection, accounts_found, transactions_found

    def get_summary(self, db: Session, current_user: User) -> dict:
        connection = (
            db.query(BankConnection)
            .filter(BankConnection.user_id == current_user.id)
            .first()
        )

        if connection is None:
            return {"connected": False}

        accounts_count = (
            db.query(BankAccountSnapshot)
            .filter(BankAccountSnapshot.bank_connection_id == connection.id)
            .count()
        )
        transactions_count = (
            db.query(BankTransactionSnapshot)
            .filter(BankTransactionSnapshot.bank_connection_id == connection.id)
            .count()
        )

        return {
            "connected": connection.status == BankConnectionStatus.CONNECTED,
            "connection_id": connection.id,
            "provider_name": connection.provider_name,
            "status": connection.status,
            "connected_at": connection.connected_at,
            "last_synced_at": connection.last_synced_at,
            "consent_expires_at": connection.consent_expires_at,
            "accounts_count": accounts_count,
            "transactions_count": transactions_count,
        }

    def get_accounts(
        self, db: Session, current_user: User, connection_id: str
    ) -> list[BankAccountSnapshot]:
        connection = self._get_owned_connection(db, current_user, connection_id)
        return (
            db.query(BankAccountSnapshot)
            .filter(BankAccountSnapshot.bank_connection_id == connection.id)
            .all()
        )

    def disconnect(
        self, db: Session, current_user: User, connection_id: str
    ) -> None:
        connection = self._get_owned_connection(db, current_user, connection_id)

        db.query(BankTransactionSnapshot).filter(
            BankTransactionSnapshot.bank_connection_id == connection.id
        ).delete()
        db.query(BankAccountSnapshot).filter(
            BankAccountSnapshot.bank_connection_id == connection.id
        ).delete()

        connection.access_token_encrypted = None
        connection.refresh_token_encrypted = None
        connection.token_expires_at = None
        connection.status = BankConnectionStatus.REVOKED
        connection.disconnected_at = datetime.now(timezone.utc)

        # TrueLayer Data API v1 no ofrece un endpoint de revocación
        # server-side estándar equivalente al de v3: la desconexión aquí
        # es local (borramos nuestros tokens y snapshots). El consentimiento
        # del lado del banco solo se revoca si el usuario lo hace desde su
        # banco o desde el panel de TrueLayer. Limitación documentada.

        try:
            db.commit()
        except Exception:
            db.rollback()
            raise

    def _consume_state(
        self, db: Session, current_user: User, state: str
    ) -> BankAuthState:
        auth_state = (
            db.query(BankAuthState)
            .filter(BankAuthState.state_hash == _hash_state(state))
            .first()
        )

        if auth_state is None:
            raise HTTPException(
                status_code=400, detail=ERROR_MESSAGES["state_missing"]
            )

        if auth_state.user_id != current_user.id:
            raise HTTPException(
                status_code=403, detail=ERROR_MESSAGES["state_mismatch"]
            )

        if auth_state.used_at is not None:
            raise HTTPException(status_code=400, detail=ERROR_MESSAGES["state_used"])

        if auth_state.expires_at < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=400, detail=ERROR_MESSAGES["state_expired"]
            )

        auth_state.used_at = datetime.now(timezone.utc)

        try:
            db.commit()
        except Exception:
            db.rollback()
            raise

        return auth_state

    def _get_owned_connection(
        self, db: Session, current_user: User, connection_id: str
    ) -> BankConnection:
        connection = (
            db.query(BankConnection)
            .filter(BankConnection.id == connection_id)
            .first()
        )

        if connection is None:
            raise HTTPException(status_code=404, detail="Conexión no encontrada.")

        if connection.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Conexión no encontrada.")

        return connection

    def _fetch_and_store(
        self,
        db: Session,
        client: TrueLayerClient,
        connection: BankConnection,
        access_token: str,
    ) -> tuple[int, int, str | None]:
        collected_at = datetime.now(timezone.utc)
        from_date = collected_at.date() - timedelta(days=TRANSACTIONS_LOOKBACK_DAYS)
        to_date: date = collected_at.date()

        accounts_data = client.get_accounts(access_token)

        db.query(BankTransactionSnapshot).filter(
            BankTransactionSnapshot.bank_connection_id == connection.id
        ).delete()
        db.query(BankAccountSnapshot).filter(
            BankAccountSnapshot.bank_connection_id == connection.id
        ).delete()

        provider_name: str | None = None
        accounts_found = 0
        transactions_found = 0

        for account in accounts_data:
            external_account_id = account["account_id"]
            provider = account.get("provider") or {}
            provider_name = provider.get("display_name") or provider_name

            balance = client.get_balance(access_token, external_account_id) or {}

            db.add(
                BankAccountSnapshot(
                    bank_connection_id=connection.id,
                    external_account_id=external_account_id,
                    account_type=account.get("account_type"),
                    display_name=account.get("display_name"),
                    currency=account.get("currency", "GBP"),
                    current_balance=balance.get("current"),
                    available_balance=balance.get("available"),
                    collected_at=collected_at,
                )
            )
            accounts_found += 1

            transactions = client.get_transactions(
                access_token, external_account_id, from_date, to_date
            )

            seen_external_ids: set[str] = set()
            for txn in transactions:
                external_transaction_id = txn.get("transaction_id")
                if not external_transaction_id or external_transaction_id in seen_external_ids:
                    continue
                seen_external_ids.add(external_transaction_id)

                db.add(
                    BankTransactionSnapshot(
                        bank_connection_id=connection.id,
                        external_account_id=external_account_id,
                        external_transaction_id=external_transaction_id,
                        amount=txn.get("amount", 0),
                        currency=txn.get("currency", "GBP"),
                        description=_sanitize_description(txn.get("description")),
                        transaction_type=txn.get("transaction_type"),
                        category=txn.get("transaction_category"),
                        occurred_at=_parse_timestamp(txn["timestamp"]),
                        is_pending=False,
                    )
                )
                transactions_found += 1

        return accounts_found, transactions_found, provider_name
