import uuid

import pytest
from fastapi import HTTPException

from routers.chat_router import _secured_chat_file_url, _validate_chat_file_url


def test_chat_file_url_accepts_generated_secure_path():
    filename = f"{uuid.uuid4()}.png"

    assert _validate_chat_file_url(f"/api/chat/files/{filename}") == (
        f"/api/chat/files/{filename}"
    )
    assert _secured_chat_file_url(f"/uploads/chat/{filename}") == (
        f"/api/chat/files/{filename}"
    )


@pytest.mark.parametrize(
    "file_url",
    [
        "/uploads/chat/../secret.pdf",
        "/api/chat/files/not-a-uuid.pdf",
        f"/api/chat/files/{uuid.uuid4()}.exe",
        "https://example.com/file.pdf",
    ],
)
def test_chat_file_url_rejects_untrusted_paths(file_url):
    with pytest.raises(HTTPException) as error:
        _validate_chat_file_url(file_url)

    assert error.value.status_code == 400
