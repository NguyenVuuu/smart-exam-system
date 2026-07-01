export { default as authRoutes } from './routes/auth.routes'
export { authenticate } from './middlewares/authenticate'
export { requireAdmin, requireStudent, requireTeacher, requireAdminOrTeacher } from './middlewares/authorize'
