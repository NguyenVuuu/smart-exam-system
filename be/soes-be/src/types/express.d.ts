import 'express'

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        isAdmin: boolean
        studentCode: string | null
        teacherCode: string | null
      }
    }
  }
}
