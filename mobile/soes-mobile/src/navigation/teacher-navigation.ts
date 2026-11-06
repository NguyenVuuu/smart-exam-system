import { Bell, BookOpen, CalendarDays, ClipboardCheck, FileQuestion, Files, GraduationCap, House, Sparkles, UserRound, UsersRound } from 'lucide-react-native'
import type { NavigationGroup } from './navigation.types'

export const teacherNavigation: NavigationGroup[] = [
  { title: 'Tổng quan', items: [{ key: 'dashboard', label: 'Trang chủ', href: '/(app)/(teacher)/dashboard', icon: House }] },
  { title: 'Giảng dạy', items: [
    { key: 'courses', label: 'Lớp học phần', href: '/(app)/(teacher)/courses', icon: BookOpen },
    { key: 'invigilation', label: 'Lịch coi thi', href: '/(app)/(teacher)/invigilation', icon: CalendarDays },
  ] },
  { title: 'Đề và câu hỏi', items: [
    { key: 'exams', label: 'Đề thi', href: '/(app)/(teacher)/exams', icon: Files },
    { key: 'approvals', label: 'Duyệt chuyên môn', href: '/(app)/(teacher)/approvals', icon: ClipboardCheck },
    { key: 'question-bank', label: 'Ngân hàng câu hỏi', href: '/(app)/(teacher)/question-bank', icon: FileQuestion },
    { key: 'ai-generator', label: 'Sinh câu hỏi AI', href: '/(app)/(teacher)/ai-generator', icon: Sparkles },
  ] },
  { title: 'Bộ môn', items: [{ key: 'review-group', label: 'Nhóm duyệt đề', href: '/(app)/(teacher)/review-group', icon: UsersRound }] },
  { title: 'Kết quả', items: [{ key: 'appeals', label: 'Phúc khảo điểm', href: '/(app)/(teacher)/appeals', icon: GraduationCap }] },
  { title: 'Tài khoản', items: [
    { key: 'notifications', label: 'Thông báo', href: '/(app)/(teacher)/notifications', icon: Bell },
    { key: 'account', label: 'Hồ sơ', href: '/(app)/(teacher)/account', icon: UserRound },
  ] },
]
