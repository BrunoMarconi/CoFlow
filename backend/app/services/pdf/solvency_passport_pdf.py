"""Generación del PDF del Pasaporte de Solvencia.

Librería: reportlab (dibujo directo) + qrcode (con Pillow). Ambas son
puro Python — a diferencia de WeasyPrint/wkhtmltopdf no necesitan
binarios de sistema ni librerías nativas (Cairo/Pango), lo que las hace
mucho más fiables de instalar en un despliegue como Render.

Todo el contenido sale de los campos ya presentes en el propio
SolvencyPassport (el snapshot): esta función nunca consulta
FinancialAnalysis ni ninguna otra tabla.
"""

from __future__ import annotations

from decimal import Decimal
from io import BytesIO

import qrcode
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

from app.database.models.financial_analysis import AnalysisConfidence, IncomeStability
from app.database.models.solvency_passport import (
    SolvencyPassport,
    SolvencyPassportStatus,
)

BRAND_COLOR = colors.HexColor("#12382C")
MUTED_COLOR = colors.HexColor("#6B7280")
ACCENT_COLOR = colors.HexColor("#22C55E")

STATUS_LABELS = {
    SolvencyPassportStatus.ISSUED: "Vigente",
    SolvencyPassportStatus.EXPIRED: "Caducado",
    SolvencyPassportStatus.REVOKED: "Revocado",
}
STABILITY_LABELS = {
    IncomeStability.HIGH: "Alta",
    IncomeStability.MEDIUM: "Media",
    IncomeStability.LOW: "Baja",
}
CONFIDENCE_LABELS = {
    AnalysisConfidence.HIGH: "Alta",
    AnalysisConfidence.MEDIUM: "Media",
    AnalysisConfidence.LOW: "Baja",
}

LEGAL_NOTICE = (
    "Este documento contiene una estimación orientativa basada en datos "
    "autorizados. No constituye un aval, una garantía de pago, una "
    "aprobación de alquiler ni una decisión automática."
)
SANDBOX_NOTICE = (
    "Documento de prueba generado con datos bancarios ficticios. No "
    "representa una evaluación financiera real."
)


def _format_money(value: Decimal | None) -> str:
    if value is None:
        return "Sin estimación"
    return f"{value:,.0f} €".replace(",", ".")


def _format_date(value) -> str:
    if value is None:
        return "—"
    return value.strftime("%d/%m/%Y")


def _build_qr_image(share_url: str) -> ImageReader:
    qr = qrcode.QRCode(border=1, box_size=6)
    qr.add_data(share_url)
    qr.make(fit=True)
    image = qr.make_image(fill_color="black", back_color="white").convert("RGB")

    buffer = BytesIO()
    image.save(buffer, format="PNG")
    buffer.seek(0)
    return ImageReader(buffer)


