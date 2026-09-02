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

  return (
    <div
      className={`overflow-x-auto leading-relaxed text-slate-900 
        [&_img]:inline-block [&_img]:align-top [&_img]:rounded-lg [&_img]:my-3
        [&_p]:mb-2 [&_p:last-child]:mb-0 
        [&_pre]:bg-slate-100 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-2
        [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono
        [&_table]:w-full [&_table]:border-collapse [&_table]:my-2
        [&_th]:border [&_th]:border-slate-200 [&_th]:bg-slate-50 [&_th]:p-2 [&_th]:text-left
        [&_td]:border [&_td]:border-slate-200 [&_td]:p-2
        [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2
        [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2
        ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}
