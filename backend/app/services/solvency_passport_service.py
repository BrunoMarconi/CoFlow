from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import TRUELAYER_ENVIRONMENT
from app.core.passport_tokens import (
    build_share_url,
    compute_share_token,
    generate_public_id,
    generate_share_nonce,
    verify_share_token,
)
from app.database.models.financial_analysis import (
    FinancialAnalysis,
    FinancialAnalysisStatus,
)
from app.database.models.solvency_passport import (
    SolvencyPassport,
    SolvencyPassportStatus,
)
from app.database.models.user import User

PASSPORT_VALIDITY_DAYS = 90
MIN_MONTHS_REQUIRED = 3
MAX_PUBLIC_ID_ATTEMPTS = 5


def _initials(user: User) -> str:
    first = (user.first_name or "").strip()
    last = (user.last_name or "").strip()
    parts = [p[0].upper() for p in (first, last) if p]
    return ". ".join(parts) + "." if parts else "—"


class SolvencyPassportService:
    def issue(self, db: Session, current_user: User) -> SolvencyPassport:
        analysis = (
            db.query(FinancialAnalysis)
            .filter(FinancialAnalysis.user_id == current_user.id)
            .order_by(FinancialAnalysis.created_at.desc())
            .first()
        )

        if analysis is None or analysis.status != FinancialAnalysisStatus.COMPLETED:
            raise HTTPException(
                status_code=400,
                detail="Necesitas un análisis financiero completado para emitir un pasaporte.",
            )

        if analysis.months_analyzed < MIN_MONTHS_REQUIRED:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"El análisis solo cubre {analysis.months_analyzed} mes(es). "
                    f"Se necesitan al menos {MIN_MONTHS_REQUIRED} para emitir un pasaporte."
                ),
            )

        now = datetime.now(timezone.utc)

        existing = (
            db.query(SolvencyPassport)
            .filter(SolvencyPassport.financial_analysis_id == analysis.id)
            .filter(SolvencyPassport.status == SolvencyPassportStatus.ISSUED)
            .filter(SolvencyPassport.expires_at > now)
            .first()
        )
        if existing is not None:
            return existing

        passport = SolvencyPassport(
            user_id=current_user.id,
            financial_analysis_id=analysis.id,
            share_nonce=generate_share_nonce(),
            share_token_version=1,
            status=SolvencyPassportStatus.ISSUED,
            algorithm_version=analysis.algorithm_version,
            issued_at=now,
            expires_at=now + timedelta(days=PASSPORT_VALIDITY_DAYS),
            is_sandbox=TRUELAYER_ENVIRONMENT != "live",
            currency="EUR",
            analysis_period_start=analysis.analysis_period_start,
            analysis_period_end=analysis.analysis_period_end,
            months_analyzed=analysis.months_analyzed,
            recurring_monthly_income=analysis.recurring_monthly_income,
            average_fixed_expenses=analysis.average_monthly_fixed_expenses,
            average_variable_expenses=analysis.average_monthly_variable_expenses,
            average_monthly_margin=analysis.average_monthly_net_margin,
            recommended_rent_capacity=analysis.recommended_monthly_rent,
            income_stability=analysis.income_stability,
            confidence_level=analysis.analysis_confidence,
            holder_initials=_initials(current_user),
        )

        for _ in range(MAX_PUBLIC_ID_ATTEMPTS):
            passport.public_id = generate_public_id()
            try:
                db.add(passport)
                db.commit()
                db.refresh(passport)
                return passport
            except IntegrityError:
                db.rollback()
                continue

        raise HTTPException(
            status_code=500,
            detail="No se pudo generar un identificador único. Inténtalo de nuevo.",
        )

    def get_latest(
        self, db: Session, current_user: User
    ) -> SolvencyPassport | None:
        passport = (
            db.query(SolvencyPassport)
            .filter(SolvencyPassport.user_id == current_user.id)
            .order_by(SolvencyPassport.created_at.desc())
            .first()
        )
        if passport is not None:
            self._refresh_status(db, passport)
        return passport

    def get_by_id(
        self, db: Session, current_user: User, passport_id: str
    ) -> SolvencyPassport:
        passport = (
            db.query(SolvencyPassport)
            .filter(SolvencyPassport.id == passport_id)
            .first()
        )
        if passport is None or passport.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Pasaporte no encontrado.")

        self._refresh_status(db, passport)
        return passport

    def revoke(
        self, db: Session, current_user: User, passport_id: str
    ) -> SolvencyPassport:
        passport = self.get_by_id(db, current_user, passport_id)

        if passport.status != SolvencyPassportStatus.ISSUED:
            raise HTTPException(
                status_code=400,
                detail="Este pasaporte ya no está vigente.",
            )

        passport.status = SolvencyPassportStatus.REVOKED
        passport.revoked_at = datetime.now(timezone.utc)

        try:
            db.commit()
            db.refresh(passport)
        except Exception:
            db.rollback()
            raise

        return passport

    def regenerate_share_link(
        self, db: Session, current_user: User, passport_id: str
    ) -> SolvencyPassport:
        passport = self.get_by_id(db, current_user, passport_id)

        if passport.status != SolvencyPassportStatus.ISSUED:
            raise HTTPException(
                status_code=400,
                detail="Solo se puede regenerar el enlace de un pasaporte vigente.",
            )

        passport.share_nonce = generate_share_nonce()

        try:
            db.commit()
            db.refresh(passport)
        except Exception:
            db.rollback()
            raise

        return passport

    def get_public(
        self, db: Session, public_id: str, token: str
    ) -> SolvencyPassport:
        passport = (
            db.query(SolvencyPassport)
            .filter(SolvencyPassport.public_id == public_id)
            .first()
        )

        if passport is None or not verify_share_token(
            token,
            str(passport.id),
            passport.share_nonce,
            passport.share_token_version,
        ):
            raise HTTPException(status_code=404, detail="Not Found")

        self._refresh_status(db, passport)
        return passport

    def get_share_url(self, passport: SolvencyPassport) -> str:
        token = compute_share_token(
            str(passport.id), passport.share_nonce, passport.share_token_version
        )
        return build_share_url(passport.public_id, token)

    def _refresh_status(self, db: Session, passport: SolvencyPassport) -> None:
        if (
            passport.status == SolvencyPassportStatus.ISSUED
            and passport.expires_at < datetime.now(timezone.utc)
        ):
            passport.status = SolvencyPassportStatus.EXPIRED
            try:
                db.commit()
                db.refresh(passport)
            except Exception:
                db.rollback()
                raise
