import { useEffect, useState } from 'react'
import type { FormInstance } from 'antd'
import {
  Button, Form, Input, Select, Space, Tabs, Popconfirm, message, Spin, Tag
} from 'antd'

function ScrapeSection({ form, onResult }: { form: FormInstance; onResult: (text: string) => void }) {
  const sourceUrl = Form.useWatch('source_url', form) ?? ''
  return (
    <Space.Compact style={{ width: '100%' }}>
      <Form.Item name="source_url" noStyle>
        <Input placeholder="https://..." />
      </Form.Item>
      <ScrapeButton url={sourceUrl} onResult={onResult} />
    </Space.Compact>
  )
}
import {
  SaveOutlined, DeleteOutlined, SendOutlined, PlusOutlined, HistoryOutlined, StopOutlined
} from '@ant-design/icons'
import { api, type Node, type NodeCreate } from '../api/client'
import ScrapeButton from './ScrapeButton'
import VersionHistory from './VersionHistory'

const { TextArea } = Input

interface Props {
  nodeId: string | null
  parentId: string | null
  mode: 'view' | 'create'
  onSaved: (id: string) => void
  onDeleted: () => void
  onCreateChild: (parentId: string) => void
}

export default function NodeEditor({ nodeId, parentId, mode, onSaved, onDeleted, onCreateChild }: Props) {
  const [form] = Form.useForm()
  const [node, setNode] = useState<Node | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [activeTab, setActiveTab] = useState('editor')

  useEffect(() => {
    if (mode === 'create') {
      form.resetFields()
      form.setFieldsValue({ status: 'draft' })
      setNode(null)
      return
    }
    if (!nodeId) return
    setLoading(true)
    api.getNode(nodeId)
      .then((n) => {
        setNode(n)
        form.setFieldsValue({
          name: n.name,
          text_content: n.text_content ?? '',
          source_url: n.source_url ?? '',
          status: n.status,
          change_note: '',
        })
      })
      .catch(() => message.error('Erro ao carregar nó'))
      .finally(() => setLoading(false))
  }, [nodeId, mode, form])

  async function onFinish(values: Record<string, string>) {
    setSaving(true)
    try {
      if (mode === 'create') {
        const body: NodeCreate = {
          name: values.name,
          parent_id: parentId ?? null,
          text_content: values.text_content || null,
          source_url: values.source_url || null,
        }
        const created = await api.createNode(body)
        message.success('Nó criado')
        onSaved(created.id)
      } else if (nodeId) {
        const updated = await api.updateNode(nodeId, {
          name: values.name,
          text_content: values.text_content || null,
          source_url: values.source_url || null,
          status: values.status,
          change_note: values.change_note || undefined,
        })
        setNode(updated)
        message.success('Salvo')
        onSaved(updated.id)
      }
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  async function deleteNode() {
    if (!nodeId) return
    try {
      await api.deleteNode(nodeId)
      message.success('Nó deletado')
      onDeleted()
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : 'Erro ao deletar')
    }
  }

  async function unpublish() {
    if (!nodeId) return
    try {
      const updated = await api.unpublishNode(nodeId)
      setNode(updated)
      form.setFieldValue('status', updated.status)
      message.success('Removido do RAG e arquivado')
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : 'Erro ao remover do RAG')
    }
  }

  async function publish() {
    if (!nodeId) return
    setPublishing(true)
    try {
      await api.publishNode(nodeId)
      const updated = await api.getNode(nodeId)
      setNode(updated)
      message.success('Publicado no RAG')
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : 'Erro ao publicar')
    } finally {
      setPublishing(false)
    }
  }

  if (!nodeId && mode !== 'create') {
    return <div style={{ padding: 24, color: '#999' }}>Selecione um nó ou crie um novo</div>
  }

  if (loading) return <Spin style={{ padding: 24 }} />

  const editorTab = (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <Form.Item name="name" label="Nome" rules={[{ required: true }]}>
        <Input />
      </Form.Item>

      <Form.Item label="URL da fonte" style={{ marginBottom: 4 }}>
        <ScrapeSection form={form} onResult={(text) => form.setFieldValue('text_content', text)} />
      </Form.Item>

      <Form.Item name="text_content" label="Conteúdo de texto">
        <TextArea rows={8} />
      </Form.Item>

      <Form.Item name="status" label="Status">
        <Select options={[
          { value: 'draft', label: 'Rascunho' },
          { value: 'active', label: 'Ativo' },
          { value: 'archived', label: 'Arquivado' },
        ]} />
      </Form.Item>

      {mode === 'view' && (
        <Form.Item name="change_note" label="Nota da alteração">
          <Input placeholder="Opcional" />
        </Form.Item>
      )}

      <Form.Item>
        <Space wrap>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
            {mode === 'create' ? 'Criar' : 'Salvar'}
          </Button>
          {mode === 'view' && nodeId && (
            <>
              <Button icon={<PlusOutlined />} onClick={() => onCreateChild(nodeId)}>
                Adicionar filho
              </Button>
              <Button icon={<SendOutlined />} onClick={publish} loading={publishing}>
                Publicar no RAG
              </Button>
              {node?.status === 'active' && (
                <Popconfirm title="Remover do RAG e arquivar o nó?" onConfirm={unpublish}>
                  <Button icon={<StopOutlined />}>Remover do RAG</Button>
                </Popconfirm>
              )}
              <Popconfirm title="Deletar este nó permanentemente?" onConfirm={deleteNode}>
                <Button danger icon={<DeleteOutlined />}>Deletar</Button>
              </Popconfirm>
            </>
          )}
        </Space>
      </Form.Item>

      {node && (
        <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 8, marginTop: 4 }}>
          <Space size="middle" style={{ color: '#8c8c8c', fontSize: 12, flexWrap: 'wrap' }}>
            <span>v{node.version}</span>
            <Tag color={node.status === 'active' ? 'green' : node.status === 'archived' ? 'red' : 'default'} style={{ margin: 0 }}>
              {node.status}
            </Tag>
            {node.created_at && (
              <span>Criado em: <strong>{new Date(node.created_at).toLocaleString('pt-BR')}</strong></span>
            )}
            {node.updated_at && node.updated_at !== node.created_at && (
              <span>Atualizado: <strong>{new Date(node.updated_at).toLocaleString('pt-BR')}</strong></span>
            )}
            {node.published_at && (
              <span>Indexado em: <strong>{new Date(node.published_at).toLocaleString('pt-BR')}</strong></span>
            )}
          </Space>
        </div>
      )}
    </Form>
  )

  const items = [
    { key: 'editor', label: 'Editor', children: editorTab },
    ...(mode === 'view' && nodeId ? [{
      key: 'history',
      label: <span><HistoryOutlined /> Histórico</span>,
      children: <VersionHistory nodeId={nodeId} onRestore={() => { onSaved(nodeId); setActiveTab('editor') }} />,
    }] : []),
  ]

  return (
    <div style={{ padding: '0 16px' }}>
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={items} />
    </div>
  )
}
