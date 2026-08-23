from __future__ import annotations

from typing import Protocol

import httpx


class LLMService(Protocol):
    async def generate(self, prompt: str) -> str: ...


class GeminiProvider:
    def __init__(self, api_key: str, model: str) -> None:
        self.api_key = api_key
        self.model = model

    async def generate(self, prompt: str) -> str:
        from google import genai

        client = genai.Client(api_key=self.api_key)
        response = await client.aio.models.generate_content(model=self.model, contents=prompt)
        return response.text or "I couldn't generate an answer from the provided context."


class LocalOllamaProvider:
    def __init__(self, base_url: str, model: str) -> None:
        self.base_url = base_url.rstrip("/")
        self.model = model

    async def generate(self, prompt: str) -> str:
        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.post(f"{self.base_url}/api/generate", json={"model": self.model, "prompt": prompt, "stream": False})
            response.raise_for_status()
            return response.json()["response"]

