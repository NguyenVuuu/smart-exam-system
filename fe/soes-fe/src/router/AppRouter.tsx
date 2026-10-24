import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AdminAcademicPage from '../pages/admin/AdminAcademicPage'
import AdminAuditLogPage from '../pages/admin/AdminAuditLogPage'
import AdminClassSectionsPage from '../pages/admin/AdminClassSectionsPage'
import AdminPermissionsPage from '../pages/admin/AdminPermissionsPage'
import AdminDepartmentsSubjectsPage from '../pages/admin/AdminDepartmentsSubjectsPage'
import AdminExamSchedulesPage from '../pages/admin/AdminExamSchedulesPage'
import AdminExamTrackingPage from '../pages/admin/AdminExamTrackingPage'
import AdminProctoringPage from '../pages/admin/AdminProctoringPage'
import AdminReportsPage from '../pages/admin/AdminReportsPage'
import AdminSettingsPage from '../pages/admin/AdminSettingsPage'
import AdminSharedQuestionBankPage from '../pages/admin/AdminSharedQuestionBankPage'
import AdminUsersPage from '../pages/admin/AdminUsersPage'
import LoginPage from '../pages/auth/LoginPage'
import RoleSelectPage from '../pages/auth/RoleSelectPage'
import StudentCourseDetailPage from '../pages/student/StudentCourseDetailPage'
import StudentDashboard from '../pages/student/StudentDashboard'
import StudentExamDetailPage from '../pages/student/StudentExamDetailPage'
import StudentExamsPage from '../pages/student/StudentExamsPage'
import StudentExamResultPage from '../pages/student/StudentExamResultPage'
import StudentNotificationsPage from '../pages/student/StudentNotificationsPage'
import StudentScoresPage from '../pages/student/StudentScoresPage'
import StudentSettingsPage from '../pages/student/StudentSettingsPage'
import StudentPostDetailPage from '../pages/student/StudentPostDetailPage'
import StudentTakeExamPage from '../pages/student/StudentTakeExamPage'
import StudentSubjectsPage from '../pages/student/StudentSubjectsPage'
import TeacherAutoExamMatrixPage from '../pages/teacher/TeacherAutoExamMatrixPage'
import TeacherAccountPage from '../pages/teacher/TeacherAccountPage'
import TeacherAiQuestionGeneratorPage from '../pages/teacher/TeacherAiQuestionGeneratorPage'
import TeacherCourseDetailPage from '../pages/teacher/TeacherCourseDetailPage'
import TeacherCoursesPage from '../pages/teacher/TeacherCoursesPage'
import TeacherDashboard from '../pages/teacher/TeacherDashboard'
import TeacherDepartmentApprovalPage from '../pages/teacher/TeacherDepartmentApprovalPage'
import TeacherExamDetailPage from '../pages/teacher/TeacherExamDetailPage'
import TeacherExamEditorPage from '../pages/teacher/TeacherExamEditorPage'
import TeacherExamsPage from '../pages/teacher/TeacherExamsPage'
import TeacherGradeAppealReviewPage from '../pages/teacher/TeacherGradeAppealReviewPage'
import TeacherGradeExportPage from '../pages/teacher/TeacherGradeExportPage'
import TeacherInvigilationSchedulePage from '../pages/teacher/TeacherInvigilationSchedulePage'
import TeacherLiveProctorPage from '../pages/teacher/TeacherLiveProctorPage'
import TeacherQuestionAuditPage from '../pages/teacher/TeacherQuestionAuditPage'
import TeacherQuestionBankPage from '../pages/teacher/TeacherQuestionBankPage'
import TeacherReviewGroupPage from '../pages/teacher/TeacherReviewGroupPage'
import GuestRoute from './GuestRoute'
import BackofficeHome from './BackofficeHome'
import BackofficeRoute from './BackofficeRoute'
import ProtectedRoute from './ProtectedRoute'
import RoleRoute from './RoleRoute'

export default function AppRouter() {
  return (
    <BrowserRouter>
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
              <TeacherDepartmentApprovalPage />
            </RoleRoute>
          }
        />
        <Route
          path="/teacher/review-group"
          element={
            <RoleRoute allowedRoles={['TEACHER', 'DEPARTMENT_HEAD']}>
              <TeacherReviewGroupPage />
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
    </BrowserRouter>
  )
}
