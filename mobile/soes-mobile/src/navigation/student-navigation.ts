import { Bell, BookOpen, ChartNoAxesColumn, House, UserCircle } from 'lucide-react-native'
import type { NavigationGroup } from './navigation.types'

export const studentNavigation: NavigationGroup[] = [
  { title: 'Tổng quan', items: [{ key: 'dashboard', label: 'Trang chủ', href: '/(app)/(student)/dashboard', icon: House }] },
  { title: 'Học tập', items: [{ key: 'subjects', label: 'Lớp học phần', href: '/(app)/(student)/subjects', icon: BookOpen }] },
  { title: 'Kết quả', items: [{ key: 'scores', label: 'Điểm số', href: '/(app)/(student)/scores', icon: ChartNoAxesColumn }] },
  { title: 'Thông tin', items: [
    { key: 'notifications', label: 'Thông báo', href: '/(app)/(student)/notifications', icon: Bell },
    { key: 'account', label: 'Tài khoản', href: '/(app)/(student)/account', icon: UserCircle },
  ]},
]
