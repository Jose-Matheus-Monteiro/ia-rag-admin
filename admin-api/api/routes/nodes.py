import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from api.dependencies import get_node_service, require_auth
from services.node_service import NodeService

router = APIRouter(prefix="/nodes", tags=["nodes"], dependencies=[Depends(require_auth)])


class NodeCreate(BaseModel):
    name: str
    parent_id: uuid.UUID | None = None
    text_content: str | None = None
    source_url: str | None = None


class NodeUpdate(BaseModel):
    name: str | None = None
    text_content: str | None = None
    source_url: str | None = None
    status: str | None = None
    change_note: str | None = None


def _serialize(node) -> dict:
    return {
        "id": str(node.id),
        "parent_id": str(node.parent_id) if node.parent_id else None,
        "name": node.name,
        "text_content": node.text_content,
        "source_url": node.source_url,
        "status": node.status,
        "version": node.version,
        "created_at": node.created_at.isoformat() if node.created_at else None,
        "updated_at": node.updated_at.isoformat() if node.updated_at else None,
        "published_at": node.published_at.isoformat() if node.published_at else None,
        "has_children": len(node.children) > 0,
    }


def _build_tree(nodes: list, parent_id=None) -> list:
    result = []
    for n in nodes:
        pid = str(n.parent_id) if n.parent_id else None
        target = str(parent_id) if parent_id else None
        if pid == target:
            children = _build_tree(nodes, n.id)
            item = _serialize(n)
            item["children"] = children
            result.append(item)
    return result


@router.get("")
def list_nodes(parent_id: uuid.UUID | None = None, svc: NodeService = Depends(get_node_service)):
    if parent_id:
        nodes = svc.get_children(parent_id)
        return [_serialize(n) for n in nodes]
    nodes = svc.get_tree()
    return _build_tree(nodes)


@router.post("", status_code=status.HTTP_201_CREATED)
def create_node(body: NodeCreate, svc: NodeService = Depends(get_node_service)):
    node = svc.create(
        name=body.name,
        parent_id=body.parent_id,
        text_content=body.text_content,
        source_url=body.source_url,
    )
    return _serialize(node)


@router.get("/{node_id}")
def get_node(node_id: uuid.UUID, svc: NodeService = Depends(get_node_service)):
    try:
        return _serialize(svc.get(node_id))
    except ValueError as e:
        raise HTTPException(404, str(e))


@router.patch("/{node_id}")
def update_node(node_id: uuid.UUID, body: NodeUpdate, svc: NodeService = Depends(get_node_service)):
    try:
        fields = {k: v for k, v in body.model_dump(exclude={"change_note"}).items() if v is not None}
        node = svc.update(node_id, change_note=body.change_note, **fields)
        return _serialize(node)
    except ValueError as e:
        raise HTTPException(404, str(e))


@router.delete("/{node_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_node(node_id: uuid.UUID, svc: NodeService = Depends(get_node_service)):
    try:
        await svc.delete(node_id)
    except ValueError as e:
        raise HTTPException(404, str(e))


@router.get("/{node_id}/versions")
def list_versions(node_id: uuid.UUID, svc: NodeService = Depends(get_node_service)):
    try:
        versions = svc.list_versions(node_id)
        return [
            {
                "id": str(v.id),
                "version": v.version,
                "name": v.name,
                "text_content": v.text_content,
                "source_url": v.source_url,
                "status": v.status,
                "change_note": v.change_note,
                "changed_at": v.changed_at.isoformat() if v.changed_at else None,
            }
            for v in versions
        ]
    except ValueError as e:
        raise HTTPException(404, str(e))


@router.post("/{node_id}/versions/{version}/restore")
def restore_version(node_id: uuid.UUID, version: int, svc: NodeService = Depends(get_node_service)):
    try:
        node = svc.restore_version(node_id, version)
        return _serialize(node)
    except ValueError as e:
        raise HTTPException(404, str(e))


@router.post("/{node_id}/publish")
async def publish_node(node_id: uuid.UUID, svc: NodeService = Depends(get_node_service)):
    try:
        return await svc.publish(node_id)
    except ValueError as e:
        raise HTTPException(400, str(e))


@router.post("/{node_id}/unpublish")
async def unpublish_node(node_id: uuid.UUID, svc: NodeService = Depends(get_node_service)):
    try:
        return _serialize(await svc.unpublish(node_id))
    except ValueError as e:
        raise HTTPException(400, str(e))
