ALLOWED_IMAGE_TYPES = {
    "jpeg": {"ext": "jpg", "content_type": "image/jpeg"},
    "png": {"ext": "png", "content_type": "image/png"},
    "webp": {"ext": "webp", "content_type": "image/webp"},
}


def detect_image_type(content: bytes) -> str | None:
    """
    Comprueba la firma binaria real del archivo (magic bytes) en vez de
    fiarse de la extensión o del Content-Type declarado por el cliente.
    Devuelve "jpeg" | "png" | "webp" | None.
    """
    if content[:3] == b"\xff\xd8\xff":
        return "jpeg"

    if content[:8] == b"\x89PNG\r\n\x1a\n":
        return "png"

    if content[:4] == b"RIFF" and content[8:12] == b"WEBP":
        return "webp"

    return None
