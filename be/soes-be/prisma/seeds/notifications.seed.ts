import { PrismaClient } from '@prisma/client'

const NOTIFICATIONS = [
  { title: 'Có điểm mới', content: 'Điểm thi môn Java đã được công bố.' },
  { title: 'Bài thi sắp diễn ra', content: 'Bài thi Giữa kỳ môn SQL sẽ diễn ra vào ngày mai lúc 13:30.' },
  { title: 'Tài liệu mới', content: 'Giảng viên vừa đăng tải tài liệu ôn tập môn React.' },
]

export async function seedNotifications(prisma: PrismaClient): Promise<void> {
  console.log('Seeding Notifications...')

  // Send to the first 3 students (demo purposes)
  const students = await prisma.student.findMany({ take: 3, include: { user: true } })

  let total = 0
  for (const student of students) {
    for (const notif of NOTIFICATIONS) {
      const existing = await prisma.notification.findFirst({
        where: { userId: student.user.id, title: notif.title },
      })
      if (existing) continue

      await prisma.notification.create({
        data: { ...notif, userId: student.user.id },
      })
      total++
    }
  }

  console.log(`✓ Notifications completed (${total} created)`)
}
