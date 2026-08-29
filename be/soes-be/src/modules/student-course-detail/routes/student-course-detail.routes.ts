import { Router } from 'express'
import { authenticate } from '../../auth/middlewares/authenticate'
import { requireStudent } from '../../auth/middlewares/authorize'
import * as controller from '../controllers/student-course-detail.controller'

const router = Router()

router.get('/:courseOfferingId', authenticate, requireStudent(), controller.getCourseHeader)
router.get('/:courseOfferingId/timeline', authenticate, requireStudent(), controller.getTimeline)
router.get('/:courseOfferingId/posts/:postId', authenticate, requireStudent(), controller.getPostDetail)
router.get('/:courseOfferingId/exam-schedules/:scheduleId', authenticate, requireStudent(), controller.getExamDetail)
router.get('/:courseOfferingId/members', authenticate, requireStudent(), controller.getMembers)
router.get('/:courseOfferingId/scores', authenticate, requireStudent(), controller.getScores)

export default router
