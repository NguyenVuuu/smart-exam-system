import { useState } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView, Linking, ActivityIndicator,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useRequireAuth } from '../../../../src/hooks/useRequireAuth'
import {
  useCourseHeader, useTimeline, useMembers, useScores, useMaterials,
} from '../../../../src/hooks/useCourseDetail'
import StudentLayout from '../../../../src/components/student/StudentLayout'
import type { TimelineItem, Member, ScoreItem, CourseMaterial } from '../../../../src/types/course-detail.types'

type TabKey = 'timeline' | 'materials' | 'members' | 'scores'
const TABS: { key: TabKey; label: string }[] = [
  { key: 'timeline', label: 'Bài đăng' },
  { key: 'materials', label: 'Tài liệu' },
  { key: 'members', label: 'Thành viên' },
  { key: 'scores', label: 'Điểm' },
]

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(iso: string) {
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}

function fmtDateTime(iso: string) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')} ${fmtDate(iso)}`
}

function scoreColor(s: number) {
  if (s >= 8) return '#16a34a'
  if (s >= 5) return '#ca8a04'
  return '#dc2626'
}

const EXAM_TYPE_LABEL: Record<string, string> = { QUIZ: 'Thường kỳ', MIDTERM: 'Giữa kỳ', FINAL: 'Cuối kỳ' }

// ── Pagination component ──────────────────────────────────────────────────────
function Pager({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  if (totalPages <= 1) return null
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 16 }}>
      <TouchableOpacity onPress={() => onPageChange(page-1)} disabled={page<=1} style={{ width:32,height:32,borderRadius:8,borderWidth:1,borderColor:'#e2e8f0',alignItems:'center',justifyContent:'center',opacity:page<=1?0.4:1 }}>
        <Text style={{ color:'#64748b' }}>‹</Text>
      </TouchableOpacity>
      <View style={{ flexDirection:'row', alignItems:'center' }}>
        <Text style={{ fontSize:13, color:'#475569' }}>{page} / {totalPages}</Text>
      </View>
      <TouchableOpacity onPress={() => onPageChange(page+1)} disabled={page>=totalPages} style={{ width:32,height:32,borderRadius:8,borderWidth:1,borderColor:'#e2e8f0',alignItems:'center',justifyContent:'center',opacity:page>=totalPages?0.4:1 }}>
        <Text style={{ color:'#64748b' }}>›</Text>
      </TouchableOpacity>
    </View>
  )
}

// ── Tab: Timeline ─────────────────────────────────────────────────────────────
function TimelineTab({ courseOfferingId }: { courseOfferingId: string }) {
  const { items, pagination, page, setPage, isLoading, error } = useTimeline(courseOfferingId)
  if (isLoading) return <ActivityIndicator style={{ marginTop: 40 }} color="#2563eb" />
  if (error) return <Text style={{ color: '#ef4444', textAlign: 'center', marginTop: 32 }}>{error}</Text>
  if (items.length === 0) return (
    <View style={{ alignItems: 'center', paddingTop: 40 }}>
      <Text style={{ fontSize: 28, marginBottom: 8 }}>💬</Text>
      <Text style={{ color: '#94a3b8', fontSize: 13 }}>Chưa có bài đăng hoặc bài thi nào.</Text>
    </View>
  )
  return (
    <View>
      {items.map(item => <TimelineCard key={item.id} item={item} courseOfferingId={courseOfferingId} />)}
      <Pager page={page} totalPages={pagination.totalPages} onPageChange={setPage} />
    </View>
  )
}

