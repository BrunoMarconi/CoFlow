from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.solvency_passport import (
    LEGAL_NOTICE,
    SANDBOX_NOTICE,
    PublicSolvencyPassportResponse,
)
from app.services.solvency_passport_service import SolvencyPassportService

router = APIRouter()

solvency_passport_service = SolvencyPassportService()

# Ver app/core/passport_tokens.py: el token nunca se guarda, se recalcula
# y se compara con secrets.compare_digest. public_id o token incorrectos
# devuelven exactamente el mismo 404 genérico (SolvencyPassportService
# ya no distingue los dos casos de error).
_SECURITY_HEADERS = {
    "Cache-Control": "no-store",
    "Referrer-Policy": "no-referrer",
    "X-Robots-Tag": "noindex, nofollow",
}


@router.get(
    "/{public_id}",
    response_model=PublicSolvencyPassportResponse,
)
def get_public_solvency_passport(
    public_id: str,
    response: Response,
    token: str = Query(...),
    db: Session = Depends(get_db),
):
    for key, value in _SECURITY_HEADERS.items():
        response.headers[key] = value

    passport = solvency_passport_service.get_public(
        db=db, public_id=public_id, token=token
    )

    return PublicSolvencyPassportResponse(
        public_id=passport.public_id,
        status=passport.status,
        holder_initials=passport.holder_initials,
        issued_at=passport.issued_at,
        expires_at=passport.expires_at,
        is_sandbox=passport.is_sandbox,
        currency=passport.currency,
        analysis_period_start=passport.analysis_period_start,
        analysis_period_end=passport.analysis_period_end,
        months_analyzed=passport.months_analyzed,
        recommended_rent_capacity=passport.recommended_rent_capacity,
        income_stability=passport.income_stability,
        confidence_level=passport.confidence_level,
        algorithm_version=passport.algorithm_version,
        legal_notice=LEGAL_NOTICE,
        sandbox_notice=SANDBOX_NOTICE if passport.is_sandbox else None,
    )
