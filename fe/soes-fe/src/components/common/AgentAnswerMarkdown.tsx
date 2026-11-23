import ReactMarkdown from 'react-markdown'

// Older answers put numbered Markdown items on one line. Keep them readable when reopened.
function formatAnswer(text: string) {
  return text
    .replace(/\\"/g, '"')
    .replace(/\$\\(?:right|longright)arrow\$/gi, '→')
    .replace(/\\(?:right|longright)arrow\b/gi, '→')
    .replace(/\$\\(?:left|longleft)arrow\$/gi, '←')
    .replace(/\\(?:left|longleft)arrow\b/gi, '←')
    .replace(/\$\\(?:Right|Longright)arrow\$/gi, '⇒')
    .replace(/\\(?:Right|Longright)arrow\b/gi, '⇒')
    .replace(/\$\\le\$/gi, '<=')
    .replace(/\\le\b/gi, '<=')
    .replace(/\$\\ge\$/gi, '>=')
    .replace(/\\ge\b/gi, '>=')
    .replace(/\$\\neq\$/gi, '!=')
    .replace(/\\neq\b/gi, '!=')
    .replace(/\$\\times\$/gi, '×')
    .replace(/\\times\b/gi, '×')
    .replace(/\$\\approx\$/gi, '≈')
    .replace(/\\approx\b/gi, '≈')
    .replace(/\$([a-zA-Z0-9_]{1,10})\$/g, '$1')
    .replace(/\s+(\d{1,2})\.\s+(?=\*\*)/g, (_match, number: string) => `${number === '1' ? '\n\n' : '\n'}${number}. `)
}

export default function AgentAnswerMarkdown({ text }: { text: string }) {
  return <div className="space-y-3 leading-relaxed text-slate-800">
    <ReactMarkdown skipHtml unwrapDisallowed
      allowedElements={[
        'p', 'strong', 'em', 'ol', 'ul', 'li', 'code', 'pre', 'blockquote',
        'h1', 'h2', 'h3', 'h4', 'hr', 'br', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
      ]}
      components={{
        p: ({ children }) => <p className="mb-2 leading-relaxed last:mb-0">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold text-slate-950">{children}</strong>,
        em: ({ children }) => <em className="italic text-slate-700">{children}</em>,
        ol: ({ children }) => <ol className="my-2 list-decimal space-y-1.5 pl-5 marker:font-semibold marker:text-blue-600">{children}</ol>,
        ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5 marker:text-blue-600">{children}</ul>,
        li: ({ children }) => <li className="pl-1 leading-relaxed">{children}</li>,
        code: ({ children }) => <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.875em] text-blue-700">{children}</code>,
        pre: ({ children }) => <pre className="my-2.5 overflow-x-auto rounded-lg bg-slate-950 p-3 font-mono text-xs leading-relaxed text-slate-100 shadow-sm [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-slate-100">{children}</pre>,
        blockquote: ({ children }) => <blockquote className="my-2 border-l-3 border-blue-400 bg-blue-50/50 py-1 pl-3 text-slate-700 rounded-r">{children}</blockquote>,
        h1: ({ children }) => <h3 className="mt-3.5 mb-1.5 font-bold text-base text-slate-950 border-b border-slate-100 pb-1">{children}</h3>,
        h2: ({ children }) => <h3 className="mt-3 mb-1.5 font-bold text-base text-slate-950">{children}</h3>,
        h3: ({ children }) => <h4 className="mt-2.5 mb-1 font-semibold text-sm text-slate-900">{children}</h4>,
        h4: ({ children }) => <h4 className="mt-2 mb-1 font-semibold text-sm text-slate-800">{children}</h4>,
        hr: () => <hr className="my-3 border-slate-200" />,
        table: ({ children }) => <div className="my-2.5 overflow-x-auto rounded-lg border border-slate-200"><table className="min-w-full divide-y divide-slate-200 text-left text-xs">{children}</table></div>,
        thead: ({ children }) => <thead className="bg-slate-50 font-semibold text-slate-900">{children}</thead>,
        th: ({ children }) => <th className="px-3 py-2 font-semibold text-slate-700">{children}</th>,
        td: ({ children }) => <td className="px-3 py-2 text-slate-700 border-t border-slate-100">{children}</td>,
        tr: ({ children }) => <tr className="hover:bg-slate-50/50">{children}</tr>,
      }}>
      {formatAnswer(text)}
    </ReactMarkdown>
  </div>
}
