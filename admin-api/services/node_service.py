import uuid
from sqlalchemy.orm import Session

from domain.models import Node, NodeStatus
from repositories.node_repository import NodeRepository
from services.rag_publisher import RagPublisher


class NodeService:
    def __init__(self, db: Session):
        self._repo = NodeRepository(db)
        self._publisher = RagPublisher()

    def get(self, node_id: uuid.UUID) -> Node:
        node = self._repo.get_by_id(node_id)
        if not node:
            raise ValueError(f"Nó não encontrado: {node_id}")
        return node

    def get_tree(self) -> list[Node]:
        return self._repo.get_tree()

    def get_children(self, parent_id: uuid.UUID) -> list[Node]:
        return self._repo.list_children(parent_id)

    def create(self, name: str, parent_id: uuid.UUID | None = None,
               text_content: str | None = None, source_url: str | None = None) -> Node:
        return self._repo.create(name, parent_id, text_content, source_url)

    def update(self, node_id: uuid.UUID, change_note: str | None = None, **fields) -> Node:
        node = self.get(node_id)
        return self._repo.update(node, change_note=change_note, **fields)

    def delete(self, node_id: uuid.UUID) -> None:
        node = self.get(node_id)
        self._repo.delete(node)

    def restore_version(self, node_id: uuid.UUID, version: int) -> Node:
        node = self.get(node_id)
        ver = self._repo.get_version(node_id, version)
        if not ver:
            raise ValueError(f"Versão {version} não encontrada.")
        return self._repo.update(
            node,
            change_note=f"Restaurado da versão {version}",
            name=ver.name,
            text_content=ver.text_content,
            source_url=ver.source_url,
        )

    def build_path_label(self, node: Node) -> str:
        path = self._repo.get_path(node.id)
        return " > ".join(n.name for n in path)

    async def publish(self, node_id: uuid.UUID) -> dict:
        node = self.get(node_id)
        path_label = self.build_path_label(node)
        result = await self._publisher.publish(node, path_label)
        self._repo.update(node, change_note="Publicado para RAG", status=NodeStatus.active)
        return {"path_label": path_label, "chunks": result.get("chunks")}

    def list_versions(self, node_id: uuid.UUID):
        self.get(node_id)
        return self._repo.list_versions(node_id)
