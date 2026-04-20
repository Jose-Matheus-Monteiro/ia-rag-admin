import type { FormInstance } from 'antd'
import { Button, Form, Tabs } from 'antd'
import { Input } from 'antd'
import { SwapOutlined } from '@ant-design/icons'

const { TextArea } = Input

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function renderPreview(text: string): string {
  if (!text?.trim()) return '<p style="color:#bbb;font-style:italic">Nenhum conteúdo</p>'

  const lines = text.split('\n')
  let html = ''
  let inCode = false
  let codeLines: string[] = []
  let tableLines: string[] = []

  function flushTable() {
    if (tableLines.length === 0) return
    html += '<table style="border-collapse:collapse;width:100%;margin:8px 0;font-size:13px">'
    tableLines.forEach((line, i) => {
      const cells = line.split('|').map((c) => c.trim()).filter(Boolean)
      const tag = i === 0 ? 'th' : 'td'
      const style = i === 0
        ? 'border:1px solid #d9d9d9;padding:4px 10px;background:#fafafa;font-weight:600'
        : 'border:1px solid #d9d9d9;padding:4px 10px'
      html += '<tr>' + cells.map((c) => `<${tag} style="${style}">${escapeHtml(c)}</${tag}>`).join('') + '</tr>'
    })
    html += '</table>'
    tableLines = []
  }

  for (const line of lines) {
    if (line.trim() === '[código]') {
      flushTable()
      inCode = true
      codeLines = []
      continue
    }
    if (line.trim() === '[/código]') {
      html += `<pre style="background:#f6f8fa;border:1px solid #e1e4e8;border-radius:6px;padding:12px;overflow-x:auto;font-family:'Courier New',monospace;font-size:13px;line-height:1.5;margin:8px 0"><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`
      inCode = false
      codeLines = []
      continue
    }
    if (inCode) {
      codeLines.push(line)
      continue
    }
    if (line.includes('|')) {
      tableLines.push(line)
      continue
    }
    flushTable()
    if (line.trim()) {
      html += `<p style="margin:4px 0;line-height:1.6">${escapeHtml(line)}</p>`
    } else {
      html += '<br>'
    }
  }

  if (inCode && codeLines.length > 0) {
    html += `<pre style="background:#f6f8fa;border:1px solid #e1e4e8;border-radius:6px;padding:12px;overflow-x:auto;font-family:'Courier New',monospace;font-size:13px"><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`
  }
  flushTable()

  return html
}

export function convertToRagText(text: string): string {
  return text
    .replace(/\[código\]\n?/g, '')
    .replace(/\[\/código\]\n?/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

interface Props {
  form: FormInstance
}

export default function TextPreviewEditor({ form }: Props) {
  const textContent = Form.useWatch('text_content', form) ?? ''

  function handleConvert() {
    form.setFieldValue('rag_content', convertToRagText(textContent))
  }

  const hasMarkers = textContent.includes('[código]') || textContent.includes('[/código]')

  const sourceTab = (
    <Form.Item name="text_content" noStyle>
      <TextArea
        rows={14}
        style={{ fontFamily: 'monospace', fontSize: 13, borderRadius: '0 0 6px 6px' }}
      />
    </Form.Item>
  )

  const previewTab = (
    <div
      style={{
        border: '1px solid #d9d9d9', borderRadius: '0 0 6px 6px',
        padding: '10px 14px', minHeight: 200, maxHeight: 380,
        overflowY: 'auto', fontSize: 14, lineHeight: 1.6, background: '#fff',
      }}
      dangerouslySetInnerHTML={{ __html: renderPreview(textContent) }}
    />
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <Tabs
          size="small"
          style={{ marginBottom: 0 }}
          items={[
            { key: 'source', label: 'Editar fonte', children: sourceTab },
            { key: 'preview', label: 'Preview formatado', children: previewTab },
          ]}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, height: 1, background: '#f0f0f0' }} />
        <Button
          icon={<SwapOutlined />}
          onClick={handleConvert}
          type={hasMarkers ? 'primary' : 'default'}
          ghost={hasMarkers}
        >
          Converter para RAG
        </Button>
        {hasMarkers && (
          <span style={{ color: '#fa8c16', fontSize: 12 }}>
            ⚠ contém marcadores
          </span>
        )}
        <div style={{ flex: 1, height: 1, background: '#f0f0f0' }} />
      </div>

      <div>
        <div style={{
          padding: '4px 10px', background: '#fafafa',
          border: '1px solid #d9d9d9', borderBottom: 'none',
          borderRadius: '6px 6px 0 0', fontSize: 12, color: '#595959', fontWeight: 500,
        }}>
          Texto para RAG
        </div>
        <Form.Item name="rag_content" noStyle>
          <TextArea
            rows={10}
            placeholder="Clique em 'Converter para RAG' para gerar o texto puro, ou escreva diretamente aqui"
            style={{ borderRadius: '0 0 6px 6px', fontSize: 13 }}
          />
        </Form.Item>
      </div>
    </div>
  )
}
