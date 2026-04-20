import httpx

from core.config import settings
from domain.models import Node


class RagPublisher:
    async def publish(self, node: Node, path_label: str) -> dict:
        if not node.rag_content:
            raise ValueError("Converta o texto para RAG antes de publicar.")
        text = node.rag_content

        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                f"{settings.rag_api_url}/ingest/text",
                json={"text": text, "filename": path_label},
            )
            response.raise_for_status()
            return response.json()

    async def unpublish(self, path_label: str) -> None:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.delete(
                f"{settings.rag_api_url}/documents/{path_label}",
            )
            if response.status_code not in (200, 404):
                response.raise_for_status()
