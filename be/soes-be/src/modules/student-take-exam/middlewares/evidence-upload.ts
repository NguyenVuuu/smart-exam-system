import type { NextFunction, Request, Response } from 'express'
import multer from 'multer'
import { ValidationError } from '../../../errors/AppError'

const ALLOWED_EVIDENCE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
])

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 3,
    fileSize: 2 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_EVIDENCE_TYPES.has(file.mimetype)) {
      callback(new ValidationError('Evidence file type is not supported'))
      return
    }

    callback(null, true)
  },
}).array('evidence', 3)

export function uploadViolationEvidence(req: Request, res: Response, next: NextFunction): void {
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
