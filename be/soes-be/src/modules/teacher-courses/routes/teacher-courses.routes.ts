import { Router } from 'express'
import { asyncHandler } from '../../../middlewares/asyncHandler'
import { authenticate } from '../../auth/middlewares/authenticate'
import { requireTeacher } from '../../auth/middlewares/authorize'
import * as controller from '../controllers/teacher-courses.controller'
import { uploadPostAttachments } from '../middlewares/post-attachment-upload'

const router = Router()
router.use(authenticate, requireTeacher())
router.get('/course-offerings', asyncHandler(controller.listCourses))
router.get('/course-offerings/:id', asyncHandler(controller.getCourse))
router.get('/course-offerings/:id/students', asyncHandler(controller.listStudents))
router.get('/course-offerings/:id/exams', asyncHandler(controller.listExams))
router.get('/course-offerings/:id/gradebook', asyncHandler(controller.getGradebook))
router.post('/course-offerings/:id/posts', uploadPostAttachments, asyncHandler(controller.createPost))
router.put('/course-offerings/:id/posts/:postId', uploadPostAttachments, asyncHandler(controller.updatePost))
router.patch('/course-offerings/:id/posts/:postId/pin', asyncHandler(controller.pinPost))
router.delete('/course-offerings/:id/posts/:postId', asyncHandler(controller.deletePost))
router.get('/course-offerings/:id/posts/:postId/attachments/:attachmentId', asyncHandler(controller.downloadPostAttachment))
router.get('/proctor-assignments', asyncHandler(controller.listProctorAssignments))
export default router
