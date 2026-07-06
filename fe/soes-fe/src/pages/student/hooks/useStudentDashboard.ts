import { useEffect, useState } from 'react'
import { getDashboard } from '../api/student-dashboard.api'
import type {
  AnalyticsItem,
  DashboardApiResponse,
  NotificationDotColor,
  NotificationItem,
  StatCard,
  UpcomingExam,
} from '../types/dashboard.types'

interface DashboardState {
  isLoading: boolean
  error: string | null
  fullName: string
  statCards: StatCard[]
  analyticsItems: AnalyticsItem[]
  upcomingExams: UpcomingExam[]
  notifications: NotificationItem[]
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function isWithinDays(iso: string, days: number): boolean {
  const diff = new Date(iso).getTime() - Date.now()
  return diff > 0 && diff <= days * 24 * 60 * 60 * 1000
}

function mapToUiTypes(data: DashboardApiResponse): Omit<DashboardState, 'isLoading' | 'error'> {
  const statCards: StatCard[] = [
    { label: 'Môn học', value: data.stats.subjectCount, icon: 'subject' },
    { label: 'Bài thi', value: data.stats.examCount, icon: 'exam' },
    { label: 'GPA HK', value: data.stats.gpa ?? '—', icon: 'gpa' },
    { label: 'Sắp diễn ra', value: data.stats.upcomingExamCount, icon: 'upcoming' },
  ]

  const analyticsItems: AnalyticsItem[] = data.analytics.map((item) => ({
    subjectId: item.subjectId,
    subjectName: item.subjectName,
    semesterId: item.semesterId,
    semesterName: item.semesterName,
    examType: item.examType,
    myScore: item.myScore,
    classAverage: item.classAverage,
  }))

  const upcomingExams: UpcomingExam[] = data.upcomingExams.map((exam) => ({
    id: exam.id,
    title: exam.title,
    date: formatDate(exam.startTime),
    time: formatTime(exam.startTime),
    status: isWithinDays(exam.startTime, 3) ? 'soon' : 'normal',
  }))

  const notifications: NotificationItem[] = data.notifications.map((notif) => {
    const dot: NotificationDotColor = notif.isRead ? 'yellow' : 'green'
    return { id: notif.id, message: notif.title, dot }
  })

  return {
    fullName: data.greeting.fullName,
    statCards,
    analyticsItems,
    upcomingExams,
    notifications,
  }
}

export function useStudentDashboard(): DashboardState {
  const [state, setState] = useState<DashboardState>({
    isLoading: true,
    error: null,
    fullName: '',
    statCards: [],
    analyticsItems: [],
    upcomingExams: [],
    notifications: [],
  })

  useEffect(() => {
    let cancelled = false

    async function fetch() {
      setState((prev) => ({ ...prev, isLoading: true, error: null }))
      try {
        const data = await getDashboard()
        if (cancelled) return
        setState({ isLoading: false, error: null, ...mapToUiTypes(data) })
      } catch {
        if (cancelled) return
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: 'Không thể tải dữ liệu. Vui lòng thử lại.',
        }))
      }
    }

    fetch()
    return () => { cancelled = true }
  }, [])

  return state
}
