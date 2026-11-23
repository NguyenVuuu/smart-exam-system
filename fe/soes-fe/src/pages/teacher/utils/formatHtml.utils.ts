function cleanMathAndEscapes(text: string): string {
  return text
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\(?:le|leq)\b/g, '≤')
    .replace(/\\(?:ge|geq)\b/g, '≥')
    .replace(/\\(?:ne|neq)\b/g, '≠')
    .replace(/\\(?:times)\b/g, '×')
    .replace(/\\(?:pm)\b/g, '±')
    .replace(/\\(?:dots|ldots)\b/g, '...')
    .replace(/\\(?:in)\b/g, '∈')
    .replace(/(-?\b\w+)\^([0-9a-zA-Z+-]+)/g, '$1<sup>$2</sup>')
    .replace(/\$([a-zA-Z])\$/g, '<em>$1</em>')
    .replace(/\$([^$]+)\$/g, (_match, inner) => inner.replace(/\b([a-zA-Z])\b/g, '<em>$1</em>'))
    .replace(/\$/g, '')
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function inlineFormat(text: string): string {
  let res = cleanMathAndEscapes(text)
  res = res.replace(/`([^`]+)`/g, '<code>$1</code>')
  res = res.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  res = res.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
  return res
}

/**
 * Chuyển đổi Markdown và văn bản thuần (plain text) có chứa các tiêu đề (###), danh sách (-),
 * khối mã (```), và công thức toán thành HTML hợp lệ (<h3>, <ul>, <li>, <pre><code>, <p>, <br />)
 * để Rich Text Editor (TinyMCE) và các thành phần hiển thị hiển thị định dạng chuẩn và đẹp mắt.
 */
export function formatPlainTextToHtml(content?: string | null): string {
  if (!content) return ''

  let raw = content

  // Nếu chuỗi trước đó đã bị bao bọc trong <p> nhưng chứa các ký hiệu markdown bên trong, bóc tách ra
  if (/<p>\s*#{1,6}\s+/i.test(raw) || (/<p>[\s\S]*?```/.test(raw) && !/<pre>/.test(raw))) {
    raw = raw.replace(/<\/?p>/gi, '\n\n').replace(/<br\s*\/?>/gi, '\n')
  }

  // Kiểm tra nếu đã chứa thẻ HTML cấu trúc và không còn marker markdown chưa xử lý
  const hasStructuredHtml = /<\/?(?:h[1-6]|ul|ol|li|pre|code|table|blockquote)\b/i.test(raw)
  const hasMarkdownMarkers = /^#{1,6}\s+|```|^[-*]\s+/m.test(raw)
  if (hasStructuredHtml && !hasMarkdownMarkers) {
    return cleanMathAndEscapes(raw)
  }

  // Bảo vệ code blocks khỏi các xử lý xuống dòng hoặc inline format
  const codeBlocks: string[] = []
  let processed = raw.replace(/```(?:[a-zA-Z0-9_-]+)?\r?\n([\s\S]*?)\r?\n```/g, (_match, code) => {
    const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`
    codeBlocks.push(`<pre><code>${escapeHtml(code.trim())}</code></pre>`)
    return `\n\n${placeholder}\n\n`
  })

  processed = processed.replace(/\r\n/g, '\n')
  const lines = processed.split('\n')
  const htmlParts: string[] = []
  let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null
  let currentParagraph: string[] = []

  function flushList() {
    if (currentList) {
      const tag = currentList.type
      const itemsHtml = currentList.items.map((it) => `<li>${inlineFormat(it)}</li>`).join('')
      htmlParts.push(`<${tag}>${itemsHtml}</${tag}>`)
      currentList = null
    }
  }

  function flushParagraph() {
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join('<br />')
      htmlParts.push(`<p>${inlineFormat(text)}</p>`)
      currentParagraph = []
    }
  }

  function flushAll() {
    flushList()
    flushParagraph()
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    if (!trimmed) {
      flushAll()
      continue
    }

    // Code block placeholder
    const cbMatch = trimmed.match(/^__CODE_BLOCK_(\d+)__$/)
    if (cbMatch) {
      flushAll()
      htmlParts.push(codeBlocks[Number(cbMatch[1])])
      continue
    }

    // Heading: ### Heading
    const hMatch = trimmed.match(/^(#{1,6})\s+(.*)$/)
    if (hMatch) {
      flushAll()
      const level = hMatch[1].length
      htmlParts.push(`<h${level}>${inlineFormat(hMatch[2])}</h${level}>`)
      continue
    }

    // Bullet list item: - Item or * Item or + Item
    const bulletMatch = trimmed.match(/^[-*+]\s+(.*)$/)
    if (bulletMatch) {
      flushParagraph()
      if (!currentList || currentList.type !== 'ul') {
        flushList()
        currentList = { type: 'ul', items: [] }
      }
      currentList.items.push(bulletMatch[1])
      continue
    }

    // Numbered list item: 1. Item
    const numMatch = trimmed.match(/^\d+\.\s+(.*)$/)
    if (numMatch) {
      flushParagraph()
      if (!currentList || currentList.type !== 'ol') {
        flushList()
        currentList = { type: 'ol', items: [] }
      }
      currentList.items.push(numMatch[1])
      continue
    }

    // Regular line -> thêm vào đoạn văn
    flushList()
    currentParagraph.push(trimmed)
  }

  flushAll()
  return htmlParts.join('\n')
}
