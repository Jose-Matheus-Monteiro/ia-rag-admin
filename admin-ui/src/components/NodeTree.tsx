import { useEffect, useState } from 'react'
import { Tree, Button, Spin, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { DataNode } from 'antd/es/tree'
import { api, type Node } from '../api/client'

interface Props {
  selectedId: string | null
  onSelect: (id: string) => void
  onCreateRoot: () => void
  refreshTrigger: number
}

function toTreeData(nodes: Node[]): DataNode[] {
  return nodes.map((n) => ({
    key: n.id,
    title: n.name,
    isLeaf: !n.has_children && (!n.children || n.children.length === 0),
    children: n.children ? toTreeData(n.children) : undefined,
  }))
}

export default function NodeTree({ selectedId, onSelect, onCreateRoot, refreshTrigger }: Props) {
  const [treeData, setTreeData] = useState<DataNode[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedKeys, setExpandedKeys] = useState<string[]>([])

  async function loadTree() {
    setLoading(true)
    try {
      const nodes = await api.getNodes()
      setTreeData(toTreeData(nodes))
    } catch {
      message.error('Erro ao carregar árvore')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadTree() }, [refreshTrigger])

  async function onLoadData(node: DataNode) {
    const id = node.key as string
    const children = await api.getNodes(id)
    function inject(items: DataNode[]): DataNode[] {
      return items.map((item) => {
        if (item.key === id) {
          return { ...item, children: toTreeData(children), isLeaf: children.length === 0 }
        }
        if (item.children) return { ...item, children: inject(item.children) }
        return item
      })
    }
    setTreeData((prev) => inject(prev))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Button icon={<PlusOutlined />} onClick={onCreateRoot} block>
        Novo nó raiz
      </Button>
      {loading ? (
        <Spin />
      ) : (
        <Tree
          treeData={treeData}
          loadData={onLoadData}
          selectedKeys={selectedId ? [selectedId] : []}
          expandedKeys={expandedKeys}
          onExpand={(keys) => setExpandedKeys(keys as string[])}
          onSelect={(keys) => keys.length && onSelect(keys[0] as string)}
          blockNode
        />
      )}
    </div>
  )
}
