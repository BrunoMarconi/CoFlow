from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_verified_email
from app.database.models.user import User
from app.database.session import get_db
from app.schemas.bank_connection import (
    BankAccountSummaryResponse,
    BankConnectionCallbackRequest,
    BankConnectionCallbackResponse,
    BankConnectionStartResponse,
    BankConnectionSummaryResponse,
    BankConnectionSyncResponse,
)
from app.services.bank_connection_service import BankConnectionService

router = APIRouter()

bank_connection_service = BankConnectionService()


@router.post("/start", response_model=BankConnectionStartResponse)
def start_bank_connection(
    current_user: User = Depends(require_verified_email),
    db: Session = Depends(get_db),
):
    authorization_url, connection = bank_connection_service.start_connection(
        db=db,
        current_user=current_user,
    )

    return BankConnectionStartResponse(
        authorization_url=authorization_url,
        connection_id=connection.id,
    )


@router.post("/callback", response_model=BankConnectionCallbackResponse)
def submit_bank_connection_callback(
    data: BankConnectionCallbackRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    connection, accounts_found, transactions_found = (
        bank_connection_service.handle_callback(
            db=db,
            current_user=current_user,
            code=data.code,
            state=data.state,
        )
    )

    return BankConnectionCallbackResponse(
        status="connected",
        connection_id=connection.id,
        accounts_found=accounts_found,
        transactions_found=transactions_found,
    )


@router.post("/{connection_id}/sync", response_model=BankConnectionSyncResponse)
def sync_bank_connection(
    connection_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    connection, accounts_found, transactions_found = bank_connection_service.sync(
        db=db,
        current_user=current_user,
        connection_id=connection_id,
    )

    return BankConnectionSyncResponse(
        status="connected",
        connection_id=connection.id,
        accounts_found=accounts_found,
        transactions_found=transactions_found,
        last_synced_at=connection.last_synced_at,
    )


@router.get("/me", response_model=BankConnectionSummaryResponse)
def get_my_bank_connection(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    summary = bank_connection_service.get_summary(db=db, current_user=current_user)
    return BankConnectionSummaryResponse(**summary)


@router.get(
    "/{connection_id}/accounts",
    response_model=list[BankAccountSummaryResponse],
)
def get_bank_connection_accounts(
    connection_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return bank_connection_service.get_accounts(
        db=db,
        current_user=current_user,
        connection_id=connection_id,
    )


@router.delete("/{connection_id}", status_code=204)
def disconnect_bank_connection(
    connection_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bank_connection_service.disconnect(
        db=db,
        current_user=current_user,
        connection_id=connection_id,
    )
