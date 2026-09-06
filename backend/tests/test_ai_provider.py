import pytest
import httpx

from backend.app.ai_provider import AIProviderError, generate_ai_response


class FakeResponse:
    def __init__(self, data):
        self._data = data

    def raise_for_status(self):
        return None

    def json(self):
        return self._data


def test_generate_ai_response_returns_provider_text(monkeypatch):
    monkeypatch.setenv("AI_API_URL", "https://example.com/v1/chat/completions")
    monkeypatch.setenv("AI_API_KEY", "test-key")
    monkeypatch.setenv("AI_MODEL", "test-model")

    def fake_post(*args, **kwargs):
        return FakeResponse(
            {
                "choices": [
                    {
                        "message": {
                            "content": "Here is your customer service response."
                        }
                    }
                ]
            }
        )

    monkeypatch.setattr(httpx, "post", fake_post)

    result = generate_ai_response("How do I update my account?")

    assert result == "Here is your customer service response."


@pytest.mark.parametrize(
    "variable",
    [
        "AI_API_URL",
        "AI_API_KEY",
        "AI_MODEL",
    ],
)
def test_generate_ai_response_requires_configuration(monkeypatch, variable):
    monkeypatch.setenv("AI_API_URL", "https://example.com/v1/chat/completions")
    monkeypatch.setenv("AI_API_KEY", "test-key")
    monkeypatch.setenv("AI_MODEL", "test-model")

    monkeypatch.delenv(variable)

    with pytest.raises(AIProviderError):
        generate_ai_response("Hello")


def test_generate_ai_response_rejects_blank_message():
    with pytest.raises(ValueError):
        generate_ai_response("   ")


def test_generate_ai_response_handles_http_failure(monkeypatch):
    monkeypatch.setenv("AI_API_URL", "https://example.com/v1/chat/completions")
    monkeypatch.setenv("AI_API_KEY", "test-key")
    monkeypatch.setenv("AI_MODEL", "test-model")

    def fake_post(*args, **kwargs):
        raise httpx.RequestError("Provider unavailable")

    monkeypatch.setattr(httpx, "post", fake_post)

    with pytest.raises(AIProviderError):
        generate_ai_response("Hello")


def test_generate_ai_response_handles_invalid_provider_response(monkeypatch):
    monkeypatch.setenv("AI_API_URL", "https://example.com/v1/chat/completions")
    monkeypatch.setenv("AI_API_KEY", "test-key")
    monkeypatch.setenv("AI_MODEL", "test-model")

    def fake_post(*args, **kwargs):
        return FakeResponse({"unexpected": "response"})

    monkeypatch.setattr(httpx, "post", fake_post)

    with pytest.raises(AIProviderError):
        generate_ai_response("Hello")
