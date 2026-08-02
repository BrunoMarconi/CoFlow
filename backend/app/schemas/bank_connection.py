from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.database.models.bank_connection import BankConnectionStatus


class BankConnectionStartResponse(BaseModel):
    authorization_url: str
    connection_id: UUID


class BankConnectionCallbackRequest(BaseModel):
    code: str
    state: str


class BankConnectionCallbackResponse(BaseModel):
    status: str
    connection_id: UUID
    accounts_found: int
    transactions_found: int


class BankConnectionSyncResponse(BaseModel):
    status: str
    connection_id: UUID
    accounts_found: int
    transactions_found: int
    last_synced_at: datetime | None


class BankConnectionSummaryResponse(BaseModel):
    """Resumen no sensible de la conexión. Nunca incluye tokens ni state."""

    model_config = ConfigDict(from_attributes=True)

    connected: bool
    connection_id: UUID | None = None
    provider_name: str | None = None
    status: BankConnectionStatus | None = None
    connected_at: datetime | None = None
    last_synced_at: datetime | None = None
    consent_expires_at: datetime | None = None
    accounts_count: int = 0
    transactions_count: int = 0


class BankAccountSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    external_account_id: str
    account_type: str | None = None
    display_name: str | None = None
    currency: str
    current_balance: float | None = None
    available_balance: float | None = None
    collected_at: datetime
