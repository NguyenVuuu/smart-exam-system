import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import GuestRoute from './GuestRoute'
import ProtectedRoute from './ProtectedRoute'
import RoleRoute from './RoleRoute'
import LoginPage from '../pages/auth/LoginPage'
import AdminDashboard from '../pages/admin/AdminDashboard'
import TeacherDashboard from '../pages/teacher/TeacherDashboard'
import StudentDashboard from '../pages/student/StudentDashboard'
import StudentSubjectsPage from '../pages/student/StudentSubjectsPage'
import StudentCourseDetailPage from '../pages/student/StudentCourseDetailPage'

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

        {/* Teacher only */}
        <Route
          path="/teacher"
          element={
            <RoleRoute allowedRoles={['TEACHER']}>
              <TeacherDashboard />
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
