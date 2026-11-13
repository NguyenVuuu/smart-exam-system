import { BackToTopScrollView } from '../../../../../../src/components/ui/BackToTop'
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { ArrowLeft, CircleAlert, Clock3, Download, FileText, Megaphone, Paperclip, Pencil } from 'lucide-react-native'
import { useRequireAuth } from '../../../../../../src/hooks/useRequireAuth'
import { usePostDetail } from '../../../../../../src/hooks/useCourseDetail'
import { RichContent } from '../../../../../../src/components/ui/RichContent'
import StudentLayout from '../../../../../../src/components/student/StudentLayout'
import { StudentFileIcon } from '../../../../../../src/components/student/fileIcon'
import * as Sharing from 'expo-sharing'
import { File, Directory, Paths } from 'expo-file-system'
import { Platform } from 'react-native'
import { apiClient } from '../../../../../../src/api/client'
import { tokenStorage } from '../../../../../../src/auth/tokenStorage'
import { displayFileName } from '../../../../../../src/utils/courseFiles'
import type { PostAttachment } from '../../../../../../src/types/course-detail.types'

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDateTime(iso: string) {
  const d = new Date(iso)
  const date = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
  const time = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
  return `${time} - ${date}`
}

function getFileIconBg(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
  if (ext === 'pdf') return '#fef2f2'
  if (['doc','docx'].includes(ext)) return '#eff6ff'
  if (['xls','xlsx'].includes(ext)) return '#f0fdf4'
  if (['ppt','pptx'].includes(ext)) return '#fff7ed'
  if (['png','jpg','jpeg','gif','webp'].includes(ext)) return '#fdf4ff'
  return '#f8fafc'
}

// ── Attachment download ───────────────────────────────────────────────────────
async function downloadAttachment(
  courseOfferingId: string,
  postId: string,
  attachment: PostAttachment,
): Promise<void> {
  const name = displayFileName(attachment.fileName)
  const path = `/student/course-offerings/${courseOfferingId}/posts/${postId}/attachments/${attachment.id}`

  if (Platform.OS === 'web') {
    const { data } = await apiClient.get<Blob>(path, { responseType: 'blob' })
    const url = URL.createObjectURL(data)
    const link = document.createElement('a')
    link.href = url; link.download = name; link.click(); URL.revokeObjectURL(url)
    return
  }

  const token = await tokenStorage.getAccessToken()
  if (!token) throw new Error('Missing access token')

  const folder = new Directory(Paths.cache, 'soes-downloads')
  folder.create({ idempotent: true })
  const file = await File.downloadFileAsync(
    `${apiClient.defaults.baseURL}${path}`,
    new File(folder, name),
    { headers: { Authorization: `Bearer ${token}` }, idempotent: true },
  )
  await Sharing.shareAsync(file.uri)
}

