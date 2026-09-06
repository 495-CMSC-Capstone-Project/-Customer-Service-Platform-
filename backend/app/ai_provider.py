import os

import httpx


class AIProviderError(Exception):
    """Raised when the external AI provider cannot return a valid response."""


def generate_ai_response(message: str) -> str:
    """
    Send a customer message to the configured external LLM provider.

    Provider configuration is read from environment variables so that
    API keys and deployment-specific values are not stored in source code.
    """

    if not message.strip():
        raise ValueError("message is required")

    api_url = os.getenv("AI_API_URL")
    api_key = os.getenv("AI_API_KEY")
    model = os.getenv("AI_MODEL")

    if not api_url:
        raise AIProviderError("AI_API_URL is not configured")

    if not api_key:
        raise AIProviderError("AI_API_KEY is not configured")

    if not model:
        raise AIProviderError("AI_MODEL is not configured")

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are a customer service assistant. "
                    "Provide clear, concise, and helpful responses. "
                    "Do not invent account information or claim that an "
                    "action was completed unless the system confirms it."
                ),
            },
            {
                "role": "user",
                "content": message,
            },
        ],
    }

    try:
        response = httpx.post(
            api_url,
            headers=headers,
            json=payload,
            timeout=30.0,
        )
        response.raise_for_status()
    except httpx.HTTPError as exc:
        raise AIProviderError(
            "The external AI provider request failed"
        ) from exc

    try:
        data = response.json()
        return data["choices"][0]["message"]["content"].strip()
    except (KeyError, IndexError, TypeError, ValueError) as exc:
        raise AIProviderError(
            "The external AI provider returned an invalid response"
        ) from exc
