import type { FormInstance } from 'antd'
import { Form } from 'antd'
import MDEditor from '@uiw/react-md-editor'

export function scrapedTextToMarkdown(text: string): string {
  if (!text) return ''
  const lines = text.split('\n')
  const out: string[] = []
  let inCode = false
  let tableLines: string[] = []

  function flushTable() {
    if (tableLines.length === 0) return
    const rows = tableLines.map((l) =>
      '| ' + l.split('|').map((c) => c.trim()).filter(Boolean).join(' | ') + ' |'
    )
    if (rows.length >= 1) {
      const cols = rows[0].split('|').filter(Boolean).length
      const sep = '|' + ' --- |'.repeat(cols)
      out.push(rows[0])
      out.push(sep)
      rows.slice(1).forEach((r) => out.push(r))
    }
    tableLines = []
  }

  for (const line of lines) {
    if (line.trim() === '[código]') {
      flushTable()
      inCode = true
      out.push('```')
      continue
    }
    if (line.trim() === '[/código]') {
      out.push('```')
      inCode = false
      continue
    }
    if (inCode) {
      out.push(line)
      continue
    }
    if (line.includes('|')) {
      tableLines.push(line)
      continue
    }
    flushTable()
    out.push(line)
  }
  flushTable()
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

export function convertToRagText(markdown: string): string {
  if (!markdown) return ''
  return markdown
    .replace(/```[\w]*\n?([\s\S]*?)```/g, '$1')
    .replace(/\|[-: ]+\|[-| :]*\n/g, '')
    .replace(/\|(.+)\|/g, (_, inner) =>
      inner.split('|').map((c: string) => c.trim()).filter(Boolean).join('  ')
    )
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

interface Props {
  form: FormInstance
}

export default function TextPreviewEditor({ form }: Props) {
  const value = Form.useWatch('text_content', form) ?? ''

  return (
    <div data-color-mode="light">
      <Form.Item name="text_content" noStyle>
        <MDEditor
          value={value}
          onChange={(v) => form.setFieldValue('text_content', v ?? '')}
          height={420}
          preview="live"
        />
      </Form.Item>
    </div>
  )
}
