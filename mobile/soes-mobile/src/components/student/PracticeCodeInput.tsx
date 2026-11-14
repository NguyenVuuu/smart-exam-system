import { useRef, useState } from 'react'
import { Text, TextInput, TouchableOpacity, View } from 'react-native'
import { runPracticeSample, type PracticeSampleResult } from '../../api/student-learning.api'

const hints = {
  C: ['int', 'char', 'float', 'double', 'void', 'printf', 'scanf', 'strlen', 'malloc'],
  CPP: ['int', 'char', 'string', 'vector', 'bool', 'long long', 'std::cout', 'std::cin', 'std::sort'],
  JAVA: ['int', 'char', 'String', 'boolean', 'double', 'Math.max', 'Math.min', 'System.out.println', 'Scanner'],
} as const

export default function PracticeCodeInput({ setId, item, value, onChange, onFocusInput, completed }: {
  setId: string
  item: { id: string; orderIndex: number; language: 'C' | 'CPP' | 'JAVA'; sampleInput: string; sampleOutput: string;
    result?: { sourceCode: string; passedTestCases: number; totalTestCases: number } }
  value: string; onChange: (value: string) => void
  onFocusInput: (input: React.ElementRef<typeof TextInput> | null) => void
  completed: boolean
}) {
  const inputRef = useRef<React.ElementRef<typeof TextInput>>(null)
  const [cursor, setCursor] = useState(0)
  const [selection, setSelection] = useState<{ start: number; end: number } | undefined>()
  const [result, setResult] = useState<PracticeSampleResult | null>(null)
  const [error, setError] = useState('')
  const [running, setRunning] = useState(false)
  const prefix = value.slice(0, cursor).match(/[\w:.]+$/)?.[0] ?? ''
  const suggestions = prefix.length > 0 ? hints[item.language].filter((hint) =>
    hint.toLowerCase().startsWith(prefix.toLowerCase()) && hint !== prefix).slice(0, 5) : []

  const insert = (hint: string) => {
    const start = cursor - prefix.length
    const next = value.slice(0, start) + hint + value.slice(cursor)
    onChange(next); setResult(null)
    const position = start + hint.length
    setCursor(position); setSelection({ start: position, end: position })
    inputRef.current?.focus()
  }

  const run = async () => {
    setRunning(true); setError(''); setResult(null)
    try { setResult(await runPracticeSample(setId, item.id, value)) }
    catch { setError('Không thể chạy thử. Hãy thử lại.') }
    finally { setRunning(false) }
  }

  return <View style={{ gap: 8 }}>
    <Text style={{ color: '#475569', fontSize: 12 }}>Ví dụ đầu vào: {item.sampleInput}{'\n'}Ví dụ đầu ra: {item.sampleOutput}</Text>
    <Text style={{ color: '#334155', fontWeight: '600' }}>Mã nguồn {item.language}</Text>
    <TextInput ref={inputRef} onFocus={() => onFocusInput(inputRef.current)}
      value={item.result?.sourceCode ?? value}
      onChangeText={(next) => { onChange(next); setResult(null); setSelection(undefined) }}
      onSelectionChange={(event) => { setCursor(event.nativeEvent.selection.start); setSelection(undefined) }} selection={selection}
      editable={!completed && !running} multiline textAlignVertical="top" autoCapitalize="none"
      autoCorrect={false} accessibilityLabel={`Mã nguồn câu ${item.orderIndex}`}
      style={{ minHeight: 240, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10,
        padding: 12, fontFamily: 'monospace', color: '#0f172a' }} />
    {!completed && suggestions.length > 0 && <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {suggestions.map((hint) => <TouchableOpacity key={hint} accessibilityRole="button"
        accessibilityLabel={`Chèn ${hint}`} onPress={() => insert(hint)}
        style={{ borderRadius: 8, backgroundColor: '#dbeafe', paddingHorizontal: 9, paddingVertical: 6 }}>
        <Text style={{ color: '#1d4ed8', fontFamily: 'monospace' }}>{hint}</Text>
      </TouchableOpacity>)}
    </View>}
    {!completed && <TouchableOpacity accessibilityRole="button" disabled={!value.trim() || running}
      onPress={() => void run()} style={{ alignSelf: 'flex-start', borderRadius: 9, backgroundColor: '#2563eb',
        paddingHorizontal: 16, paddingVertical: 10, opacity: !value.trim() || running ? 0.5 : 1 }}>
      <Text style={{ color: '#fff', fontWeight: '700' }}>{running ? 'Đang chạy thử...' : 'Chạy thử ví dụ'}</Text>
    </TouchableOpacity>}
    {!!error && <Text accessibilityRole="alert" style={{ color: '#b91c1c' }}>{error}</Text>}
    {result && <View style={{ borderRadius: 9, backgroundColor: result.passed ? '#ecfdf5' : '#fffbeb', padding: 12, gap: 4 }}>
      <Text style={{ fontWeight: '700', color: result.passed ? '#047857' : '#92400e' }}>
        {result.passed ? 'Đúng với ví dụ' : `Chưa đúng với ví dụ · ${result.status}`}</Text>
      <Text>Đầu ra của bạn: {result.output || '(Không có đầu ra)'}</Text>
      {!!result.error && <Text style={{ color: '#b91c1c' }}>{result.error}</Text>}
    </View>}
    {item.result && <Text style={{ color: '#1d4ed8', fontWeight: '700' }}>
      Qua {item.result.passedTestCases}/{item.result.totalTestCases} test case
    </Text>}
  </View>
}
