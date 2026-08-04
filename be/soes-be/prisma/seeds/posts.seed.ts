import { PrismaClient, Post, Teacher, CourseOffering, PostAttachment } from '@prisma/client'

interface PostsSeedInput {
  courseOfferings: CourseOffering[]
  teachers: Teacher[]
}

export async function seedPosts(
  prisma: PrismaClient,
  { courseOfferings, teachers }: PostsSeedInput,
): Promise<Post[]> {
  console.log('Seeding Posts...')

  const allPosts: Post[] = []

  // Create posts for each course offering
  for (let i = 0; i < courseOfferings.length; i++) {
    const courseOffering = courseOfferings[i]
    const teacher = teachers[i % teachers.length]

    // Create 2-3 posts per course offering
    const postCount = 2 + (i % 2) // 2 or 3 posts
    
    for (let j = 0; j < postCount; j++) {
      const postNumber = j + 1
      const isPublished = j % 2 === 0 // Every other post is published
      
      const post = await prisma.post.create({
        data: {
          title: `Bài viết ${postNumber} - ${courseOffering.code}`,
          content: `Đây là nội dung của bài viết số ${postNumber} cho lớp ${courseOffering.code}. Nội dung bao gồm các thông tin quan trọng về môn học, lịch học và các thông báo mới nhất.`,
          status: isPublished ? 'PUBLISHED' : 'DRAFT',
          publishedAt: isPublished ? new Date() : null,
          courseOfferingId: courseOffering.id,
          createdById: teacher.id,
          attachments: {
            create: [
              {
                fileName: `tai-lieu-${postNumber}.pdf`,
                objectName: `documents/tai-lieu-${postNumber}-${courseOffering.code}.pdf`,
                fileSize: 1024 * 1024 * (1 + (j % 3)), // 1-3 MB
                contentType: 'application/pdf',
                storagePath: `/uploads/documents/${courseOffering.id}`,
              },
              {
                fileName: `slide-${postNumber}.pptx`,
                objectName: `slides/slide-${postNumber}-${courseOffering.code}.pptx`,
                fileSize: 1024 * 1024 * (2 + (j % 2)), // 2-3 MB
                contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                storagePath: `/uploads/slides/${courseOffering.id}`,
              },
            ],
          },
        },
      })

      allPosts.push(post)
    }
  }

  console.log(`✓ Posts completed (${allPosts.length} posts with attachments)`)
  return allPosts
}