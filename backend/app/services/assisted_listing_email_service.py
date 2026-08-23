import logging

import resend

from app.core.config import EMAIL_DELIVERY_MODE, EMAIL_FROM, RESEND_API_KEY

logger = logging.getLogger("coflow.assisted_listing_email")


def send_owner_claim_email(*, to_email: str, first_name: str, claim_url: str, property_title: str) -> None:
    if EMAIL_DELIVERY_MODE == "console":
        logger.info("Assisted listing invitation queued for %s", to_email)
        return
    if not RESEND_API_KEY:
        logger.error("RESEND_API_KEY missing; assisted listing email was not sent")
        return
    try:
        resend.api_key = RESEND_API_KEY
        resend.Emails.send({
            "from": EMAIL_FROM,
            "to": [to_email],
            "subject": "Revisa tu anuncio en CoFlow",
            "html": f"""<div style='font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:32px;color:#12382c'>
              <h2>Hola {first_name},</h2>
              <p>Hemos preparado contigo el borrador de <strong>{property_title}</strong>.</p>
              <p>Crea tu acceso, revisa los datos y decide cuándo publicarlo.</p>
              <p><a href='{claim_url}' style='display:inline-block;background:#12382c;color:white;padding:14px 22px;border-radius:12px;text-decoration:none;font-weight:bold'>Revisar mi anuncio</a></p>
              <p style='color:#667085;font-size:13px'>El enlace es personal, de un solo uso y caduca en 7 días.</p>
            </div>""",
            "text": f"Hola {first_name}. Revisa el borrador de {property_title} y crea tu acceso: {claim_url}\nEl enlace caduca en 7 días.",
        })
    except Exception:
        logger.exception("Failed to send assisted listing email")
