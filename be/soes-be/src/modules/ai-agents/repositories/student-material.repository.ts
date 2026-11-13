import prisma from '../../../lib/prisma'

const accessibleMaterial = (studentId: string) => ({
  storageProvider: 'SUPABASE' as const,
  courseOffering: { enrollments: { some: { studentId } } },
})

export const listStudentMaterials = (studentId: string) => prisma.material.findMany({
  where: accessibleMaterial(studentId),
  select: {
    id: true, title: true, fileName: true, fileSize: true,
    courseOffering: { select: { id: true, code: true, subject: { select: { id: true, name: true } } } },
  },
  orderBy: { createdAt: 'desc' },
  take: 100,
})

export const findStudentMaterial = (studentId: string, materialId: string) => prisma.material.findFirst({
  where: { id: materialId, ...accessibleMaterial(studentId) },
  select: {
    id: true, title: true, fileName: true, fileSize: true, storagePath: true,
    courseOffering: { select: { subjectId: true } },
  },
})
