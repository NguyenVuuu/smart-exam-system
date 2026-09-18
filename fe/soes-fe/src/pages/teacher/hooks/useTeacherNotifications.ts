import { useEffect } from 'react'
import { toast } from 'sonner'
import { getSocket } from '../../../api/socket'
import { useTeacherNotificationsStore } from '../store/teacherNotificationsStore'

interface GradeAppealCreatedPayload {
  student?: { fullName?: string }
  exam?: { title?: string }
}

export function useTeacherNotifications() {
  const items = useTeacherNotificationsStore((state) => state.items)
  const unreadCount = useTeacherNotificationsStore((state) => state.unreadCount)
  const loading = useTeacherNotificationsStore((state) => state.loading)
  const error = useTeacherNotificationsStore((state) => state.error)
  const load = useTeacherNotificationsStore((state) => state.load)
  const markRead = useTeacherNotificationsStore((state) => state.markRead)
  const markAllRead = useTeacherNotificationsStore((state) => state.markAllRead)

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const socket = getSocket()
    const handleAppealCreated = (appeal: GradeAppealCreatedPayload) => {
      void load()
      toast.info('Có yêu cầu phúc khảo mới', {
        description: `${appeal.student?.fullName ?? 'Sinh viên'} vừa gửi phúc khảo cho ${appeal.exam?.title ?? 'bài thi'}.`,
      })
    }

    socket.on('grade_appeal:created', handleAppealCreated)
    return () => {
      socket.off('grade_appeal:created', handleAppealCreated)
    }
  }, [load])

  return { items, unreadCount, loading, error, load, markRead, markAllRead }
}
