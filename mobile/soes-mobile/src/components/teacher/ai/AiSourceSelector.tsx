import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { AiMaterial, AiSourceFile } from '../../../types/teacher-ai.types'
import type { QuestionSubject } from '../../../types/teacher-questions.types'

interface Props { subjects: QuestionSubject[]; subjectId: string; onSubject: (id: string) => void
  sourceType: 'COURSE_MATERIAL' | 'UPLOAD_FILE'; onSourceType: (type: 'COURSE_MATERIAL' | 'UPLOAD_FILE') => void
  materials: AiMaterial[]; materialIds: string[]; onToggleMaterial: (id: string) => void
  sourceFile: AiSourceFile | null; onPickFile: () => void; busy: boolean }

export function AiSourceSelector({ subjects, subjectId, onSubject, sourceType, onSourceType,
  materials, materialIds, onToggleMaterial, sourceFile, onPickFile, busy }: Props) {
  return <View>
    <Text style={styles.label}>Môn học</Text>
    <View style={styles.choices}>{subjects.map((item) => <Choice key={item.id} label={item.code ? `${item.code} · ${item.name}` : item.name}
      selected={subjectId === item.id} onPress={() => onSubject(item.id)} />)}</View>
    <Text style={styles.label}>Nguồn tài liệu</Text>
    <View style={styles.choices}>
      <Choice label="Tài liệu lớp" selected={sourceType === 'COURSE_MATERIAL'} onPress={() => onSourceType('COURSE_MATERIAL')} />
      <Choice label="Tải tệp lên" selected={sourceType === 'UPLOAD_FILE'} onPress={() => onSourceType('UPLOAD_FILE')} />
    </View>
    {sourceType === 'COURSE_MATERIAL' ? <View>
      {materials.length ? materials.map((material) => <Pressable accessibilityRole="button" key={material.id}
        onPress={() => onToggleMaterial(material.id)} style={[styles.material, materialIds.includes(material.id) && styles.selected]}>
        <Text style={styles.materialTitle}>{material.title || material.fileName}</Text>
        <Text style={styles.meta}>{material.courseCode} · {material.fileName}</Text>
      </Pressable>) : <Text style={styles.meta}>Môn này chưa có tài liệu phù hợp.</Text>}
    </View> : <View>
      <Pressable accessibilityRole="button" disabled={busy || !subjectId} onPress={onPickFile} style={styles.pick}>
        <Text style={styles.pickText}>{sourceFile ? 'Chọn tệp khác' : 'Chọn PDF, DOCX, TXT hoặc ảnh'}</Text>
      </Pressable>
      {sourceFile && <Text style={styles.meta}>Đã tải: {sourceFile.fileName}</Text>}
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
  material: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, backgroundColor: '#fff', padding: 12, marginTop: 8 },
  materialTitle: { color: '#0f172a', fontWeight: '700', fontSize: 13 }, meta: { color: '#64748b', fontSize: 12, lineHeight: 18, marginTop: 5 },
  pick: { minHeight: 44, borderRadius: 10, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  pickText: { color: '#fff', fontWeight: '700' },
})
