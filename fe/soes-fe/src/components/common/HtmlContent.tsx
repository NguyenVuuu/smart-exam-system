import DOMPurify from 'dompurify'

interface HtmlContentProps {
  content?: string | null
  className?: string
}

export default function HtmlContent({ content, className = '' }: HtmlContentProps) {
  if (!content) return null

  const isHtml = /<[a-z][\s\S]*>/i.test(content)

  if (!isHtml) {
    return <div className={`whitespace-pre-wrap ${className}`}>{content}</div>
  }

  const safeHtml = DOMPurify.sanitize(content, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['form', 'input', 'button', 'textarea', 'select', 'option'],
  })

  return (
    <div
      className={`overflow-x-auto break-words leading-relaxed text-slate-900
        [&_a]:text-blue-600 [&_a]:underline [&_a]:underline-offset-2
        [&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-slate-200 [&_blockquote]:pl-4 [&_blockquote]:text-slate-600
        [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs
        [&_h1]:mb-2 [&_h1]:text-lg [&_h1]:font-semibold
        [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-semibold
        [&_h3]:mb-2 [&_h3]:text-sm [&_h3]:font-semibold
        [&_img]:my-3 [&_img]:inline-block [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-lg [&_img]:align-top
        [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5
        [&_p]:mb-2 [&_p:last-child]:mb-0
        [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-slate-100 [&_pre]:p-3
        [&_table]:my-2 [&_table]:w-full [&_table]:border-collapse
        [&_td]:border [&_td]:border-slate-200 [&_td]:p-2
        [&_th]:border [&_th]:border-slate-200 [&_th]:bg-slate-50 [&_th]:p-2 [&_th]:text-left
        [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5
        ${className}`}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  )
}
