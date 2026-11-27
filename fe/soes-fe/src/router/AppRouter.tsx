import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from '../pages/auth/LoginPage'
import GuestRoute from './GuestRoute'
import BackofficeHome from './BackofficeHome'
import BackofficeRoute from './BackofficeRoute'
import ProtectedRoute from './ProtectedRoute'
import RoleRoute from './RoleRoute'
import TeacherReviewAccessRoute from './TeacherReviewAccessRoute'

const AdminAcademicPage = lazy(() => import('../pages/admin/AdminAcademicPage'))
const AdminAccountPage = lazy(() => import('../pages/admin/AdminAccountPage'))
const AdminAuditLogPage = lazy(() => import('../pages/admin/AdminAuditLogPage'))
const AdminClassSectionsPage = lazy(() => import('../pages/admin/AdminClassSectionsPage'))
const AdminPermissionsPage = lazy(() => import('../pages/admin/AdminPermissionsPage'))
const AdminDepartmentsSubjectsPage = lazy(() => import('../pages/admin/AdminDepartmentsSubjectsPage'))
const AdminExamSchedulesPage = lazy(() => import('../pages/admin/AdminExamSchedulesPage'))
const AdminExamTrackingPage = lazy(() => import('../pages/admin/AdminExamTrackingPage'))
const AdminProctoringPage = lazy(() => import('../pages/admin/AdminProctoringPage'))
const AdminReportsPage = lazy(() => import('../pages/admin/AdminReportsPage'))
const AdminReviewGroupsPage = lazy(() => import('../pages/admin/AdminReviewGroupsPage'))
const AdminSettingsPage = lazy(() => import('../pages/admin/AdminSettingsPage'))
const AdminSharedQuestionBankPage = lazy(() => import('../pages/admin/AdminSharedQuestionBankPage'))
const AdminUsersPage = lazy(() => import('../pages/admin/AdminUsersPage'))
const RoleSelectPage = lazy(() => import('../pages/auth/RoleSelectPage'))
const StudentCourseDetailPage = lazy(() => import('../pages/student/StudentCourseDetailPage'))
const StudentDashboard = lazy(() => import('../pages/student/StudentDashboard'))
const StudentFaceEnrollmentPage = lazy(() => import('../pages/student/StudentFaceEnrollmentPage'))
const StudentExamDetailPage = lazy(() => import('../pages/student/StudentExamDetailPage'))
const StudentExamsPage = lazy(() => import('../pages/student/StudentExamsPage'))
const StudentExamResultPage = lazy(() => import('../pages/student/StudentExamResultPage'))
const StudentNotificationsPage = lazy(() => import('../pages/student/StudentNotificationsPage'))
const StudentScoresPage = lazy(() => import('../pages/student/StudentScoresPage'))
const StudentLearningPage = lazy(() => import('../pages/student/StudentLearningPage'))
const StudentSettingsPage = lazy(() => import('../pages/student/StudentSettingsPage'))
const StudentPostDetailPage = lazy(() => import('../pages/student/StudentPostDetailPage'))
const StudentTakeExamPage = lazy(() => import('../pages/student/StudentTakeExamPage'))
const StudentSubjectsPage = lazy(() => import('../pages/student/StudentSubjectsPage'))
const TeacherAutoExamMatrixPage = lazy(() => import('../pages/teacher/TeacherAutoExamMatrixPage'))
const TeacherAccountPage = lazy(() => import('../pages/teacher/TeacherAccountPage'))
const TeacherAiQuestionGeneratorPage = lazy(() => import('../pages/teacher/TeacherAiQuestionGeneratorPage'))
const TeacherCourseDetailPage = lazy(() => import('../pages/teacher/TeacherCourseDetailPage'))
const TeacherCoursesPage = lazy(() => import('../pages/teacher/TeacherCoursesPage'))
const TeacherDashboard = lazy(() => import('../pages/teacher/TeacherDashboard'))
const TeacherDepartmentApprovalPage = lazy(() => import('../pages/teacher/TeacherDepartmentApprovalPage'))
const TeacherExamApprovalDetailPage = lazy(() => import('../pages/teacher/TeacherExamApprovalDetailPage'))
const TeacherExamDetailPage = lazy(() => import('../pages/teacher/TeacherExamDetailPage'))
const TeacherExamEditorPage = lazy(() => import('../pages/teacher/TeacherExamEditorPage'))
const TeacherExamsPage = lazy(() => import('../pages/teacher/TeacherExamsPage'))
const TeacherGradeAppealReviewPage = lazy(() => import('../pages/teacher/TeacherGradeAppealReviewPage'))
const TeacherGradeExportPage = lazy(() => import('../pages/teacher/TeacherGradeExportPage'))
const TeacherInvigilationSchedulePage = lazy(() => import('../pages/teacher/TeacherInvigilationSchedulePage'))
const TeacherLiveProctorPage = lazy(() => import('../pages/teacher/TeacherLiveProctorPage'))
const TeacherQuestionAuditPage = lazy(() => import('../pages/teacher/TeacherQuestionAuditPage'))
const TeacherQuestionBankPage = lazy(() => import('../pages/teacher/TeacherQuestionBankPage'))
const TeacherReviewGroupPage = lazy(() => import('../pages/teacher/TeacherReviewGroupPage'))

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div role="status" className="p-6 text-center">Đang tải…</div>}>
      <Routes>
        {/* Guest only */}
        <Route
          path="/login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
        <Route
          path="/select-role"
          element={
            <GuestRoute>
              <RoleSelectPage />
            </GuestRoute>
          }
        />

        {/* Backoffice */}
        <Route
          path="/admin"
          element={
            <RoleRoute allowedRoles={['ADMIN', 'EDUCATION_OFFICER']}>
              <BackofficeHome />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/account"
          element={
            <RoleRoute allowedRoles={['ADMIN', 'EDUCATION_OFFICER']}>
              <AdminAccountPage />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/academic"
          element={
            <BackofficeRoute permission="ACADEMIC_VIEW">
              <AdminAcademicPage />
            </BackofficeRoute>
          }
        />
        <Route
          path="/admin/academic-structure"
          element={
            <BackofficeRoute permission="ACADEMIC_VIEW">
              <AdminDepartmentsSubjectsPage />
            </BackofficeRoute>
          }
        />
        <Route path="/admin/courses" element={<Navigate to="/admin/academic-structure" replace />} />
        <Route path="/admin/departments" element={<Navigate to="/admin/academic-structure" replace />} />
        <Route
          path="/admin/class-sections"
          element={
            <BackofficeRoute permission="ACADEMIC_VIEW">
              <AdminClassSectionsPage />
            </BackofficeRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <BackofficeRoute permission="USERS_VIEW">
              <AdminUsersPage />
            </BackofficeRoute>
          }
        />
        <Route
          path="/admin/permissions"
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <AdminPermissionsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/shared-question-bank"
          element={
            <BackofficeRoute permission="QUESTION_BANK_VIEW">
              <AdminSharedQuestionBankPage />
            </BackofficeRoute>
          }
        />
        <Route path="/admin/question-approvals" element={<Navigate to="/admin/shared-question-bank" replace />} />
        <Route
          path="/admin/exams"
          element={
            <BackofficeRoute permission="EXAMS_VIEW">
              <AdminExamTrackingPage />
            </BackofficeRoute>
          }
        />
        <Route path="/admin/exam-approvals" element={<Navigate to="/admin/exams" replace />} />
        <Route path="/admin/review-groups" element={<BackofficeRoute permission="REVIEW_GROUP_VIEW"><AdminReviewGroupsPage /></BackofficeRoute>} />
        <Route
          path="/admin/exam-schedules"
          element={
            <BackofficeRoute permission="SCHEDULES_VIEW">
              <AdminExamSchedulesPage />
            </BackofficeRoute>
          }
        />
        <Route path="/admin/exam-rooms" element={<Navigate to="/admin/exam-schedules" replace />} />
        <Route
          path="/admin/proctoring"
          element={
            <BackofficeRoute permission="MONITORING_VIEW">
              <AdminProctoringPage />
            </BackofficeRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <BackofficeRoute permission="REPORTS_VIEW">
              <AdminReportsPage />
            </BackofficeRoute>
          }
        />
        <Route
          path="/admin/audit-logs"
          element={
            <BackofficeRoute permission="AUDIT_VIEW">
              <AdminAuditLogPage />
            </BackofficeRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <BackofficeRoute permission="SETTINGS_VIEW">
              <AdminSettingsPage />
            </BackofficeRoute>
          }
        />

        {/* Teacher only */}
        <Route
          path="/teacher"
          element={
            <RoleRoute allowedRoles={['TEACHER', 'DEPARTMENT_HEAD']}>
              <TeacherDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="/teacher/courses"
          element={
            <RoleRoute allowedRoles={['TEACHER', 'DEPARTMENT_HEAD']}>
              <TeacherCoursesPage />
            </RoleRoute>
          }
        />
        <Route
          path="/teacher/account"
          element={
            <RoleRoute allowedRoles={['TEACHER', 'DEPARTMENT_HEAD']}>
              <TeacherAccountPage />
            </RoleRoute>
          }
        />
        <Route
          path="/teacher/courses/:courseOfferingId"
          element={
            <RoleRoute allowedRoles={['TEACHER', 'DEPARTMENT_HEAD']}>
              <TeacherCourseDetailPage />
            </RoleRoute>
          }
        />
        <Route
          path="/teacher/courses/:courseOfferingId/exams/:examId/submissions"
          element={
            <RoleRoute allowedRoles={['TEACHER', 'DEPARTMENT_HEAD']}>
              <TeacherExamDetailPage mode="course-submissions" />
            </RoleRoute>
          }
        />

        {/* Question Hub */}
        <Route
          path="/teacher/question-bank"
          element={
            <RoleRoute allowedRoles={['TEACHER', 'DEPARTMENT_HEAD']}>
              <TeacherQuestionBankPage />
            </RoleRoute>
          }
        />
        <Route
          path="/teacher/question-bank/ai-generator"
          element={
            <RoleRoute allowedRoles={['TEACHER', 'DEPARTMENT_HEAD']}>
              <TeacherAiQuestionGeneratorPage />
            </RoleRoute>
          }
        />
        <Route
          path="/teacher/question-audit"
          element={
            <RoleRoute allowedRoles={['TEACHER', 'DEPARTMENT_HEAD']}>
              <TeacherQuestionAuditPage />
            </RoleRoute>
          }
        />

        {/* Exam Hub */}
        <Route
          path="/teacher/exams"
          element={
            <RoleRoute allowedRoles={['TEACHER', 'DEPARTMENT_HEAD']}>
              <TeacherExamsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/teacher/exams/create"
          element={
            <RoleRoute allowedRoles={['TEACHER', 'DEPARTMENT_HEAD']}>
              <TeacherExamEditorPage />
            </RoleRoute>
          }
        />
        <Route
          path="/teacher/exams/auto-generator"
          element={
            <RoleRoute allowedRoles={['TEACHER', 'DEPARTMENT_HEAD']}>
              <TeacherAutoExamMatrixPage />
            </RoleRoute>
          }
        />
        <Route
          path="/teacher/exams/:examId/edit"
          element={
            <RoleRoute allowedRoles={['TEACHER', 'DEPARTMENT_HEAD']}>
              <TeacherExamEditorPage />
            </RoleRoute>
          }
        />
        <Route
          path="/teacher/exams/:examId"
          element={
            <RoleRoute allowedRoles={['TEACHER', 'DEPARTMENT_HEAD']}>
              <TeacherExamDetailPage />
            </RoleRoute>
          }
        />

        {/* Proctoring & Reports Hub */}
        <Route
          path="/teacher/invigilation-schedule"
          element={
            <RoleRoute allowedRoles={['TEACHER', 'DEPARTMENT_HEAD']}>
              <TeacherInvigilationSchedulePage />
            </RoleRoute>
          }
        />
        <Route
          path="/teacher/department-approvals"
          element={
            <RoleRoute allowedRoles={['TEACHER', 'DEPARTMENT_HEAD']}>
              <TeacherReviewAccessRoute permission="canReview"><TeacherDepartmentApprovalPage /></TeacherReviewAccessRoute>
            </RoleRoute>
          }
        />
        <Route
          path="/teacher/department-approvals/:examId"
          element={
            <RoleRoute allowedRoles={['TEACHER', 'DEPARTMENT_HEAD']}>
              <TeacherReviewAccessRoute permission="canReview"><TeacherExamApprovalDetailPage /></TeacherReviewAccessRoute>
            </RoleRoute>
          }
        />
        <Route
          path="/teacher/review-group"
          element={
            <RoleRoute allowedRoles={['TEACHER', 'DEPARTMENT_HEAD']}>
              <TeacherReviewAccessRoute permission="canViewGroup"><TeacherReviewGroupPage /></TeacherReviewAccessRoute>
            </RoleRoute>
          }
        />
        <Route
          path="/teacher/proctoring"
          element={
            <RoleRoute allowedRoles={['TEACHER', 'DEPARTMENT_HEAD']}>
              <TeacherLiveProctorPage />
            </RoleRoute>
          }
        />
        <Route
          path="/teacher/grading-reports"
          element={
            <RoleRoute allowedRoles={['TEACHER', 'DEPARTMENT_HEAD']}>
              <TeacherGradeExportPage />
            </RoleRoute>
          }
        />
        <Route
          path="/teacher/grading-reports/appeals/:appealId"
          element={
            <RoleRoute allowedRoles={['TEACHER', 'DEPARTMENT_HEAD']}>
              <TeacherGradeAppealReviewPage />
            </RoleRoute>
          }
        />

        {/* Student only */}
        <Route
          path="/student/face-enrollment"
          element={
            <RoleRoute allowedRoles={['STUDENT']}>
              <StudentFaceEnrollmentPage />
            </RoleRoute>
          }
        />
        <Route
          path="/student"
          element={
            <RoleRoute allowedRoles={['STUDENT']}>
              <StudentDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="/student/subjects"
          element={
            <RoleRoute allowedRoles={['STUDENT']}>
              <StudentSubjectsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/student/exams"
          element={
            <RoleRoute allowedRoles={['STUDENT']}>
              <StudentExamsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/student/scores"
          element={
            <RoleRoute allowedRoles={['STUDENT']}>
              <StudentScoresPage />
            </RoleRoute>
          }
        />
        <Route
          path="/student/learning"
          element={
            <RoleRoute allowedRoles={['STUDENT']}>
              <StudentLearningPage />
            </RoleRoute>
          }
        />
        <Route
          path="/student/notifications"
          element={
            <RoleRoute allowedRoles={['STUDENT']}>
              <StudentNotificationsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/student/settings"
          element={
            <RoleRoute allowedRoles={['STUDENT']}>
              <StudentSettingsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/student/courses/:courseOfferingId"
          element={
            <RoleRoute allowedRoles={['STUDENT']}>
              <StudentCourseDetailPage />
            </RoleRoute>
          }
        />
        <Route
          path="/student/course-offerings/:courseOfferingId"
          element={
            <RoleRoute allowedRoles={['STUDENT']}>
              <StudentCourseDetailPage />
            </RoleRoute>
          }
        />
        <Route
          path="/student/course-offerings/:courseOfferingId/posts/:postId"
          element={
            <RoleRoute allowedRoles={['STUDENT']}>
              <StudentPostDetailPage />
            </RoleRoute>
          }
        />
        <Route
          path="/student/course-offerings/:courseOfferingId/exam-schedules/:scheduleId"
          element={
            <RoleRoute allowedRoles={['STUDENT']}>
              <StudentExamDetailPage />
            </RoleRoute>
          }
        />
        <Route
          path="/student/course-offerings/:courseOfferingId/exam-schedules/:scheduleId/take"
          element={
            <RoleRoute allowedRoles={['STUDENT']}>
              <StudentTakeExamPage />
            </RoleRoute>
          }
        />
        <Route
          path="/student/course-offerings/:courseOfferingId/exam-schedules/:scheduleId/result"
          element={
            <RoleRoute allowedRoles={['STUDENT']}>
              <StudentExamResultPage />
            </RoleRoute>
          }
        />

        {/* Fallback */}
        <Route
          path="*"
          element={
            <ProtectedRoute>
              <Navigate to="/login" replace />
            </ProtectedRoute>
          }
        />
      </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
