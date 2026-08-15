from typing import Literal

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.legal import LegalReportCreate, LegalReportResponse
from app.services.legal_report_service import LegalReportService

router = APIRouter()

legal_report_service = LegalReportService()


@router.post("/reports", response_model=LegalReportResponse)
async def create_legal_report(
    content_type: Literal["PROFILE", "PROPERTY", "COMMUNITY", "OTHER"] = Form(...),
    url_or_location: str = Form(...),
    reason: str = Form(...),
    additional_info: str | None = Form(default=None),
    reporter_name: str | None = Form(default=None),
    reporter_email: str | None = Form(default=None),
    good_faith_declared: bool = Form(...),
    evidence: UploadFile | None = File(default=None),
    db: Session = Depends(get_db),
):
    data = LegalReportCreate(
        content_type=content_type,
        url_or_location=url_or_location,
        reason=reason,
        additional_info=additional_info,
        reporter_name=reporter_name,
        reporter_email=reporter_email or None,
        good_faith_declared=good_faith_declared,
    )
    return await legal_report_service.create_report(db=db, data=data, evidence=evidence)
