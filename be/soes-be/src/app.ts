import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { errorHandler } from './middlewares/errorHandler'
import { authRoutes } from './modules/auth'
import { studentDashboardRoutes } from './modules/student-dashboard'
import { studentSubjectsRoutes } from './modules/student-subjects'
import { studentCourseDetailRoutes } from './modules/student-course-detail'
import { studentTakeExamRoutes } from './modules/student-take-exam'

const app = express()

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173').split(',')

// ── Core Middlewares ──────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, Postman)
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
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

// ── Routes ────────────────────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api/student', studentDashboardRoutes)
app.use('/api/student', studentSubjectsRoutes)
app.use('/api/student/course-offerings', studentCourseDetailRoutes)
app.use('/api/student', studentTakeExamRoutes)

// ── Health check ──────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// ── Error Handler (must be last) ─────────────────────────
app.use(errorHandler)

export default app
