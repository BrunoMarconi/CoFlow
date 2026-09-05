"""Envío del email transaccional de verificación, vía Resend.

Se llama siempre desde un BackgroundTask (después de responder al
cliente): nunca debe lanzar una excepción que se propague, y nunca debe
loguear el token ni la URL completa de verificación.
"""

from __future__ import annotations

import logging

import resend

from app.core.config import EMAIL_DELIVERY_MODE, EMAIL_FROM, FRONTEND_URL, RESEND_API_KEY

logger = logging.getLogger("coflow.email")
logger.setLevel(logging.INFO)
if not logger.handlers:
    # El proyecto no configura logging global (ni siquiera uvicorn lo
    # hace para loggers de la app) — sin esto, los avisos de este
    # módulo (modo consola, RESEND_API_KEY ausente, fallos de envío)
    # quedarían silenciados por el nivel WARNING por defecto del root
    # logger y nunca se verían.
    _handler = logging.StreamHandler()
    _handler.setFormatter(logging.Formatter("%(levelname)s:%(name)s:%(message)s"))
    logger.addHandler(_handler)
    logger.propagate = False

SUBJECT = "Confirma tu correo en CoFlow"
PASSWORD_RESET_SUBJECT = "Restablece tu contraseña de CoFlow"


def _mask_email(email: str) -> str:
    local, _, domain = email.partition("@")
    if not domain:
        return "***"
    visible = local[:2]
    return f"{visible}***@{domain}"


def build_verification_url(raw_token: str) -> str:
    base = FRONTEND_URL or "http://localhost:3000"
    return f"{base}/verificar-email?token={raw_token}"


def build_password_reset_url(raw_token: str) -> str:
    base = FRONTEND_URL or "http://localhost:3000"
    return f"{base}/restablecer-password?token={raw_token}"


def _logo_url() -> str:
    base = FRONTEND_URL or "http://localhost:3000"
    return f"{base}/logo-coflow.png"


def _build_html(first_name: str, verify_url: str, expiry_minutes: int) -> str:
    logo_url = _logo_url()
    return f"""\
<!DOCTYPE html>
<html lang="es">
  <body style="margin:0;padding:0;background-color:#F8FAFC;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8FAFC;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF;border-radius:16px;padding:32px;">
            <tr>
              <td align="center" style="padding-bottom:24px;">
                <img src="{logo_url}" alt="CoFlow" height="36" style="height:36px;width:auto;display:block;border:0;" />
              </td>
            </tr>
            <tr>
              <td style="color:#12382C;font-size:20px;font-weight:bold;padding-bottom:12px;">
                Hola {first_name},
              </td>
            </tr>
            <tr>
              <td style="color:#374151;font-size:15px;line-height:22px;padding-bottom:24px;">
                Confirma tu correo para activar todas las funciones de tu cuenta de CoFlow.
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-bottom:24px;">
                <a href="{verify_url}" style="background-color:#22C55E;color:#FFFFFF;text-decoration:none;font-weight:bold;font-size:15px;padding:14px 28px;border-radius:12px;display:inline-block;">
                  Confirmar mi correo
                </a>
              </td>
            </tr>
            <tr>
              <td style="color:#6B7280;font-size:13px;line-height:20px;padding-bottom:16px;">
                Si el botón no funciona, copia y pega este enlace en tu navegador:<br />
                <a href="{verify_url}" style="color:#22C55E;word-break:break-all;">{verify_url}</a>
              </td>
            </tr>
            <tr>
              <td style="color:#6B7280;font-size:13px;line-height:20px;padding-bottom:16px;">
                Este enlace caduca en {expiry_minutes} minutos.
              </td>
            </tr>
            <tr>
              <td style="color:#9CA3AF;font-size:12px;line-height:18px;">
                Si no creaste esta cuenta, puedes ignorar este correo.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>"""


def _build_text(first_name: str, verify_url: str, expiry_minutes: int) -> str:
    return (
        f"Hola {first_name},\n\n"
        "Confirma tu correo para activar todas las funciones de tu cuenta de CoFlow:\n"
        f"{verify_url}\n\n"
        f"Este enlace caduca en {expiry_minutes} minutos.\n\n"
        "Si no creaste esta cuenta, puedes ignorar este correo.\n\n"
        "— CoFlow"
    )


def send_verification_email(
    *, to_email: str, first_name: str, raw_token: str, expiry_minutes: int
) -> None:
    verify_url = build_verification_url(raw_token)

    if EMAIL_DELIVERY_MODE == "console":
        logger.info(
            "verification email queued (console mode) for %s",
            _mask_email(to_email),
        )
        return

    if not RESEND_API_KEY:
        logger.error(
            "RESEND_API_KEY no está configurada: no se pudo enviar el "
            "email de verificación a %s. Define RESEND_API_KEY o usa "
            "EMAIL_DELIVERY_MODE=console en desarrollo.",
            _mask_email(to_email),
        )
        return

    try:
        resend.api_key = RESEND_API_KEY
        resend.Emails.send(
            {
                "from": EMAIL_FROM,
                "to": [to_email],
                "subject": SUBJECT,
                "html": _build_html(first_name, verify_url, expiry_minutes),
                "text": _build_text(first_name, verify_url, expiry_minutes),
            }
        )
    except Exception:
        logger.exception(
            "Fallo al enviar el email de verificación a %s",
            _mask_email(to_email),
        )


def send_password_reset_email(
    *, to_email: str, first_name: str, raw_token: str, expiry_minutes: int
) -> None:
    reset_url = build_password_reset_url(raw_token)
    if EMAIL_DELIVERY_MODE == "console":
        logger.info("password reset email queued (console mode) for %s", _mask_email(to_email))
        return
    if not RESEND_API_KEY:
        logger.error("RESEND_API_KEY no está configurada para %s", _mask_email(to_email))
        return

    html = f"""\
<!DOCTYPE html><html lang="es"><body style="margin:0;padding:0;background:#F5F7F3;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px"><tr><td align="center">
<table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #E4E8E3;border-radius:20px;padding:36px">
<tr><td align="center" style="padding-bottom:28px"><img src="{_logo_url()}" alt="CoFlow" height="36" /></td></tr>
<tr><td style="color:#12382C;font-size:24px;font-weight:700;padding-bottom:12px">Crea una nueva contraseña</td></tr>
<tr><td style="color:#59645F;font-size:15px;line-height:23px;padding-bottom:28px">Hola {first_name}. Usa este enlace para volver a acceder a tu cuenta. Si no lo solicitaste, no necesitas hacer nada.</td></tr>
<tr><td align="center" style="padding-bottom:24px"><a href="{reset_url}" style="display:inline-block;background:#12382C;color:#fff;text-decoration:none;font-weight:700;padding:14px 28px;border-radius:14px">Restablecer contraseña</a></td></tr>
<tr><td style="color:#7A847F;font-size:13px;line-height:20px">El enlace caduca en {expiry_minutes} minutos y solo puede utilizarse una vez.</td></tr>
</table></td></tr></table></body></html>"""
    text = (
        f"Hola {first_name},\n\nRestablece tu contraseña de CoFlow:\n{reset_url}\n\n"
        f"El enlace caduca en {expiry_minutes} minutos y solo puede usarse una vez."
    )
    try:
        resend.api_key = RESEND_API_KEY
        resend.Emails.send({"from": EMAIL_FROM, "to": [to_email], "subject": PASSWORD_RESET_SUBJECT, "html": html, "text": text})
    except Exception:
        logger.exception("Fallo al enviar el email de recuperación a %s", _mask_email(to_email))
