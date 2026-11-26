import type { NextFunction, Request, Response } from 'express'
import multer from 'multer'
import { AppError, ValidationError } from '../../../errors/AppError'

let activeUploads = 0

const ALLOWED_EVIDENCE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
])

export const EVIDENCE_UPLOAD_LIMITS = {
  files: 3,
  fileSizeMb: 2,
  concurrentRequests: 8,
} as const

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: EVIDENCE_UPLOAD_LIMITS.files,
    fileSize: EVIDENCE_UPLOAD_LIMITS.fileSizeMb * 1024 * 1024,
    fields: 6,
    fieldSize: 16 * 1024,
    parts: 10,
  },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_EVIDENCE_TYPES.has(file.mimetype)) {
      callback(new ValidationError('Evidence file type is not supported'))
      return
    }

    callback(null, true)
  },
}).array('evidence', EVIDENCE_UPLOAD_LIMITS.files)

export function uploadViolationEvidence(req: Request, res: Response, next: NextFunction): void {
  if (activeUploads >= EVIDENCE_UPLOAD_LIMITS.concurrentRequests) {
    next(new AppError(503, 'Evidence upload service is busy; retry shortly'))
    return
  }
  activeUploads += 1
  let released = false
  const release = () => {
    if (released) return
    released = true
    activeUploads -= 1
    res.off('finish', release)
    res.off('close', release)
    req.off('aborted', release)
  }
  res.once('finish', release)
  res.once('close', release)
  req.once('aborted', release)
  upload(req, res, (error: unknown) => {
    if (!error) {
      next()
      return
    }

    if (error instanceof multer.MulterError) {
      next(new ValidationError('Invalid evidence upload'))
      return
    }

    next(error)
  })
}
