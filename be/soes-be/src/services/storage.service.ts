import { randomUUID, createHash } from 'crypto'
import { extname } from 'path'
import { ValidationError } from '../errors/AppError'
import { requireSupabase } from '../lib/supabase'

export interface StoredUpload {
  originalName: string
  objectName: string
  storagePath: string
  fileSize: number
  contentType: string
  checksum: string
  publicUrl?: string
}

const safeName = (name: string) =>
  name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || 'file'

export const checksumBuffer = (buffer: Buffer) => createHash('sha256').update(buffer).digest('hex')

export async function uploadBufferToBucket(
  bucket: string,
  file: Express.Multer.File,
  prefix: string,
  options: { publicUrl?: boolean } = {},
): Promise<StoredUpload> {
  if (!file.buffer?.length) throw new ValidationError('Uploaded file is empty')

  const supabase = requireSupabase()
  const originalName = file.originalname || 'file'
  const extension = extname(originalName)
  const objectName = `${prefix}/${randomUUID()}-${safeName(originalName || `upload${extension}`)}`

  const { error } = await supabase.storage.from(bucket).upload(objectName, file.buffer, {
    contentType: file.mimetype || 'application/octet-stream',
    upsert: false,
  })
  if (error) throw new ValidationError(`Cannot upload file to storage: ${error.message}`)

  const stored: StoredUpload = {
    originalName,
    objectName,
    storagePath: objectName,
    fileSize: file.size,
    contentType: file.mimetype || 'application/octet-stream',
    checksum: checksumBuffer(file.buffer),
  }

  if (options.publicUrl) {
    stored.publicUrl = supabase.storage.from(bucket).getPublicUrl(objectName).data.publicUrl
  }

  return stored
}
export async function downloadBufferFromBucket(bucket: string, storagePath: string) {
  const supabase = requireSupabase()
  const { data, error } = await supabase.storage.from(bucket).download(storagePath)
  if (error || !data) throw new ValidationError(`Cannot download file from storage: ${error?.message ?? 'File not found'}`)
  return Buffer.from(await data.arrayBuffer())
}

export async function removeObjectsFromBucket(bucket: string, storagePaths: string[]) {
  const paths = storagePaths.filter(Boolean)
  if (!paths.length) return
  const supabase = requireSupabase()
  const { error } = await supabase.storage.from(bucket).remove(paths)
  if (error) throw new ValidationError(`Cannot remove file from storage: ${error.message}`)
}
