"""Emails transaccionales de facturación por piso (publicación,
aviso de fin de prueba, fallo de pago), vía Resend — mismo patrón que
email_service.py (verificación de email): siempre desde un
BackgroundTask, nunca debe propagar una excepción."""

from __future__ import annotations

import logging

import resend

from app.core.config import EMAIL_DELIVERY_MODE, EMAIL_FROM, FRONTEND_URL, RESEND_API_KEY

logger = logging.getLogger("coflow.email")


def _mask_email(email: str) -> str:
    local, _, domain = email.partition("@")
    if not domain:
        return "***"
    return f"{local[:2]}***@{domain}"


def _send(to_email: str, subject: str, html: str, text: str) -> None:
    if EMAIL_DELIVERY_MODE == "console":
        logger.info("billing email queued (console mode) for %s: %s", _mask_email(to_email), subject)
        return

    if not RESEND_API_KEY:
        logger.error(
            "RESEND_API_KEY no está configurada: no se pudo enviar '%s' a %s.",
            subject, _mask_email(to_email),
        )
        return

    try:
        resend.api_key = RESEND_API_KEY
        resend.Emails.send(
            {"from": EMAIL_FROM, "to": [to_email], "subject": subject, "html": html, "text": text}
        )
    except Exception:
        logger.exception("Fallo al enviar '%s' a %s", subject, _mask_email(to_email))


def _manage_url(property_id: int) -> str:
    base = FRONTEND_URL or "http://localhost:3000"
    return f"{base}/propietarios/pisos/{property_id}"


def _wrap(title: str, body_lines: list[str], cta_label: str, cta_url: str) -> str:
    paragraphs = "".join(
        f'<tr><td style="color:#374151;font-size:15px;line-height:22px;padding-bottom:14px;">{line}</td></tr>'
        for line in body_lines
    )
    return f"""\
<!DOCTYPE html>
<html lang="es">
  <body style="margin:0;padding:0;background-color:#F8FAFC;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8FAFC;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF;border-radius:16px;padding:32px;">
          <tr><td align="center" style="padding-bottom:24px;"><span style="font-size:22px;font-weight:bold;color:#12382C;">CoFlow</span></td></tr>
          <tr><td style="color:#12382C;font-size:20px;font-weight:bold;padding-bottom:16px;">{title}</td></tr>
          {paragraphs}
          <tr><td align="center" style="padding-top:8px;padding-bottom:8px;">
            <a href="{cta_url}" style="background-color:#22C55E;color:#FFFFFF;text-decoration:none;font-weight:bold;font-size:15px;padding:14px 28px;border-radius:12px;display:inline-block;">{cta_label}</a>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>"""


def send_property_published_email(
    *,
    to_email: str,
    first_name: str,
    property_id: int,
    property_title: str,
    published_date: str,
    trial_end_date: str,
    first_charge_date: str,
    price_label: str,
) -> None:
    subject = "Tu propiedad ya está publicada en CoFlow"
    lines = [
        f"Hola {first_name}, tu piso <strong>{property_title}</strong> ya está publicado en CoFlow (desde el {published_date}).",
        f"Tienes 30 días gratis: tu prueba termina el <strong>{trial_end_date}</strong>.",
        f"Si el anuncio sigue publicado, el primer cobro de <strong>{price_label}</strong> será el <strong>{first_charge_date}</strong>, y se repetirá cada mes mientras siga activo.",
        "Puedes gestionar el plan de este piso (ver próximo cobro, cambiar la tarjeta o cancelar la renovación) cuando quieras desde tu panel.",
    ]
    manage_url = _manage_url(property_id)
    html = _wrap("¡Ya está publicado!", lines, "Gestionar mi propiedad", manage_url)
    text = "\n\n".join(l.replace("<strong>", "").replace("</strong>", "") for l in lines) + f"\n\n{manage_url}"
    _send(to_email, subject, html, text)


def send_trial_ending_email(
    *,
    to_email: str,
    first_name: str,
    property_id: int,
    property_title: str,
    trial_end_date: str,
    price_label: str,
) -> None:
    subject = "Tu periodo gratuito de CoFlow termina pronto"
    lines = [
        f"Hola {first_name}, tu propiedad <strong>{property_title}</strong> finalizará sus 30 días gratuitos el <strong>{trial_end_date}</strong>.",
        f"A partir de esa fecha, la publicación tendrá un coste de <strong>{price_label}</strong>.",
        "Si no quieres continuar, puedes cancelar la renovación desde tu panel antes de esa fecha y no se te cobrará nada.",
    ]
    manage_url = _manage_url(property_id)
    html = _wrap("Tu prueba gratis está por terminar", lines, "Gestionar propiedad", manage_url)
    text = "\n\n".join(l.replace("<strong>", "").replace("</strong>", "") for l in lines) + f"\n\n{manage_url}"
    _send(to_email, subject, html, text)


def send_payment_failed_email(
    *,
    to_email: str,
    first_name: str,
    property_id: int,
    property_title: str,
) -> None:
    subject = "No hemos podido cobrar la cuota de tu propiedad"
    lines = [
        f"Hola {first_name}, tenemos un problema con el método de pago de <strong>{property_title}</strong>.",
        "Actualiza tu tarjeta desde tu panel para que la publicación siga activa. Si no lo hacemos, este piso podría dejar de publicarse.",
    ]
    manage_url = _manage_url(property_id)
    html = _wrap("Problema con tu método de pago", lines, "Actualizar método de pago", manage_url)
    text = "\n\n".join(l.replace("<strong>", "").replace("</strong>", "") for l in lines) + f"\n\n{manage_url}"
    _send(to_email, subject, html, text)
