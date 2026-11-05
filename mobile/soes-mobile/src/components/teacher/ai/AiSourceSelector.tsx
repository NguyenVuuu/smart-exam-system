import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { AiMaterial, AiSourceFile } from '../../../types/teacher-ai.types'
import type { QuestionSubject } from '../../../types/teacher-questions.types'
import { ChoicePicker } from '../../ui/ChoicePicker'

interface Props { subjects: QuestionSubject[]; subjectId: string; onSubject: (id: string) => void
  sourceType: 'COURSE_MATERIAL' | 'UPLOAD_FILE'; onSourceType: (type: 'COURSE_MATERIAL' | 'UPLOAD_FILE') => void
  materials: AiMaterial[]; materialIds: string[]; onToggleMaterial: (id: string) => void
  sourceFile: AiSourceFile | null; pendingFileName: string | null; onPickFile: () => void; busy: boolean }

export function AiSourceSelector({ subjects, subjectId, onSubject, sourceType, onSourceType,
  materials, materialIds, onToggleMaterial, sourceFile, pendingFileName, onPickFile, busy }: Props) {
  return <View>
    <ChoicePicker label="Môn học" placeholder="Chọn môn học" options={subjects.map((item) => ({ value: item.id, label: item.code ? `${item.code} · ${item.name}` : item.name }))}
      selectedValues={subjectId ? [subjectId] : []} onToggle={onSubject} />
    <Text style={styles.label}>Nguồn tài liệu</Text>
    <View style={styles.choices}>
      <Choice label="Tài liệu lớp" selected={sourceType === 'COURSE_MATERIAL'} onPress={() => onSourceType('COURSE_MATERIAL')} />
      <Choice label="Tải tệp lên" selected={sourceType === 'UPLOAD_FILE'} onPress={() => onSourceType('UPLOAD_FILE')} />
    </View>
    {sourceType === 'COURSE_MATERIAL' ? <ChoicePicker label="Tài liệu lớp" placeholder={subjectId ? 'Chọn tài liệu' : 'Chọn môn học trước'}
      options={materials.map((item) => ({ value: item.id, label: item.title || item.fileName, description: `${item.courseCode} · ${item.fileName}` }))}
      selectedValues={materialIds} onToggle={onToggleMaterial} multiple disabled={!subjectId} /> : <View>
      <Pressable accessibilityRole="button" disabled={busy} onPress={onPickFile} style={styles.pick}>
        <Text style={styles.pickText}>{sourceFile || pendingFileName ? 'Chọn tệp khác' : 'Chọn PDF, DOCX, TXT hoặc ảnh'}</Text>
      </Pressable>
      {sourceFile ? <Text style={styles.meta}>Đã tải: {sourceFile.fileName}</Text> : pendingFileName ?
        <Text style={styles.meta}>Đã chọn: {pendingFileName}. Chọn môn học để tải tệp.</Text> : null}
    </View>}
  </View>
}

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={[styles.choice, selected && styles.selected]}>
    <Text style={styles.choiceText}>{label}</Text></Pressable>
}

const styles = StyleSheet.create({
  label: { color: '#334155', fontWeight: '700', marginTop: 14, marginBottom: 8 }, choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { minHeight: 42, justifyContent: 'center', paddingHorizontal: 12, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, backgroundColor: '#fff' },
  selected: { borderColor: '#2563eb', backgroundColor: '#eff6ff' }, choiceText: { color: '#334155', fontSize: 13 },
  meta: { color: '#64748b', fontSize: 12, lineHeight: 18, marginTop: 5 },
  pick: { minHeight: 44, borderRadius: 10, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  pickText: { color: '#fff', fontWeight: '700' },
})
