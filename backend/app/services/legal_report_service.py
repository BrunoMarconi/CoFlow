from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.config import MAX_IMAGE_SIZE_BYTES
from app.database.models.legal_report import LegalReport
from app.schemas.legal import LegalReportCreate
from app.services import storage_service

EVIDENCE_SUBFOLDER = "legal-reports"


class LegalReportService:

    async def create_report(
        self,
        db: Session,
        data: LegalReportCreate,
        evidence: UploadFile | None,
    ) -> LegalReport:
        if not data.good_faith_declared:
            raise HTTPException(
                status_code=422,
                detail="Debes declarar de buena fe que la denuncia es exacta y completa.",
            )

        evidence_storage_key: str | None = None
        evidence_url: str | None = None

        if evidence is not None and evidence.filename:
            content = await evidence.read()
            validated = storage_service.validate_image(content, MAX_IMAGE_SIZE_BYTES)
            evidence_storage_key, evidence_url = storage_service.upload_file(
                validated, EVIDENCE_SUBFOLDER
            )

        report = LegalReport(
            content_type=data.content_type,
            url_or_location=data.url_or_location.strip(),
            reason=data.reason.strip(),
            additional_info=data.additional_info.strip() if data.additional_info else None,
            reporter_name=data.reporter_name.strip() if data.reporter_name else None,
            reporter_email=data.reporter_email,
            evidence_storage_key=evidence_storage_key,
            evidence_url=evidence_url,
            good_faith_declared=data.good_faith_declared,
        )

        try:
            db.add(report)
            db.commit()
        except Exception:
            db.rollback()
            if evidence_storage_key:
                storage_service.delete_file(evidence_storage_key, EVIDENCE_SUBFOLDER)
            raise

        db.refresh(report)
        return report
