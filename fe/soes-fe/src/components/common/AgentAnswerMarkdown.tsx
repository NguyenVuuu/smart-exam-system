import ReactMarkdown from 'react-markdown'

// Older answers put numbered Markdown items on one line. Keep them readable when reopened.
function formatAnswer(text: string) {
  return text.replace(/\\"/g, '"')
    .replace(/\s+(\d{1,2})\.\s+(?=\*\*)/g, (_match, number: string) => `${number === '1' ? '\n\n' : '\n'}${number}. `)
}

export default function AgentAnswerMarkdown({ text }: { text: string }) {
  return <div className="space-y-3 leading-6 text-slate-800">
    <ReactMarkdown skipHtml unwrapDisallowed
      allowedElements={['p', 'strong', 'em', 'ol', 'ul', 'li', 'code', 'pre', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'br']}
      components={{
        p: ({ children }) => <p>{children}</p>,
        strong: ({ children }) => <strong className="font-semibold text-slate-950">{children}</strong>,
        ol: ({ children }) => <ol className="list-decimal space-y-2 pl-5 marker:font-semibold marker:text-blue-600">{children}</ol>,
        ul: ({ children }) => <ul className="list-disc space-y-1 pl-5 marker:text-blue-600">{children}</ul>,
        li: ({ children }) => <li className="pl-1">{children}</li>,
        code: ({ children }) => <code className="rounded bg-slate-100 px-1 py-0.5 text-[0.9em] text-blue-800">{children}</code>,
        pre: ({ children }) => <pre className="overflow-x-auto rounded-lg bg-slate-950 p-3 text-slate-100 [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-slate-100">{children}</pre>,
        blockquote: ({ children }) => <blockquote className="border-l-2 border-blue-300 pl-3 text-slate-600">{children}</blockquote>,
        h1: ({ children }) => <h3 className="font-bold text-slate-950">{children}</h3>,
        h2: ({ children }) => <h3 className="font-bold text-slate-950">{children}</h3>,
        h3: ({ children }) => <h3 className="font-semibold text-slate-950">{children}</h3>,
        h4: ({ children }) => <h4 className="font-semibold text-slate-950">{children}</h4>,
      }}>
      {formatAnswer(text)}
    </ReactMarkdown>
  </div>
}
