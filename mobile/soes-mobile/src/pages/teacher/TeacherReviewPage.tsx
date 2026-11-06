import { useLocalSearchParams, router } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { ScreenHeader } from '../../components/ui/ScreenHeader'
import { TeacherApprovalsPage } from './TeacherApprovalsPage'
import { TeacherQuestionApprovalsPage } from './TeacherQuestionApprovalsPage'

export function TeacherReviewPage() {
  const { tab } = useLocalSearchParams<{ tab?: string }>()
  const selected = tab === 'questions' ? 'questions' : 'exams'
  return <View style={styles.root}>
    <View style={styles.header}>
      <ScreenHeader title="Duyệt chuyên môn" description="Duyệt đề cuối kỳ và câu hỏi dùng chung" />
      <View style={styles.tabs}>
        {([['exams', 'Đề thi'], ['questions', 'Câu hỏi']] as const).map(([key, label]) => (
          <Pressable key={key} accessibilityRole="tab" accessibilityState={{ selected: selected === key }}
            onPress={() => router.setParams({ tab: key })} style={[styles.tab, selected === key && styles.selected]}>
            <Text style={[styles.label, selected === key && styles.selectedLabel]}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
    {selected === 'exams' ? <TeacherApprovalsPage showHeader={false} /> : <TeacherQuestionApprovalsPage showHeader={false} />}
  </View>
}

const styles = StyleSheet.create({
  root: { flex: 1 }, header: { padding: 16, paddingBottom: 4 },
  tabs: { alignSelf: 'flex-start', flexDirection: 'row', padding: 3, borderRadius: 11, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', gap: 3 },
  tab: { minHeight: 34, minWidth: 74, paddingHorizontal: 12, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  selected: { backgroundColor: '#2563eb' }, label: { color: '#475569', fontWeight: '700' },
  selectedLabel: { color: '#fff' },
})
