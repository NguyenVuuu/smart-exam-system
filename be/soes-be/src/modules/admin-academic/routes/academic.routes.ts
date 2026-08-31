import { Router } from 'express'
import { authenticate } from '../../auth/middlewares/authenticate'
import { requireAdmin } from '../../auth/middlewares/authorize'
import { asyncHandler } from '../../../middlewares/asyncHandler'
import * as controller from '../controllers/academic.controller'

const router = Router()
router.use(authenticate, requireAdmin())

router.get('/semesters', asyncHandler(controller.listSemesters))
router.post('/semesters', asyncHandler(controller.createSemester))
router.put('/semesters/:id', asyncHandler(controller.updateSemester))
router.patch('/semesters/:id/activate', asyncHandler(controller.activateSemester))

router.get('/departments', asyncHandler(controller.listDepartments))
router.post('/departments', asyncHandler(controller.createDepartment))
router.put('/departments/:id', asyncHandler(controller.updateDepartment))
router.patch('/departments/:id/head', asyncHandler(controller.assignDepartmentHead))

router.get('/subjects', asyncHandler(controller.listSubjects))
router.post('/subjects', asyncHandler(controller.createSubject))
router.put('/subjects/:id', asyncHandler(controller.updateSubject))

router.get('/course-offerings', asyncHandler(controller.listCourseOfferings))
router.post('/course-offerings', asyncHandler(controller.createCourseOffering))
router.put('/course-offerings/:id', asyncHandler(controller.updateCourseOffering))

export default router
