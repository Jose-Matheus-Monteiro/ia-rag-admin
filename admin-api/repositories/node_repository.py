import uuid
from sqlalchemy.orm import Session
from sqlalchemy import text

from domain.models import Node, NodeVersion, NodeStatus


class NodeRepository:
    def __init__(self, db: Session):
        self._db = db

    def get_by_id(self, node_id: uuid.UUID) -> Node | None:
        return self._db.get(Node, node_id)

    def list_roots(self) -> list[Node]:
        return self._db.query(Node).filter(Node.parent_id.is_(None)).order_by(Node.name).all()

    def list_children(self, parent_id: uuid.UUID) -> list[Node]:
        return self._db.query(Node).filter(Node.parent_id == parent_id).order_by(Node.name).all()

    def get_tree(self) -> list[Node]:
        return self._db.query(Node).order_by(Node.name).all()

    def get_path(self, node_id: uuid.UUID) -> list[Node]:
        result = self._db.execute(text("""
            WITH RECURSIVE ancestors AS (
                SELECT id, parent_id, name, 0 AS depth
                FROM nodes WHERE id = :node_id
                UNION ALL
                SELECT n.id, n.parent_id, n.name, a.depth + 1
                FROM nodes n INNER JOIN ancestors a ON n.id = a.parent_id
            )
            SELECT id FROM ancestors ORDER BY depth DESC
        """), {"node_id": str(node_id)})
        ids = [row[0] for row in result]
        nodes = {str(n.id): n for n in self._db.query(Node).filter(Node.id.in_(ids)).all()}
        return [nodes[str(i)] for i in ids if str(i) in nodes]

    def create(self, name: str, parent_id: uuid.UUID | None = None,
               text_content: str | None = None, source_url: str | None = None) -> Node:
        node = Node(
            name=name,
            parent_id=parent_id,
            text_content=text_content,
            source_url=source_url,
        )
        self._db.add(node)
        self._db.commit()
        self._db.refresh(node)
        return node

    def update(self, node: Node, change_note: str | None = None, **fields) -> Node:
        version = NodeVersion(
            node_id=node.id,
            version=node.version,
            name=node.name,
            text_content=node.text_content,
            source_url=node.source_url,
            status=node.status,
            change_note=change_note,
        )
        self._db.add(version)

        for key, value in fields.items():
            if hasattr(node, key):
                setattr(node, key, value)
        node.version += 1

        self._db.commit()
        self._db.refresh(node)
        return node

    def delete(self, node: Node) -> None:
        self._db.delete(node)
        self._db.commit()

    def list_versions(self, node_id: uuid.UUID) -> list[NodeVersion]:
        return (
            self._db.query(NodeVersion)
            .filter(NodeVersion.node_id == node_id)
            .order_by(NodeVersion.version.desc())
            .all()
        )

    def get_version(self, node_id: uuid.UUID, version: int) -> NodeVersion | None:
        return (
            self._db.query(NodeVersion)
            .filter(NodeVersion.node_id == node_id, NodeVersion.version == version)
            .first()
        )
