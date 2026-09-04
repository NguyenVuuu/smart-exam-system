/**
 * Chuyển đổi văn bản thuần (plain text) có chứa các ký tự xuống dòng (\n)
 * thành HTML hợp lệ (<p>, <br />) để Rich Text Editor (TinyMCE) và các thành phần hiển thị
 * không bị mất định dạng xuống dòng và phân đoạn.
 */
export function formatPlainTextToHtml(content?: string | null): string {
  if (!content) return ''

  // Kiểm tra nếu đã chứa thẻ HTML cấu trúc
  const hasHtmlTags = /<\/?(?:p|div|br|ul|ol|li|h[1-6]|table|thead|tbody|tr|td|th|pre|code|blockquote|section|article)\b/i.test(content)
  if (hasHtmlTags) {
    return content
  }

  // Tách các đoạn văn phân cách bởi 2 hoặc nhiều dấu xuống dòng (\n\n+)
  const paragraphs = content
    .split(/\r?\n\r?\n+/)
    .map((block) => {
      const trimmed = block.trim()
      if (!trimmed) return ''
      // Thay thế các dấu xuống dòng đơn lẻ trong từng đoạn thành <br />
      const withBr = trimmed.replace(/\r?\n/g, '<br />')
      return `<p>${withBr}</p>`
    })
    .filter(Boolean)

  return paragraphs.length > 0 ? paragraphs.join('') : `<p>${content}</p>`
}
