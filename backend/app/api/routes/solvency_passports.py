from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_verified_email
from app.database.session import get_db
from app.database.models.user import User
from app.schemas.solvency_passport import SolvencyPassportResponse
from app.services.pdf.solvency_passport_pdf import build_passport_pdf
from app.services.solvency_passport_service import SolvencyPassportService

router = APIRouter()

solvency_passport_service = SolvencyPassportService()


def _to_response(passport) -> SolvencyPassportResponse:
    response = SolvencyPassportResponse.model_validate(passport)
    response.share_url = solvency_passport_service.get_share_url(passport)
    return response


@router.post("/issue", response_model=SolvencyPassportResponse)
def issue_solvency_passport(
    current_user: User = Depends(require_verified_email),
    db: Session = Depends(get_db),
):
    passport = solvency_passport_service.issue(db=db, current_user=current_user)
    return _to_response(passport)


@router.get("/me", response_model=SolvencyPassportResponse)
def get_my_solvency_passport(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    passport = solvency_passport_service.get_latest(db=db, current_user=current_user)

    if passport is None:
        raise HTTPException(status_code=404, detail="Todavía no hay ningún pasaporte.")

    return _to_response(passport)


@router.get("/{passport_id}", response_model=SolvencyPassportResponse)
def get_solvency_passport(
    passport_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    passport = solvency_passport_service.get_by_id(
        db=db, current_user=current_user, passport_id=passport_id
    )
    return _to_response(passport)


@router.post("/{passport_id}/revoke", response_model=SolvencyPassportResponse)
def revoke_solvency_passport(
    passport_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    passport = solvency_passport_service.revoke(
        db=db, current_user=current_user, passport_id=passport_id
    )
    return _to_response(passport)


@router.post(
    "/{passport_id}/regenerate-share-link", response_model=SolvencyPassportResponse
)
def regenerate_solvency_passport_share_link(
    passport_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    passport = solvency_passport_service.regenerate_share_link(
        db=db, current_user=current_user, passport_id=passport_id
    )
    return _to_response(passport)


@router.get("/{passport_id}/pdf")
def download_solvency_passport_pdf(
    passport_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    passport = solvency_passport_service.get_by_id(
        db=db, current_user=current_user, passport_id=passport_id
    )
    share_url = solvency_passport_service.get_share_url(passport)
    pdf_bytes = build_passport_pdf(passport, share_url)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Cache-Control": "no-store",
            "Content-Disposition": f'attachment; filename="{passport.public_id}.pdf"',
        },
    )
