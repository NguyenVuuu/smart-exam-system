import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { errorHandler } from './middlewares/errorHandler'
import { authRoutes } from './modules/auth'
import { studentDashboardRoutes } from './modules/student-dashboard'
import { studentSubjectsRoutes } from './modules/student-subjects'
import { studentCourseDetailRoutes } from './modules/student-course-detail'
import { studentTakeExamRoutes } from './modules/student-take-exam'
import { adminAcademicRoutes } from './modules/admin-academic'
import { adminUsersRoutes } from './modules/admin-users'
import { teacherCoursesRoutes } from './modules/teacher-courses'
import { teacherQuestionsRoutes } from './modules/teacher-questions'
import { teacherExamsRoutes } from './modules/teacher-exams'
import { examScheduleRoutes } from './modules/exam-schedules'
import { adminContentRoutes } from './modules/admin-content'
import { aiQuestionGenerationRoutes } from './modules/ai-question-generation'
import { corsConfig } from './config'

const app = express()

// ── Core Middlewares ──────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, Postman)
      if (!origin || corsConfig.allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error(`CORS blocked: ${origin}`))
      }
    },
    credentials: true,
  }),
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

app.set('trust proxy', true)   // hoặc số lượng proxy hop, ví dụ: 1

// ── Routes ────────────────────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api/student', studentDashboardRoutes)
app.use('/api/student', studentSubjectsRoutes)
app.use('/api/student/course-offerings', studentCourseDetailRoutes)
app.use('/api/student', studentTakeExamRoutes)
app.use('/api/admin', adminAcademicRoutes)
app.use('/api/admin', adminUsersRoutes)
app.use('/api/admin', examScheduleRoutes)
app.use('/api/admin', adminContentRoutes)
app.use('/api/teacher', teacherCoursesRoutes)
app.use('/api/teacher', teacherQuestionsRoutes)
app.use('/api/teacher', teacherExamsRoutes)
app.use('/api/teacher', aiQuestionGenerationRoutes)

// ── Health check ──────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// ── Error Handler (must be last) ─────────────────────────
app.use(errorHandler)

export default app
