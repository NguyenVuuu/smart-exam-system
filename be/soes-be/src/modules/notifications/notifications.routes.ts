import { Router } from 'express'
import { asyncHandler } from '../../middlewares/asyncHandler'
import { authenticate } from '../auth/middlewares/authenticate'
import { requireTeacher } from '../auth/middlewares/authorize'
import * as controller from './notifications.controller'

function createRouter(teacherOnly: boolean) {
  const router = Router()
  router.use(authenticate)
  if (teacherOnly) router.use(requireTeacher())
  router.get('/', asyncHandler(controller.list))
  router.patch('/read-all', asyncHandler(controller.markAllRead))
  router.patch('/:notificationId/read', asyncHandler(controller.markRead))
  return router
}

export const allRoleNotificationsRoutes = createRouter(false)
export default createRouter(true)
