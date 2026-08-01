from abc import ABC, abstractmethod


class StorageBackend(ABC):
    """
    Abstracción mínima de almacenamiento de archivos.

    Cualquier implementación real (S3, Cloudinary, Supabase Storage...)
    debe cumplir esta interfaz para que los servicios de la app no
    dependan del proveedor concreto.
    """

    @abstractmethod
    def save(
        self,
        content: bytes,
        filename: str,
        content_type: str,
    ) -> tuple[str, str]:
        """Guarda el archivo y devuelve (storage_key, url_publica)."""
        raise NotImplementedError

    @abstractmethod
    def delete(self, storage_key: str) -> None:
        raise NotImplementedError
