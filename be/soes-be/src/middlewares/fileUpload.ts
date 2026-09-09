import multer from 'multer'
import type { RequestHandler } from 'express'
import { ValidationError } from '../errors/AppError'

const mb = (value: number) => value * 1024 * 1024
const SYSTEM_LOGO_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])

export const UPLOAD_LIMITS_MB = {
  courseMaterials: 25,
  aiSources: 25,
  questionImages: 5,
  postAttachments: 10,
  systemLogo: 2,
} as const

const createMemoryUpload = (allowedTypes: RegExp, maxFileSizeMb: number) =>
  multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: mb(maxFileSizeMb), files: 10 },
    fileFilter: (_req, file, callback) => {
      const fileNameAllowed = allowedTypes.test(file.originalname.toLowerCase())
      const mimeAllowed = allowedTypes.test(file.mimetype.toLowerCase())
      if (!fileNameAllowed && !mimeAllowed) {
        callback(new ValidationError('Unsupported file type'))
        return
      }
      callback(null, true)
    },
  })

export const uploadCourseMaterials = createMemoryUpload(
  /pdf|docx|pptx/,
  UPLOAD_LIMITS_MB.courseMaterials,
).array('materials', 10)
export const uploadAiSourceFiles = createMemoryUpload(
  /(\.pdf|\.docx|\.txt|\.png|\.jpe?g|\.webp)$|^(application\/pdf|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|text\/plain|image\/(png|jpeg|webp))$/i,
  UPLOAD_LIMITS_MB.aiSources,
).array('files', 5)
export const uploadQuestionImage = createMemoryUpload(
  /png|jpg|jpeg|webp|gif/,
  UPLOAD_LIMITS_MB.questionImages,
).single('file')
export const uploadPostAttachments = createMemoryUpload(
  /pdf|doc|docx|xls|xlsx|ppt|pptx|jpg|jpeg|png|txt/,
  UPLOAD_LIMITS_MB.postAttachments,
).array('attachments', 5)

const systemLogoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: mb(UPLOAD_LIMITS_MB.systemLogo), files: 1 },
  fileFilter: (_request, file, callback) => {
    if (!SYSTEM_LOGO_MIME_TYPES.has(file.mimetype.toLowerCase())) {
      callback(new ValidationError('Logo chỉ hỗ trợ PNG, JPG hoặc WebP'))
      return
    }
    callback(null, true)
  },
}).single('logo')

export const uploadSystemLogo: RequestHandler = (request, response, next) => {
  systemLogoUpload(request, response, (error: unknown) => {
    if (error instanceof multer.MulterError) {
      const message = error.code === 'LIMIT_FILE_SIZE'
        ? `Logo có kích thước tối đa ${UPLOAD_LIMITS_MB.systemLogo}MB`
        : 'Chỉ được tải lên một file logo'
      next(new ValidationError(message))
      return
    }
    next(error)
  })
}
