import { useEffect, useState } from 'react'
import { Table, Button, Popconfirm, message, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { api, type NodeVersion } from '../api/client'

interface Props {
  nodeId: string
  onRestore: () => void
}

export default function VersionHistory({ nodeId, onRestore }: Props) {
  const [versions, setVersions] = useState<NodeVersion[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.getVersions(nodeId)
      .then(setVersions)
      .catch(() => message.error('Erro ao carregar histórico'))
      .finally(() => setLoading(false))
  }, [nodeId])

  async function restore(version: number) {
    try {
      await api.restoreVersion(nodeId, version)
      message.success(`Versão ${version} restaurada`)
      onRestore()
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : 'Erro ao restaurar versão')
    }
  }

  const columns: ColumnsType<NodeVersion> = [
    { title: 'Versão', dataIndex: 'version', width: 80 },
    { title: 'Nome', dataIndex: 'name' },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 100,
      render: (s: string) => <Tag>{s}</Tag>,
    },
    { title: 'Nota', dataIndex: 'change_note' },
    {
      title: 'Data',
      dataIndex: 'changed_at',
      render: (d: string) => d ? new Date(d).toLocaleString('pt-BR') : '-',
    },
    {
      title: '',
      width: 90,
      render: (_, record) => (
        <Popconfirm title="Restaurar esta versão?" onConfirm={() => restore(record.version)}>
          <Button size="small">Restaurar</Button>
        </Popconfirm>
      ),
    },
  ]

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={versions}
      loading={loading}
      size="small"
      pagination={false}
    />
  )
}
