import { extname } from 'path'
import { NotFoundError, ValidationError } from '../../../errors/AppError'
import { downloadBufferFromBucket } from '../../../services/storage.service'
import { supabaseBuckets } from '../../../lib/supabase'
import { findStudentMaterial, listStudentMaterials } from '../repositories/student-material.repository'

const supportedTypes: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.txt': 'text/plain',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}
const maxBytes = 3 * 1024 * 1024

export async function getStudentMaterials(studentId: string) {
  const rows = await listStudentMaterials(studentId)
  return rows.filter((row) => row.fileSize <= maxBytes && supportedTypes[extname(row.fileName).toLowerCase()])
}

export async function loadStudentMaterial(studentId: string, materialId: string) {
  const material = await findStudentMaterial(studentId, materialId)
  if (!material) throw new NotFoundError('Material not found')
  const mimeType = supportedTypes[extname(material.fileName).toLowerCase()]
  if (!mimeType || material.fileSize > maxBytes) throw new ValidationError('Material is not available for AI study')
  const buffer = await downloadBufferFromBucket(supabaseBuckets.courseMaterials, material.storagePath)
  if (buffer.length > maxBytes) throw new ValidationError('Material is too large for AI study')
  return {
    materialId: material.id,
    subjectId: material.courseOffering.subjectId,
    title: (material.title?.trim() || material.fileName).slice(0, 150),
    mimeType,
    contentBase64: buffer.toString('base64'),
  }
}