def build_passport_pdf(passport: SolvencyPassport, share_url: str) -> bytes:
    buffer = BytesIO()
    doc = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    left = 20 * mm
    right = width - 20 * mm
    y = height - 25 * mm

    doc.setFillColor(BRAND_COLOR)
    doc.setFont("Helvetica-Bold", 20)
    doc.drawString(left, y, "CoFlow")

    doc.setFont("Helvetica", 10)
    doc.setFillColor(MUTED_COLOR)
    doc.drawRightString(right, y, f"ID: {passport.public_id}")

    y -= 12 * mm
    doc.setFillColor(BRAND_COLOR)
    doc.setFont("Helvetica-Bold", 16)
    doc.drawString(left, y, "Pasaporte de Solvencia")

    status_label = STATUS_LABELS.get(passport.status, passport.status.value)
    doc.setFont("Helvetica-Bold", 11)
    doc.setFillColor(
        ACCENT_COLOR if passport.status == SolvencyPassportStatus.ISSUED else colors.red
    )
    doc.drawRightString(right, y, status_label)

    y -= 10 * mm
    doc.setStrokeColor(colors.HexColor("#E5E7EB"))
    doc.line(left, y, right, y)

    y -= 10 * mm
    doc.setFillColor(colors.black)
    doc.setFont("Helvetica", 10)
    doc.drawString(left, y, f"Emitido: {_format_date(passport.issued_at)}")
    doc.drawString(left + 80 * mm, y, f"Caduca: {_format_date(passport.expires_at)}")

    y -= 7 * mm
    doc.drawString(
        left,
        y,
        f"Periodo analizado: {_format_date(passport.analysis_period_start)} – "
        f"{_format_date(passport.analysis_period_end)}",
    )

    y -= 7 * mm
    doc.drawString(left, y, f"Meses analizados: {passport.months_analyzed}")
    doc.drawString(left + 80 * mm, y, f"Titular: {passport.holder_initials}")

    y -= 15 * mm
    doc.setFillColor(colors.HexColor("#F0FDF4"))
    doc.roundRect(left, y - 20 * mm, right - left, 20 * mm, 4, fill=1, stroke=0)
    doc.setFillColor(MUTED_COLOR)
    doc.setFont("Helvetica-Bold", 9)
    doc.drawString(left + 6 * mm, y - 7 * mm, "CAPACIDAD ORIENTATIVA")
    doc.setFillColor(BRAND_COLOR)
    doc.setFont("Helvetica-Bold", 22)
    capacity_text = (
        f"Hasta {_format_money(passport.recommended_rent_capacity)}/mes"
        if passport.recommended_rent_capacity is not None
        else "Sin estimación disponible"
    )
    doc.drawString(left + 6 * mm, y - 16 * mm, capacity_text)

    y -= 30 * mm
    doc.setFillColor(colors.black)
    doc.setFont("Helvetica", 10)
    rows = [
        ("Ingresos recurrentes medios", _format_money(passport.recurring_monthly_income)),
        (
            "Estabilidad de ingresos",
            STABILITY_LABELS.get(passport.income_stability, "—"),
        ),
        ("Gastos fijos estimados", _format_money(passport.average_fixed_expenses)),
        ("Margen mensual medio", _format_money(passport.average_monthly_margin)),
        (
            "Confianza del análisis",
            CONFIDENCE_LABELS.get(passport.confidence_level, "—"),
        ),
        ("Versión del algoritmo", passport.algorithm_version),
    ]
    for label, value in rows:
        doc.setFillColor(MUTED_COLOR)
        doc.drawString(left, y, label)
        doc.setFillColor(colors.black)
        doc.drawRightString(right, y, value)
        y -= 6.5 * mm

    y -= 6 * mm
    doc.setFont("Helvetica", 8)
    doc.setFillColor(MUTED_COLOR)
    doc.drawString(
        left,
        y,
        "Cálculo: ingresos recurrentes detectados en los últimos meses menos",
    )
    y -= 4 * mm
    doc.drawString(
        left,
        y,
        "gastos fijos estimados, con un límite conservador sobre ambos.",
    )

    # --- Pie de página fijo: QR + avisos legales (posición independiente
    # de cuánto contenido dinámico haya arriba) ---
    qr_size = 28 * mm
    qr_left = left
    qr_bottom = 12 * mm

    doc.drawImage(
        _build_qr_image(share_url),
        qr_left,
        qr_bottom,
        width=qr_size,
        height=qr_size,
    )
    doc.setFont("Helvetica", 8)
    doc.setFillColor(MUTED_COLOR)
    doc.drawString(
        qr_left + qr_size + 4 * mm, qr_bottom + qr_size - 5 * mm, "Verifica este documento"
    )
    doc.drawString(
        qr_left + qr_size + 4 * mm, qr_bottom + qr_size - 10 * mm, "escaneando el código QR."
    )

    notice_lines = _wrap_text(LEGAL_NOTICE, 60)
    if passport.is_sandbox:
        notice_lines += [""] + _wrap_text(SANDBOX_NOTICE, 60)

    notice_x = qr_left + qr_size + 4 * mm
    notice_y = qr_bottom + qr_size - 16 * mm
    doc.setFont("Helvetica", 6.5)
    for line in notice_lines:
        doc.drawString(notice_x, notice_y, line)
        notice_y -= 3.2 * mm

    doc.showPage()
    doc.save()

    return buffer.getvalue()


def _wrap_text(text: str, max_chars: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""

    for word in words:
        candidate = f"{current} {word}".strip()
        if len(candidate) > max_chars:
            lines.append(current)
            current = word
        else:
            current = candidate

    if current:
        lines.append(current)

    return lines
