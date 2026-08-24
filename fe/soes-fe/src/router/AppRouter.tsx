import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AdminDashboard from '../pages/admin/AdminDashboard'
import AdminExamApprovalPage from '../pages/admin/AdminExamApprovalPage'
import AdminQuestionApprovalPage from '../pages/admin/AdminQuestionApprovalPage'
import LoginPage from '../pages/auth/LoginPage'
import StudentCourseDetailPage from '../pages/student/StudentCourseDetailPage'
import StudentDashboard from '../pages/student/StudentDashboard'
import StudentExamDetailPage from '../pages/student/StudentExamDetailPage'
import StudentPostDetailPage from '../pages/student/StudentPostDetailPage'
import StudentSubjectsPage from '../pages/student/StudentSubjectsPage'
import TeacherAutoExamMatrixPage from '../pages/teacher/TeacherAutoExamMatrixPage'
import TeacherCourseDetailPage from '../pages/teacher/TeacherCourseDetailPage'
import TeacherCoursesPage from '../pages/teacher/TeacherCoursesPage'
import TeacherDashboard from '../pages/teacher/TeacherDashboard'
import TeacherExamDetailPage from '../pages/teacher/TeacherExamDetailPage'
import TeacherExamEditorPage from '../pages/teacher/TeacherExamEditorPage'
import TeacherExamsPage from '../pages/teacher/TeacherExamsPage'
import TeacherGradeExportPage from '../pages/teacher/TeacherGradeExportPage'
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
          path="/admin/exam-approvals"
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <AdminExamApprovalPage />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/question-approvals"
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <AdminQuestionApprovalPage />
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
          path="/student/course-offerings/:courseOfferingId/exams/:examId"
          element={
            <RoleRoute allowedRoles={['STUDENT']}>
              <StudentExamDetailPage />
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
