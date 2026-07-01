import { useLogout } from '../../auth/hooks/useLogout'
import { useAuthStore } from '../../store/authStore'

export default function TeacherDashboard() {
  const { logout } = useLogout()
  const user = useAuthStore((s) => s.user)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-3">
        <h1 className="text-2xl font-semibold text-gray-900">Teacher Dashboard</h1>
        {user && <p className="text-gray-500 text-sm">Welcome, {user.fullName}</p>}
        <button
          onClick={logout}
          className="mt-4 px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  )
}
