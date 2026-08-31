import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AdminAcademicPage from '../pages/admin/AdminAcademicPage'
import AdminAuditLogPage from '../pages/admin/AdminAuditLogPage'
import AdminClassSectionsPage from '../pages/admin/AdminClassSectionsPage'
import AdminDashboard from '../pages/admin/AdminDashboard'
import AdminDepartmentsSubjectsPage from '../pages/admin/AdminDepartmentsSubjectsPage'
import AdminExamSchedulesPage from '../pages/admin/AdminExamSchedulesPage'
import AdminExamTrackingPage from '../pages/admin/AdminExamTrackingPage'
import AdminProctoringPage from '../pages/admin/AdminProctoringPage'
import AdminReportsPage from '../pages/admin/AdminReportsPage'
import AdminSettingsPage from '../pages/admin/AdminSettingsPage'
import AdminSharedQuestionBankPage from '../pages/admin/AdminSharedQuestionBankPage'
import AdminUsersPage from '../pages/admin/AdminUsersPage'
import AdminLoginPage from '../pages/auth/AdminLoginPage'
import LoginPage from '../pages/auth/LoginPage'
import StudentCourseDetailPage from '../pages/student/StudentCourseDetailPage'
import StudentDashboard from '../pages/student/StudentDashboard'
import StudentExamDetailPage from '../pages/student/StudentExamDetailPage'
import StudentExamResultPage from '../pages/student/StudentExamResultPage'
import StudentPostDetailPage from '../pages/student/StudentPostDetailPage'
import StudentTakeExamPage from '../pages/student/StudentTakeExamPage'
import StudentSubjectsPage from '../pages/student/StudentSubjectsPage'
import TeacherAutoExamMatrixPage from '../pages/teacher/TeacherAutoExamMatrixPage'
import TeacherCourseDetailPage from '../pages/teacher/TeacherCourseDetailPage'
import TeacherCoursesPage from '../pages/teacher/TeacherCoursesPage'
import TeacherDashboard from '../pages/teacher/TeacherDashboard'
import TeacherDepartmentApprovalPage from '../pages/teacher/TeacherDepartmentApprovalPage'
import TeacherExamDetailPage from '../pages/teacher/TeacherExamDetailPage'
import TeacherExamEditorPage from '../pages/teacher/TeacherExamEditorPage'
import TeacherExamsPage from '../pages/teacher/TeacherExamsPage'
import TeacherGradeExportPage from '../pages/teacher/TeacherGradeExportPage'
import TeacherInvigilationSchedulePage from '../pages/teacher/TeacherInvigilationSchedulePage'
import TeacherLiveProctorPage from '../pages/teacher/TeacherLiveProctorPage'
import TeacherQuestionAuditPage from '../pages/teacher/TeacherQuestionAuditPage'
import TeacherQuestionBankPage from '../pages/teacher/TeacherQuestionBankPage'
import GuestRoute from './GuestRoute'
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
          path="/admin/login"
          element={
            <GuestRoute>
              <AdminLoginPage />
            </GuestRoute>
          }
        />

        {/* Admin only */}
        <Route
          path="/admin"
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/academic"
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <AdminAcademicPage />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/academic-structure"
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <AdminDepartmentsSubjectsPage />
            </RoleRoute>
          }
        />
        <Route path="/admin/courses" element={<Navigate to="/admin/academic-structure" replace />} />
        <Route path="/admin/departments" element={<Navigate to="/admin/academic-structure" replace />} />
        <Route
          path="/admin/class-sections"
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <AdminClassSectionsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <AdminUsersPage />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/shared-question-bank"
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <AdminSharedQuestionBankPage />
            </RoleRoute>
          }
        />
        <Route path="/admin/question-approvals" element={<Navigate to="/admin/shared-question-bank" replace />} />
        <Route
          path="/admin/exams"
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <AdminExamTrackingPage />
            </RoleRoute>
          }
        />
        <Route path="/admin/exam-approvals" element={<Navigate to="/admin/exams" replace />} />
        <Route
          path="/admin/exam-schedules"
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <AdminExamSchedulesPage />
            </RoleRoute>
          }
        />
        <Route path="/admin/exam-rooms" element={<Navigate to="/admin/exam-schedules" replace />} />
        <Route
          path="/admin/proctoring"
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <AdminProctoringPage />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <AdminReportsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/audit-logs"
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <AdminAuditLogPage />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <AdminSettingsPage />
            </RoleRoute>
          }
        />

        {/* Teacher only */}
        <Route
          path="/teacher"
          element={
            <RoleRoute allowedRoles={['TEACHER']}>
              <TeacherDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="/teacher/courses"
          element={
            <RoleRoute allowedRoles={['TEACHER']}>
              <TeacherCoursesPage />
            </RoleRoute>
          }
        />
        <Route
          path="/teacher/courses/:courseOfferingId"
          element={
            <RoleRoute allowedRoles={['TEACHER']}>
              <TeacherCourseDetailPage />
            </RoleRoute>
          }
        />
        <Route
          path="/teacher/courses/:courseOfferingId/exams/:examId/submissions"
          element={
            <RoleRoute allowedRoles={['TEACHER']}>
              <TeacherExamDetailPage mode="course-submissions" />
            </RoleRoute>
          }
        />

        {/* Question Hub */}
        <Route
          path="/teacher/question-bank"
          element={
            <RoleRoute allowedRoles={['TEACHER']}>
              <TeacherQuestionBankPage />
            </RoleRoute>
          }
        />
        <Route
          path="/teacher/question-audit"
          element={
            <RoleRoute allowedRoles={['TEACHER']}>
              <TeacherQuestionAuditPage />
            </RoleRoute>
          }
        />

        {/* Exam Hub */}
        <Route
          path="/teacher/exams"
          element={
            <RoleRoute allowedRoles={['TEACHER']}>
              <TeacherExamsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/teacher/exams/create"
          element={
            <RoleRoute allowedRoles={['TEACHER']}>
              <TeacherExamEditorPage />
            </RoleRoute>
          }
        />
        <Route
          path="/teacher/exams/auto-generator"
          element={
            <RoleRoute allowedRoles={['TEACHER']}>
              <TeacherAutoExamMatrixPage />
            </RoleRoute>
          }
        />
        <Route
          path="/teacher/exams/:examId/edit"
          element={
            <RoleRoute allowedRoles={['TEACHER']}>
              <TeacherExamEditorPage />
            </RoleRoute>
          }
        />
        <Route
          path="/teacher/exams/:examId"
          element={
            <RoleRoute allowedRoles={['TEACHER']}>
              <TeacherExamDetailPage />
            </RoleRoute>
          }
        />

        {/* Proctoring & Reports Hub */}
        <Route
          path="/teacher/invigilation-schedule"
          element={
            <RoleRoute allowedRoles={['TEACHER']}>
              <TeacherInvigilationSchedulePage />
            </RoleRoute>
          }
        />
        <Route
          path="/teacher/department-approvals"
          element={
            <RoleRoute allowedRoles={['TEACHER']}>
              <TeacherDepartmentApprovalPage />
            </RoleRoute>
          }
        />
        <Route
          path="/teacher/proctoring"
          element={
            <RoleRoute allowedRoles={['TEACHER']}>
              <TeacherLiveProctorPage />
            </RoleRoute>
          }
        />
        <Route
          path="/teacher/grading-reports"
          element={
            <RoleRoute allowedRoles={['TEACHER']}>
              <TeacherGradeExportPage />
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
