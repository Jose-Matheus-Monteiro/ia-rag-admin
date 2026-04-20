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

  const lines = markdown.split('\n')
  const out: string[] = []
  let inCode = false
  let codeLang = ''
  let tableLines: string[] = []
  let tableHeaders: string[] = []

  function parseRow(line: string): string[] {
    return line.split('|').map((c) => c.trim()).filter(Boolean)
  }

  function flushTable() {
    if (tableLines.length === 0) return
    const dataRows = tableLines.filter((l) => !/^\s*\|?[-: |]+\|?\s*$/.test(l))
    if (tableHeaders.length > 0) {
      dataRows.forEach((row) => {
        const cells = parseRow(row)
        const formatted = cells
          .map((c, i) => (tableHeaders[i] ? `${tableHeaders[i]}: ${c}` : c))
          .join(' | ')
        out.push(formatted)
      })
    } else {
      dataRows.forEach((row) => out.push(parseRow(row).join(' | ')))
    }
    tableLines = []
    tableHeaders = []
  }

  for (const line of lines) {
    const codeStart = line.match(/^```(\w*)/)
    if (codeStart && !inCode) {
      flushTable()
      inCode = true
      codeLang = codeStart[1] || ''
      out.push(codeLang ? `[código ${codeLang}]` : '[código]')
      continue
    }
    if (line.match(/^```/) && inCode) {
      out.push('[/código]')
      inCode = false
      codeLang = ''
      continue
    }
    if (inCode) {
      out.push(line)
      continue
    }

    if (line.trimStart().startsWith('|')) {
      if (/^\s*\|?[-: |]+\|?\s*$/.test(line)) {
        if (tableLines.length > 0) {
          tableHeaders = parseRow(tableLines[tableLines.length - 1])
          tableLines.pop()
        }
        continue
      }
      tableLines.push(line)
      continue
    }
    flushTable()

    let p = line
      .replace(/^#{1,6}\s+/, '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/`(.+?)`/g, '$1')
      .replace(/\[(.+?)\]\(.+?\)/g, '$1')
      .replace(/^[-*+]\s+/, '• ')
      .replace(/^\d+\.\s+/, (m) => m)
    out.push(p)
  }
  flushTable()

  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim()
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
