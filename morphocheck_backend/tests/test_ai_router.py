import base64

import pytest
from fastapi import HTTPException

from routers.ai_router import ChatRequest, _build_chat_contents


def test_chat_request_history_is_not_shared():
    first = ChatRequest()
    second = ChatRequest()

    first.history.append({"role": "user", "content": "hello"})

    assert second.history == []


def test_build_chat_contents_includes_valid_image():
    image_bytes = b"small-test-image"
    request = ChatRequest(
        message="Inspect",
        image_data=f"data:image/png;base64,{base64.b64encode(image_bytes).decode()}",
        image_mime_type="image/png",
    )

    contents = _build_chat_contents(request, "System context")

    assert len(contents) == 2
    assert contents[-1].parts[-1].inline_data.data == image_bytes
    assert contents[-1].parts[-1].inline_data.mime_type == "image/png"


def test_build_chat_contents_rejects_unsupported_image_type():
    request = ChatRequest(
        image_data=base64.b64encode(b"svg").decode(),
        image_mime_type="image/svg+xml",
    )

    with pytest.raises(HTTPException) as error:
        _build_chat_contents(request, "System context")

    assert error.value.status_code == 400
