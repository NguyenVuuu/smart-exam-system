import multer from 'multer'
import { ValidationError } from '../errors/AppError'

const mb = (value: number) => value * 1024 * 1024

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

export const uploadCourseMaterials = createMemoryUpload(/pdf|docx|pptx/, 25).array('materials', 10)
export const uploadAiSourceFiles = createMemoryUpload(
  /(\.pdf|\.docx|\.txt|\.png|\.jpe?g|\.webp)$|^(application\/pdf|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|text\/plain|image\/(png|jpeg|webp))$/i,
  25,
).array('files', 5)
export const uploadQuestionImage = createMemoryUpload(/png|jpg|jpeg|webp|gif/, 5).single('file')
export const uploadPostAttachments = createMemoryUpload(/pdf|doc|docx|xls|xlsx|ppt|pptx|jpg|jpeg|png|txt/, 10).array('attachments', 5)
