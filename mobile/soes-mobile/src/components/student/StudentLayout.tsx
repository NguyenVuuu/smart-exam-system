import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { useUIStore } from '../../store/uiStore'
import StudentSidebar from './StudentSidebar'
import StudentTopBar from './StudentTopBar'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  activeRoute?: 'dashboard' | 'subjects' | 'exams' | 'scores' | 'notifications' | 'settings'
}

export default function StudentLayout({ children, activeRoute = 'dashboard' }: Props) {
  const { sidebarOpen, toggleSidebar } = useUIStore()

  return (
    <View style={styles.root}>
      {/* Sidebar bên trái */}
      {sidebarOpen && <StudentSidebar activeRoute={activeRoute} />}

      {/* Main content bên phải */}
      <View style={styles.main}>
        <StudentTopBar />

        {/* Content — ẩn hoàn toàn khi sidebar mở */}
        <View style={[styles.content, sidebarOpen && styles.contentHidden]}>
          {children}
        </View>

        {/* Overlay chặn tương tác khi sidebar mở, bấm để đóng */}
        {sidebarOpen && (
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={toggleSidebar}
          />
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
  },
  main: {
    flex: 1,
    flexDirection: 'column',
    position: 'relative',
  },
  content: {
    flex: 1,
  },
  contentHidden: {
    opacity: 0.05,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(248, 250, 252, 0.85)',
    zIndex: 10,
  },
})
