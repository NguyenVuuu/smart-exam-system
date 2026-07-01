import express from 'express'
import cookieParser from 'cookie-parser'
import { errorHandler } from './middlewares/errorHandler'
import { authRoutes } from './modules/auth'

const app = express()

// ── Core Middlewares ──────────────────────────────────────
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// ── Routes ────────────────────────────────────────────────
app.use('/api/auth', authRoutes)

// ── Health check ──────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// ── Error Handler (must be last) ─────────────────────────
app.use(errorHandler)

export default app
