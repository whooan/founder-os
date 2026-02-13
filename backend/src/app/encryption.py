import base64
import hashlib
import os
from pathlib import Path

from cryptography.fernet import Fernet

from app.config import settings

_fernet: Fernet | None = None


def _get_encryption_key() -> bytes:
    """Derive a Fernet key from SECRET_KEY env var, or generate one from a local file."""
    if settings.secret_key:
        # Derive a 32-byte key from the secret using SHA-256, then base64 encode for Fernet
        digest = hashlib.sha256(settings.secret_key.encode()).digest()
        return base64.urlsafe_b64encode(digest)

    # Fallback: auto-generate a key file
    key_path = Path(".secret_key")
    if key_path.exists():
        return key_path.read_bytes().strip()

    key = Fernet.generate_key()
    key_path.write_bytes(key)
    return key


def _get_fernet() -> Fernet:
    global _fernet
    if _fernet is None:
        _fernet = Fernet(_get_encryption_key())
    return _fernet


def encrypt_value(value: str) -> str:
    """Encrypt a plaintext value and return base64-encoded ciphertext."""
    return _get_fernet().encrypt(value.encode()).decode()


def decrypt_value(encrypted: str) -> str:
    """Decrypt a base64-encoded ciphertext back to plaintext."""
    return _get_fernet().decrypt(encrypted.encode()).decode()


def mask_api_key(key: str) -> str:
    """Mask an API key for display, showing only prefix and last 4 chars."""
    if not key:
        return ""
    if len(key) <= 8:
        return "****"
    return f"{key[:3]}...{key[-4:]}"
