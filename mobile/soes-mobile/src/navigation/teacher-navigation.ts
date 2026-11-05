import { Bell, BookOpen, CalendarDays, ClipboardCheck, FileQuestion, Files, House, Sparkles, UsersRound } from 'lucide-react-native'
import type { NavigationGroup } from './navigation.types'

export const teacherNavigation: NavigationGroup[] = [
  { title: 'Tổng quan', items: [{ key: 'dashboard', label: 'Trang chủ', href: '/(app)/(teacher)/dashboard', icon: House }] },
  { title: 'Giảng dạy', items: [
    { key: 'courses', label: 'Lớp học phần', href: '/(app)/(teacher)/courses', icon: BookOpen },
    { key: 'invigilation', label: 'Lịch coi thi', href: '/(app)/(teacher)/invigilation', icon: CalendarDays },
  ] },
  { title: 'Đề và câu hỏi', items: [
    { key: 'exams', label: 'Đề thi', href: '/(app)/(teacher)/exams', icon: Files },
    { key: 'approvals', label: 'Duyệt đề', href: '/(app)/(teacher)/approvals', icon: ClipboardCheck },
    { key: 'question-bank', label: 'Ngân hàng câu hỏi', href: '/(app)/(teacher)/question-bank', icon: FileQuestion },
    { key: 'ai-generator', label: 'Sinh câu hỏi AI', href: '/(app)/(teacher)/ai-generator', icon: Sparkles },
    { key: 'question-approvals', label: 'Duyệt câu hỏi', href: '/(app)/(teacher)/question-approvals', icon: ClipboardCheck },
  ] },
  { title: 'Bộ môn', items: [{ key: 'review-group', label: 'Nhóm duyệt đề', href: '/(app)/(teacher)/review-group', icon: UsersRound }] },
  { title: 'Tài khoản', items: [{ key: 'notifications', label: 'Thông báo', href: '/(app)/(teacher)/notifications', icon: Bell }] },
]
