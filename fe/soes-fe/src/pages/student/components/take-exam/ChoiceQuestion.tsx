import type {
  QuestionAnswer,
  TakeExamQuestion,
} from '../../types/take-exam.types'

interface ChoiceQuestionProps {
  question: TakeExamQuestion
  value: QuestionAnswer | undefined
  onChange: (value: string | string[]) => void
}

export default function ChoiceQuestion({ question, value, onChange }: ChoiceQuestionProps) {
  const isMultiple = question.type === 'MULTIPLE_CHOICE'
  const selectedValues = Array.isArray(value) ? value : value ? [value] : []

  function handleOptionChange(optionId: string) {
    if (!isMultiple) {
      onChange(optionId)
      return
    }

    const nextValue = selectedValues.includes(optionId)
      ? selectedValues.filter((selectedId) => selectedId !== optionId)
      : [...selectedValues, optionId]

    onChange(nextValue)
  }

  return (
    <fieldset className="space-y-3">
      <legend className="sr-only">
        {isMultiple ? 'Chọn một hoặc nhiều đáp án' : 'Chọn một đáp án'}
      </legend>
      {isMultiple && (
        <p className="text-xs text-slate-500">Bạn có thể chọn nhiều đáp án cho câu hỏi này.</p>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        {(question.options ?? []).map((option, index) => {
          const isSelected = selectedValues.includes(option.id)
          const inputId = `answer-${question.id}-${option.id}`
          const Input = isMultiple ? 'input' : 'input'

          return (
            <label
              key={option.id}
              htmlFor={inputId}
              className={`take-exam-choice group flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors focus-within:ring-2 focus-within:ring-blue-500/30 ${
                isSelected ? 'take-exam-choice--selected' : ''
              }`}
            >
              <Input
                id={inputId}
                name={`question-${question.id}`}
                type={isMultiple ? 'checkbox' : 'radio'}
                value={option.id}
                checked={isSelected}
                onChange={() => handleOptionChange(option.id)}
                className="h-4 w-4 shrink-0 accent-blue-600"
              />
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500 transition-colors group-hover:bg-blue-50 group-hover:text-blue-600">
                {String.fromCharCode(65 + index)}
              </span>
              <span className="min-w-0 text-sm font-medium leading-relaxed text-slate-700">
                {option.content}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
