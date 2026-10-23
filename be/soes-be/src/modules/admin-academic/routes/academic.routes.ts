import { Router } from 'express'
import { authenticate } from '../../auth/middlewares/authenticate'
import { requireBackoffice } from '../../auth/middlewares/requireBackoffice'
import { asyncHandler } from '../../../middlewares/asyncHandler'
import * as controller from '../controllers/academic.controller'

const router = Router()
router.use(authenticate)

router.get('/semesters', requireBackoffice('ACADEMIC_VIEW', 'SCHEDULES_VIEW', 'EXAMS_VIEW'), asyncHandler(controller.listSemesters))
router.post('/semesters', requireBackoffice('ACADEMIC_MANAGE'), asyncHandler(controller.createSemester))
router.put('/semesters/:id', requireBackoffice('ACADEMIC_MANAGE'), asyncHandler(controller.updateSemester))
router.patch('/semesters/:id/activate', requireBackoffice('ACADEMIC_MANAGE'), asyncHandler(controller.activateSemester))

router.get('/departments', requireBackoffice('ACADEMIC_VIEW', 'SCHEDULES_VIEW', 'USERS_VIEW', 'EXAMS_VIEW', 'QUESTION_BANK_VIEW'), asyncHandler(controller.listDepartments))
router.post('/departments', requireBackoffice('ACADEMIC_MANAGE'), asyncHandler(controller.createDepartment))
router.put('/departments/:id', requireBackoffice('ACADEMIC_MANAGE'), asyncHandler(controller.updateDepartment))
router.patch('/departments/:id/head', requireBackoffice('ACADEMIC_MANAGE'), asyncHandler(controller.assignDepartmentHead))

router.get('/subjects', requireBackoffice('ACADEMIC_VIEW', 'SCHEDULES_VIEW', 'EXAMS_VIEW', 'QUESTION_BANK_VIEW'), asyncHandler(controller.listSubjects))
router.post('/subjects', requireBackoffice('ACADEMIC_MANAGE'), asyncHandler(controller.createSubject))
router.put('/subjects/:id', requireBackoffice('ACADEMIC_MANAGE'), asyncHandler(controller.updateSubject))

router.get('/course-offerings', requireBackoffice('ACADEMIC_VIEW', 'SCHEDULES_VIEW'), asyncHandler(controller.listCourseOfferings))
router.post('/course-offerings', requireBackoffice('ACADEMIC_MANAGE'), asyncHandler(controller.createCourseOffering))
router.put('/course-offerings/:id', requireBackoffice('ACADEMIC_MANAGE'), asyncHandler(controller.updateCourseOffering))

export default router