function TimelineCard({ item, courseOfferingId }: { item: TimelineItem; courseOfferingId: string }) {
  const isExam = item.type === 'EXAM'

  const handlePress = () => {
    if (isExam) {
      router.push(`/(app)/(student)/course/${courseOfferingId}/exam/${item.id}` as never)
    } else {
      router.push(`/(app)/(student)/course/${courseOfferingId}/post/${item.id}` as never)
    }
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.75} style={{ backgroundColor:'#fff',borderRadius:14,padding:14,marginBottom:10,borderWidth:1,borderColor:'#f1f5f9',shadowColor:'#000',shadowOpacity:0.05,shadowRadius:8,shadowOffset:{width:0,height:2} }}>
      <View style={{ flexDirection:'row',alignItems:'flex-start',gap:10 }}>
        <View style={{ width:38,height:38,borderRadius:10,backgroundColor:isExam?'#fef3c7':'#eff6ff',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
          <Text style={{ fontSize:18 }}>{isExam ? '📋' : '📝'}</Text>
        </View>
        <View style={{ flex:1 }}>
          <View style={{ flexDirection:'row', alignItems:'center', gap:6, marginBottom:3 }}>
            <View style={{ paddingHorizontal:7,paddingVertical:2,borderRadius:6,backgroundColor:isExam?'#fef3c7':'#eff6ff' }}>
              <Text style={{ fontSize:9,fontWeight:'700',color:isExam?'#92400e':'#1d4ed8',textTransform:'uppercase' }}>
                {isExam ? 'Bài thi' : 'Bài đăng'}
              </Text>
            </View>
          </View>
          <Text style={{ fontSize:13,fontWeight:'700',color:'#0f172a',lineHeight:18 }} numberOfLines={2}>{item.title}</Text>
          <Text style={{ fontSize:11,color:'#94a3b8',marginTop:4 }}>{item.authorName} · {fmtDate(item.publishedAt)}</Text>
          {isExam && item.type === 'EXAM' && (
            <Text style={{ fontSize:11,color:'#64748b',marginTop:3 }}>
              🕐 {fmtDateTime(item.startTime)} → {fmtDateTime(item.endTime)} ({item.durationMinutes} phút)
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  )
}

// ── Tab: Materials ────────────────────────────────────────────────────────────
function MaterialsTab({ courseOfferingId }: { courseOfferingId: string }) {
  const { items, isLoading, error, reload } = useMaterials(courseOfferingId)
  if (isLoading) return <ActivityIndicator style={{ marginTop: 40 }} color="#2563eb" />
  if (error) return (
    <View style={{ alignItems:'center',paddingTop:32 }}>
      <Text style={{ color:'#ef4444',marginBottom:12 }}>{error}</Text>
      <TouchableOpacity onPress={reload} style={{ paddingHorizontal:16,paddingVertical:8,backgroundColor:'#2563eb',borderRadius:8 }}>
        <Text style={{ color:'#fff',fontWeight:'600' }}>Thử lại</Text>
      </TouchableOpacity>
    </View>
  )
  if (items.length === 0) return (
    <View style={{ alignItems:'center',paddingTop:40 }}>
      <Text style={{ fontSize:28,marginBottom:8 }}>📄</Text>
      <Text style={{ color:'#94a3b8',fontSize:13 }}>Lớp học phần chưa có tài liệu.</Text>
    </View>
  )
  return (
    <View style={{ backgroundColor:'#fff',borderRadius:14,borderWidth:1,borderColor:'#f1f5f9',overflow:'hidden' }}>
      <View style={{ flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:14,borderBottomWidth:1,borderBottomColor:'#f1f5f9' }}>
        <Text style={{ fontSize:13,fontWeight:'700',color:'#0f172a' }}>Tài liệu học tập</Text>
        <TouchableOpacity onPress={reload}>
          <Text style={{ fontSize:12,color:'#2563eb',fontWeight:'600' }}>↻ Làm mới</Text>
        </TouchableOpacity>
      </View>
      {items.map((m, i) => <MaterialRow key={m.id} material={m} isLast={i === items.length - 1} />)}
    </View>
  )
}

function MaterialRow({ material, isLast }: { material: CourseMaterial; isLast: boolean }) {
  return (
    <View style={{ flexDirection:'row',alignItems:'center',gap:12,padding:14,borderBottomWidth:isLast?0:1,borderBottomColor:'#f8fafc' }}>
      <View style={{ width:40,height:40,borderRadius:10,backgroundColor:'#eff6ff',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
        <Text style={{ fontSize:18 }}>📄</Text>
      </View>
      <View style={{ flex:1,minWidth:0 }}>
        <Text style={{ fontSize:13,fontWeight:'600',color:'#0f172a' }} numberOfLines={1}>{material.title || material.fileName}</Text>
        <Text style={{ fontSize:11,color:'#94a3b8',marginTop:2 }}>
          {material.fileType} · {material.fileSize} · {fmtDate(material.uploadedAt)}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => Linking.openURL(material.fileName)}
        style={{ paddingHorizontal:12,paddingVertical:7,backgroundColor:'#eff6ff',borderRadius:8 }}
      >
        <Text style={{ fontSize:11,fontWeight:'700',color:'#2563eb' }}>↓ Tải</Text>
      </TouchableOpacity>
    </View>
  )
}

// ── Tab: Members ──────────────────────────────────────────────────────────────
function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  return `${parts[0]?.[0]??''}${parts.length>1?(parts[parts.length-1]?.[0]??''):''}`.toUpperCase()
}

function MembersTab({ courseOfferingId }: { courseOfferingId: string }) {
  const { items, pagination, page, setPage, isLoading, error } = useMembers(courseOfferingId)
  if (isLoading) return <ActivityIndicator style={{ marginTop: 40 }} color="#2563eb" />
  if (error) return <Text style={{ color:'#ef4444',textAlign:'center',marginTop:32 }}>{error}</Text>
  if (items.length === 0) return (
    <View style={{ alignItems:'center',paddingTop:40 }}>
      <Text style={{ fontSize:28,marginBottom:8 }}>👥</Text>
      <Text style={{ color:'#94a3b8',fontSize:13 }}>Chưa có thành viên nào.</Text>
    </View>
  )
  return (
    <View>
      <View style={{ flexDirection:'row',flexWrap:'wrap',margin:-4 }}>
        {items.map(m => <MemberCard key={m.memberId} member={m} />)}
      </View>
      <Pager page={page} totalPages={pagination.totalPages} onPageChange={setPage} />
    </View>
  )
}

function MemberCard({ member }: { member: Member }) {
  const isTeacher = member.role === 'TEACHER'
  return (
    <View style={{ width:'48%',margin:4,backgroundColor:'#fff',borderRadius:14,padding:12,flexDirection:'row',alignItems:'center',gap:10,borderWidth:1,borderColor:'#f1f5f9' }}>
      <View style={{ width:40,height:40,borderRadius:20,backgroundColor:isTeacher?'#fef3c7':'#eff6ff',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
        <Text style={{ fontSize:13,fontWeight:'700',color:isTeacher?'#92400e':'#1d4ed8' }}>{getInitials(member.fullName)}</Text>
      </View>
      <View style={{ flex:1,minWidth:0 }}>
        <Text style={{ fontSize:12,fontWeight:'700',color:'#0f172a' }} numberOfLines={1}>{member.fullName}</Text>
        <Text style={{ fontSize:10,color:'#94a3b8',marginTop:1 }}>
          {isTeacher ? '👨‍🏫 GV' : (member.studentCode ?? 'SV')}
        </Text>
      </View>
    </View>
  )
}

// ── Tab: Scores ───────────────────────────────────────────────────────────────
function ScoresTab({ courseOfferingId }: { courseOfferingId: string }) {
  const { items, isLoading, error } = useScores(courseOfferingId)
  if (isLoading) return <ActivityIndicator style={{ marginTop: 40 }} color="#2563eb" />
  if (error) return <Text style={{ color:'#ef4444',textAlign:'center',marginTop:32 }}>{error}</Text>
  if (items.length === 0) return (
    <View style={{ alignItems:'center',paddingTop:40 }}>
      <Text style={{ fontSize:28,marginBottom:8 }}>📊</Text>
      <Text style={{ color:'#94a3b8',fontSize:13 }}>Chờ giảng viên nhập điểm.</Text>
    </View>
  )
  return (
    <View style={{ backgroundColor:'#fff',borderRadius:14,borderWidth:1,borderColor:'#f1f5f9',overflow:'hidden' }}>
      <View style={{ flexDirection:'row',justifyContent:'space-between',padding:14,backgroundColor:'#f8fafc',borderBottomWidth:1,borderBottomColor:'#f1f5f9' }}>
        <Text style={{ fontSize:11,fontWeight:'700',color:'#94a3b8',textTransform:'uppercase',letterSpacing:0.5 }}>Bài kiểm tra</Text>
        <Text style={{ fontSize:11,fontWeight:'700',color:'#94a3b8',textTransform:'uppercase',letterSpacing:0.5 }}>Điểm</Text>
      </View>
      {items.map((item, i) => (
        <View key={item.examId} style={{ flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:14,borderBottomWidth:i===items.length-1?0:1,borderBottomColor:'#f8fafc' }}>
          <View>
            <Text style={{ fontSize:13,fontWeight:'600',color:'#0f172a' }}>{item.title}</Text>
            <Text style={{ fontSize:11,color:'#94a3b8',marginTop:2 }}>{EXAM_TYPE_LABEL[item.type] ?? item.type}</Text>
          </View>
          <Text style={{ fontSize:18,fontWeight:'800',color:scoreColor(item.score) }}>
            {Number.isInteger(item.score)?item.score:item.score.toFixed(1)}
          </Text>
        </View>
      ))}
    </View>
  )
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function CourseDetailScreen() {
  const { isInitialized, isAuthenticated } = useRequireAuth()
  const { courseOfferingId } = useLocalSearchParams<{ courseOfferingId: string }>()
  const { data: header, isLoading: headerLoading, error: headerError } = useCourseHeader(courseOfferingId ?? '')
  const [activeTab, setActiveTab] = useState<TabKey>('timeline')

  if (!isInitialized || !isAuthenticated) return null

  return (
    <StudentLayout activeRoute="subjects">
        <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding:20,paddingBottom:40 }}>
          {/* Back */}
          <TouchableOpacity onPress={() => router.back()} style={{ flexDirection:'row',alignItems:'center',gap:6,marginBottom:16 }}>
            <Text style={{ fontSize:16,color:'#64748b' }}>←</Text>
            <Text style={{ fontSize:13,color:'#64748b',fontWeight:'500' }}>Quay lại môn học</Text>
          </TouchableOpacity>

          {/* Header */}
          {headerLoading && (
            <View style={{ backgroundColor:'#f1f5f9',borderRadius:16,height:100,marginBottom:16 }} />
          )}
          {headerError && (
            <View style={{ alignItems:'center',paddingVertical:40 }}>
              <Text style={{ color:'#ef4444' }}>{headerError}</Text>
            </View>
          )}
          {header && (
            <View style={{ backgroundColor:'#fff',borderRadius:16,padding:16,marginBottom:16,flexDirection:'row',alignItems:'flex-start',gap:14,shadowColor:'#000',shadowOpacity:0.06,shadowRadius:10,shadowOffset:{width:0,height:2},borderWidth:1,borderColor:'#f1f5f9' }}>
              <View style={{ width:48,height:48,borderRadius:14,backgroundColor:'#eff6ff',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                <Text style={{ fontSize:22 }}>📖</Text>
              </View>
              <View style={{ flex:1 }}>
                <Text style={{ fontSize:10,color:'#94a3b8',fontWeight:'700',textTransform:'uppercase',letterSpacing:0.5 }}>{header.subjectCode}</Text>
                <Text style={{ fontSize:16,fontWeight:'800',color:'#0f172a',marginTop:3,lineHeight:22 }}>{header.subjectName}</Text>
                <View style={{ flexDirection:'row',alignItems:'center',gap:12,marginTop:6 }}>
                  <Text style={{ fontSize:12,color:'#64748b' }}>👨‍🏫 {header.teacherName}</Text>
                  <Text style={{ fontSize:12,color:'#94a3b8' }}>· {header.courseCode}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Tabs */}
          {header && (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom:16 }}>
                <View style={{ flexDirection:'row',gap:4,borderBottomWidth:2,borderBottomColor:'#f1f5f9' }}>
                  {TABS.map(tab => (
                    <TouchableOpacity
                      key={tab.key} onPress={() => setActiveTab(tab.key)}
                      style={{ paddingHorizontal:16,paddingVertical:10,borderBottomWidth:2,borderBottomColor:activeTab===tab.key?'#2563eb':'transparent',marginBottom:-2 }}
                    >
                      <Text style={{ fontSize:13,fontWeight:'600',color:activeTab===tab.key?'#2563eb':'#64748b' }}>{tab.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {activeTab === 'timeline' && <TimelineTab courseOfferingId={courseOfferingId??''} />}
              {activeTab === 'materials' && <MaterialsTab courseOfferingId={courseOfferingId??''} />}
              {activeTab === 'members' && <MembersTab courseOfferingId={courseOfferingId??''} />}
              {activeTab === 'scores' && <ScoresTab courseOfferingId={courseOfferingId??''} />}
            </>
          )}
        </ScrollView>
    </StudentLayout>
  )
}
