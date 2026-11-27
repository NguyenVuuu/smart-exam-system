const VIETNAMESE_ACCENT_REGEX = /[àáảãạăắằẳẵặâấầẩẫậđèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ]/i

const DIACRITIC_MAP: Array<[RegExp, string]> = [
  [/\buoc chung lon nhat\b/gi, 'ước chung lớn nhất'],
  [/\bboi chung nho nhat\b/gi, 'bội chung nhỏ nhất'],
  [/\btrung binh cong\b/gi, 'trung bình cộng'],
  [/\bmang mot chieu\b/gi, 'mảng một chiều'],
  [/\bmang hai chieu\b/gi, 'mảng hai chiều'],
  [/\bso chinh phuong\b/gi, 'số chính phương'],
  [/\bso nguyen to\b/gi, 'số nguyên tố'],
  [/\bso hoan hao\b/gi, 'số hoàn hảo'],
  [/\bso doi xung\b/gi, 'số đối xứng'],
  [/\bso nguyen\b/gi, 'số nguyên'],
  [/\bso duong\b/gi, 'số dương'],
  [/\bso am\b/gi, 'số âm'],
  [/\bso thuc\b/gi, 'số thực'],
  [/\bxau ky tu\b/gi, 'xâu ký tự'],
  [/\bky tu\b/gi, 'ký tự'],
  [/\btinh tong\b/gi, 'tính tổng'],
  [/\btinh tich\b/gi, 'tính tích'],
  [/\btinh giai thua\b/gi, 'tính giai thừa'],
  [/\bgiai thua\b/gi, 'giai thừa'],
  [/\btong cac phan tu\b/gi, 'tổng các phần tử'],
  [/\bcac phan tu\b/gi, 'các phần tử'],
  [/\bphan tu\b/gi, 'phần tử'],
  [/\bo chi so\b/gi, 'ở chỉ số'],
  [/\bchi so\b/gi, 'chỉ số'],
  [/\btim kiem\b/gi, 'tìm kiếm'],
  [/\bsap xep\b/gi, 'sắp xếp'],
  [/\btang dan\b/gi, 'tăng dần'],
  [/\bgiam dan\b/gi, 'giảm dần'],
  [/\blon nhat\b/gi, 'lớn nhất'],
  [/\bnho nhat\b/gi, 'nhỏ nhất'],
  [/\blon hon\b/gi, 'lớn hơn'],
  [/\bnho hon\b/gi, 'nhỏ hơn'],
  [/\btrong mang\b/gi, 'trong mảng'],
  [/\btrong chuoi\b/gi, 'trong chuỗi'],
  [/\bdem so luong\b/gi, 'đếm số lượng'],
  [/\bso luong\b/gi, 'số lượng'],
  [/\bdem so\b/gi, 'đếm số'],
  [/\bchia het cho\b/gi, 'chia hết cho'],
  [/\bchia het\b/gi, 'chia hết'],
  [/\bdao nguoc\b/gi, 'đảo ngược'],
  [/\bduyet mang\b/gi, 'duyệt mảng'],
  [/\bxoa phan tu\b/gi, 'xóa phần tử'],
  [/\bchen phan tu\b/gi, 'chèn phần tử'],
  [/\bkiem tra\b/gi, 'kiểm tra'],
  [/\bviet chuong trinh\b/gi, 'viết chương trình'],
  [/\bchuong trinh\b/gi, 'chương trình'],
  [/\bchan\b/gi, 'chẵn'],
  [/\ble\b/gi, 'lẻ'],
  [/\bmang\b/gi, 'mảng'],
  [/\bchuoi\b/gi, 'chuỗi'],
  [/\bdem\b/gi, 'đếm'],
  [/\btinh\b/gi, 'tính'],
  [/\btim\b/gi, 'tìm'],
  [/\bday so\b/gi, 'dãy số'],
]

export function restoreVietnameseDiacritics(text?: string | null): string {
  if (!text) return ''
  if (VIETNAMESE_ACCENT_REGEX.test(text)) return text

  let result = text
  for (const [regex, replacement] of DIACRITIC_MAP) {
    result = result.replace(regex, replacement)
  }

  if (result !== text && result.length > 0) {
    result = result.charAt(0).toUpperCase() + result.slice(1)
  }
  return result
}

export function cleanPlainTextMath(text?: string | null): string {
  if (!text) return ''
  return text
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\(?:le|leq)\b/g, '≤')
    .replace(/\\(?:ge|geq)\b/g, '≥')
    .replace(/\\(?:ne|neq)\b/g, '≠')
    .replace(/\\(?:times)\b/g, '×')
    .replace(/\\(?:pm)\b/g, '±')
    .replace(/\\(?:dots|ldots)\b/g, '...')
    .replace(/\\(?:in)\b/g, '∈')
    .replace(/\$([a-zA-Z0-9_.-]+)\$/g, '$1')
    .replace(/\$([^$]+)\$/g, (_match, inner) => inner)
    .replace(/\$/g, '')
    .trim()
}

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

  // 1. Chuẩn hóa tất cả các ký tự xuống dòng bị escape thành xuống dòng thật
  let raw = content
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')

  // 2. Nếu chuỗi trước đó đã bị bao bọc nhầm trong <h1-6> hoặc <p> chứa cả đoạn dài có \n, bóc tách ra
  if (/<h[1-6]>[^<]*?\n[\s\S]*?<\/h[1-6]>/i.test(raw) || /<p>\s*#{1,6}\s+/i.test(raw) || (/<p>[\s\S]*?```/.test(raw) && !/<pre>/.test(raw))) {
    raw = raw
      .replace(/<\/?(?:p|h[1-6])>/gi, '\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
  }

  // 3. Kiểm tra nếu đã chứa thẻ HTML cấu trúc và không còn marker markdown chưa xử lý
  const hasStructuredHtml = /<\/?(?:h[1-6]|ul|ol|li|pre|code|table|blockquote)\b/i.test(raw)
  const hasMarkdownMarkers = /^#{1,6}\s+|```|^[-*+]\s+/m.test(raw)
  if (hasStructuredHtml && !hasMarkdownMarkers) {
    return cleanMathAndEscapes(raw)
  }

  // 4. Bảo vệ code blocks khỏi các xử lý xuống dòng hoặc inline format
  const codeBlocks: string[] = []
  let processed = raw.replace(/```(?:[a-zA-Z0-9_-]+)?\s*[\r\n]([\s\S]*?)```/g, (_match, code) => {
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

  const SECTION_HEADING_REGEX = /^(?:#{1,6}\s+)?(Mô tả bài toán|Định dạng đầu vào(?:\s*\(Input\))?|Định dạng đầu ra(?:\s*\(Output\))?|Ràng buộc|Ví dụ mẫu)(?::)?$/i

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

    // Section heading: nhận diện mục chuẩn bài lập trình (dù có ### hay không)
    const sectionMatch = trimmed.match(SECTION_HEADING_REGEX)
    if (sectionMatch) {
      flushAll()
      htmlParts.push(`<h3>${inlineFormat(sectionMatch[1])}</h3>`)
      continue
    }

    // Heading: ### Heading
    const hMatch = trimmed.match(/^(#{1,6})\s+(.*)$/)
    if (hMatch) {
      flushAll()
      const level = Math.min(6, Math.max(3, hMatch[1].length))
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
