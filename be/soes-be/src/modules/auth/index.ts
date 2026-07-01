export { default as authRoutes } from './routes/auth.routes'
export { authenticate } from './middlewares/authenticate'
export { requireAdmin, requireStudent, requireTeacher, requireRoles } from './middlewares/authorize'
