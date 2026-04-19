import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum

from sqlalchemy import (
    Column, String, Text, Integer, ForeignKey,
    DateTime, Enum
)
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship

from core.database import Base


def _now():
    return datetime.now(timezone.utc)


class NodeStatus(str, PyEnum):
    draft = "draft"
    active = "active"
    archived = "archived"


class Node(Base):
    __tablename__ = "nodes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("nodes.id"), nullable=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    tags = Column(ARRAY(String), nullable=True, default=list)
    text_content = Column(Text, nullable=True)
    source_url = Column(Text, nullable=True)
    status = Column(Enum(NodeStatus), default=NodeStatus.draft, nullable=False)
    version = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime(timezone=True), default=_now)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)
    published_at = Column(DateTime(timezone=True), nullable=True)

    parent = relationship("Node", remote_side=[id], back_populates="children")
    children = relationship("Node", back_populates="parent", cascade="all, delete-orphan")
    versions = relationship("NodeVersion", back_populates="node", cascade="all, delete-orphan", order_by="NodeVersion.version.desc()")


class NodeVersion(Base):
    __tablename__ = "node_versions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    node_id = Column(UUID(as_uuid=True), ForeignKey("nodes.id"), nullable=False)
    version = Column(Integer, nullable=False)
    name = Column(String(255), nullable=True)
    text_content = Column(Text, nullable=True)
    source_url = Column(Text, nullable=True)
    status = Column(String(50), nullable=True)
    change_note = Column(Text, nullable=True)
    changed_at = Column(DateTime(timezone=True), default=_now)

    node = relationship("Node", back_populates="versions")
