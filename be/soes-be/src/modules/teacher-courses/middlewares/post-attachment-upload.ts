import { randomUUID } from 'crypto'
import { mkdirSync } from 'fs'
import { extname, resolve } from 'path'
import multer from 'multer'

export const postAttachmentDirectory = resolve(process.cwd(), 'storage', 'post-attachments')
mkdirSync(postAttachmentDirectory, { recursive: true })

const allowedTypes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg', 'image/png', 'text/plain',
])

export const uploadPostAttachments = multer({
  storage: multer.diskStorage({
    destination: postAttachmentDirectory,
    filename: (_req, file, callback) => callback(null, `${randomUUID()}${extname(file.originalname)}`),
  }),
  limits: { files: 5, fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => callback(null, allowedTypes.has(file.mimetype)),
}).array('attachments', 5)

