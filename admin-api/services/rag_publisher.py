import httpx

from core.config import settings
from domain.models import Node


class RagPublisher:
    async def publish(self, node: Node, path_label: str) -> dict:
        if not node.text_content:
            raise ValueError("Nó não tem texto para publicar.")

        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                f"{settings.rag_api_url}/ingest/text",
                json={"text": node.text_content, "filename": path_label},
            )
            response.raise_for_status()
            return response.json()
