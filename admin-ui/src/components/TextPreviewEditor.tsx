import type { FormInstance } from 'antd'
import { Button, Form } from 'antd'
import { Input } from 'antd'
import { SwapOutlined } from '@ant-design/icons'

const { TextArea } = Input

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function renderPreview(text: string): string {
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
      const rowStyle = i === 0 ? 'background:#fafafa;font-weight:600' : ''
      html += `<tr style="${rowStyle}">` + cells.map((c) =>
        `<${tag} style="border:1px solid #d9d9d9;padding:4px 10px">${c}</${tag}>`
      ).join('') + '</tr>'
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

function convertToRagText(text: string): string {
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
  const text = Form.useWatch('text_content', form) ?? ''

  function handleConvert() {
    form.setFieldValue('text_content', convertToRagText(text))
  }

  const hasMarkers = text.includes('[código]') || text.includes('[/código]')

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 4, alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: '#8c8c8c', flex: 1 }}>
          {hasMarkers && (
            <span style={{ color: '#fa8c16' }}>⚠ Texto contém marcadores — clique em Converter antes de publicar</span>
          )}
        </span>
        {hasMarkers && (
          <Button size="small" icon={<SwapOutlined />} onClick={handleConvert}>
            Converter para RAG
          </Button>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{
            padding: '4px 10px', background: '#fafafa',
            border: '1px solid #d9d9d9', borderBottom: 'none',
            borderRadius: '6px 6px 0 0', fontSize: 12, color: '#595959', fontWeight: 500,
          }}>
            Editar
          </div>
          <Form.Item name="text_content" noStyle>
            <TextArea
              rows={18}
              style={{ borderRadius: '0 0 6px 6px', fontFamily: 'monospace', fontSize: 13, resize: 'vertical' }}
            />
          </Form.Item>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{
            padding: '4px 10px', background: '#fafafa',
            border: '1px solid #d9d9d9', borderBottom: 'none',
            borderRadius: '6px 6px 0 0', fontSize: 12, color: '#595959', fontWeight: 500,
          }}>
            Preview
          </div>
          <div
            style={{
              border: '1px solid #d9d9d9', borderRadius: '0 0 6px 6px',
              padding: '8px 12px', minHeight: 200, maxHeight: 432, overflowY: 'auto',
              fontSize: 14, lineHeight: 1.6, background: '#fff',
            }}
            dangerouslySetInnerHTML={{ __html: renderPreview(text) }}
          />
        </div>
      </div>
    </div>
  )
}