// ── Attachment item ───────────────────────────────────────────────────────────
function AttachmentItem({
  attachment, courseOfferingId, postId,
}: {
  attachment: PostAttachment
  courseOfferingId: string
  postId: string
}) {
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    if (downloading) return
    setDownloading(true)
    try {
      await downloadAttachment(courseOfferingId, postId, attachment)
    } catch {
      Alert.alert('Lỗi', 'Không thể tải tệp đính kèm. Vui lòng thử lại.')
    } finally {
      setDownloading(false)
    }
  }

  const iconBg = getFileIconBg(attachment.fileName)

  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingVertical: 10, paddingHorizontal: 4,
    }}>
      <View style={{
        width: 42, height: 42, borderRadius: 11,
        backgroundColor: iconBg,
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <StudentFileIcon fileType={attachment.fileName} size={20} />
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: '#0f172a', marginBottom: 2 }} numberOfLines={1}>
          {attachment.fileName}
        </Text>
        <Text style={{ fontSize: 11, color: '#94a3b8' }}>
          {attachment.fileType} · {attachment.fileSize}
        </Text>
      </View>

      <TouchableOpacity
        onPress={handleDownload}
        disabled={downloading}
        activeOpacity={0.7}
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 4,
          paddingHorizontal: 12, paddingVertical: 8,
          backgroundColor: downloading ? '#e0e7ff' : '#eff6ff',
          borderRadius: 10, borderWidth: 1,
          borderColor: downloading ? '#c7d2fe' : '#bfdbfe',
          flexShrink: 0,
        }}
      >
        {downloading
          ? <ActivityIndicator size="small" color="#4f46e5" />
          : <Download size={13} color="#2563eb" />
        }
        <Text style={{ fontSize: 12, fontWeight: '700', color: downloading ? '#4f46e5' : '#2563eb' }}>
          {downloading ? 'Đang tải...' : 'Tải'}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function PostDetailScreen() {
  const { isInitialized, isAuthenticated } = useRequireAuth()
  const { courseOfferingId, postId } = useLocalSearchParams<{ courseOfferingId: string; postId: string }>()
  const { data: post, isLoading, error } = usePostDetail(courseOfferingId ?? '', postId ?? '')

  if (!isInitialized || !isAuthenticated) return null

  return (
    <StudentLayout activeRoute="subjects">
      <BackToTopScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Back button */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 }}
          activeOpacity={0.7}
        >
          <View style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={14} color="#475569" />
          </View>
          <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '500' }}>Quay lại</Text>
        </TouchableOpacity>

        {/* Loading */}
        {isLoading && (
          <View style={{ alignItems: 'center', paddingTop: 80 }}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={{ fontSize: 13, color: '#94a3b8', marginTop: 12 }}>Đang tải bài đăng...</Text>
          </View>
        )}

        {/* Error */}
        {error && (
          <View style={{ alignItems: 'center', paddingTop: 60, gap: 12 }}>
            <CircleAlert size={28} color="#ef4444" />
            <Text style={{ fontSize: 14, color: '#ef4444', textAlign: 'center' }}>{error}</Text>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#2563eb', borderRadius: 10 }}
            >
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>Quay lại</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Content */}
        {post && (
          <View style={{ gap: 14 }}>

            {/* Header card */}
            <View style={{
              backgroundColor: '#fff', borderRadius: 18, padding: 20,
              shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 3 },
              borderWidth: 1, borderColor: '#f1f5f9',
            }}>
              {/* Badges */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' }}>
                  <Megaphone size={11} color="#1d4ed8" />
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: 0.3 }}>Bài đăng</Text>
                </View>
                {post.edited && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' }}>
                    <Pencil size={10} color="#94a3b8" />
                    <Text style={{ fontSize: 10, color: '#94a3b8', fontWeight: '500' }}>Đã chỉnh sửa</Text>
                  </View>
                )}
              </View>

              {/* Title */}
              <Text style={{ fontSize: 19, fontWeight: '800', color: '#0f172a', lineHeight: 28, marginBottom: 14 }}>
                {post.title}
              </Text>

              {/* Meta */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
                <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock3 size={15} color="#16a34a" />
                </View>
                <View>
                  <Text style={{ fontSize: 10, color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 }}>Thời gian đăng</Text>
                  <Text style={{ fontSize: 13, color: '#475569', fontWeight: '500', marginTop: 1 }}>
                    {fmtDateTime(post.publishedAt)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Content card */}
            <View style={{
              backgroundColor: '#fff', borderRadius: 18, padding: 20,
              shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 3 },
              borderWidth: 1, borderColor: '#f1f5f9',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                <FileText size={14} color="#475569" />
                <Text style={{ fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: 0.4, fontSize: 11 }}>
                  Nội dung
                </Text>
              </View>
              <RichContent content={post.content} />
            </View>

            {/* Attachments card */}
            {post.attachments.length > 0 && (
              <View style={{
                backgroundColor: '#fff', borderRadius: 18, padding: 20,
                shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 3 },
                borderWidth: 1, borderColor: '#f1f5f9',
              }}>
                {/* Header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                    <Paperclip size={14} color="#475569" />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a' }}>Tệp đính kèm</Text>
                  </View>
                  <View style={{ paddingHorizontal: 9, paddingVertical: 3, backgroundColor: '#f1f5f9', borderRadius: 20 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748b' }}>
                      {post.attachments.length} tệp
                    </Text>
                  </View>
                </View>

                {/* Divider */}
                <View style={{ height: 1, backgroundColor: '#f1f5f9', marginBottom: 4 }} />

                {/* List */}
                {post.attachments.map((att, i) => (
                  <View key={att.id}>
                    <AttachmentItem
                      attachment={att}
                      courseOfferingId={courseOfferingId ?? ''}
                      postId={postId ?? ''}
                    />
                    {i < post.attachments.length - 1 && (
                      <View style={{ height: 1, backgroundColor: '#f8fafc', marginHorizontal: 4 }} />
                    )}
                  </View>
                ))}
              </View>
            )}

          </View>
        )}
      </BackToTopScrollView>
    </StudentLayout>
  )
}
