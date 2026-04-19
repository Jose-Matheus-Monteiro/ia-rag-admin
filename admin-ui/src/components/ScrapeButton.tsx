import { useState } from 'react'
import { Button, message } from 'antd'
import { LinkOutlined } from '@ant-design/icons'
import { api } from '../api/client'

interface Props {
  url: string
  onResult: (text: string) => void
}

export default function ScrapeButton({ url, onResult }: Props) {
  const [loading, setLoading] = useState(false)

  async function scrape() {
    if (!url) { message.warning('Informe a URL primeiro'); return }
    setLoading(true)
    try {
      const result = await api.scrape(url)
      if (result.text) {
        onResult(result.text)
        message.success('Texto extraído com sucesso')
      } else {
        message.warning('Nenhum texto extraído da URL')
      }
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : 'Erro ao extrair URL')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button icon={<LinkOutlined />} onClick={scrape} loading={loading} size="small">
      Extrair texto
    </Button>
  )
}
