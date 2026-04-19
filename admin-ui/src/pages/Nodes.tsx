import { useState } from 'react'
import { Layout } from 'antd'
import NodeTree from '../components/NodeTree'
import NodeEditor from '../components/NodeEditor'

const { Sider, Content } = Layout

type EditorMode = { type: 'view'; id: string } | { type: 'create'; parentId: string | null }

export default function Nodes() {
  const [editorState, setEditorState] = useState<EditorMode | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  function refresh() { setRefreshTrigger((n) => n + 1) }

  function onSaved(id: string) {
    refresh()
    setEditorState({ type: 'view', id })
  }

  return (
    <Layout style={{ height: '100%' }}>
      <Sider width={280} theme="light" style={{ borderRight: '1px solid #f0f0f0', padding: 12 }}>
        <NodeTree
          selectedId={editorState?.type === 'view' ? editorState.id : null}
          onSelect={(id) => setEditorState({ type: 'view', id })}
          onCreateRoot={() => setEditorState({ type: 'create', parentId: null })}
          refreshTrigger={refreshTrigger}
        />
      </Sider>
      <Content style={{ overflow: 'auto', padding: 16 }}>
        <NodeEditor
          nodeId={editorState?.type === 'view' ? editorState.id : null}
          parentId={editorState?.type === 'create' ? editorState.parentId : null}
          mode={editorState?.type === 'create' ? 'create' : 'view'}
          onSaved={onSaved}
          onDeleted={() => { refresh(); setEditorState(null) }}
          onCreateChild={(parentId) => setEditorState({ type: 'create', parentId })}
        />
      </Content>
    </Layout>
  )
}
