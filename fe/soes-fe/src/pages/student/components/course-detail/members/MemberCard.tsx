import type { Member } from '../../../types/course-detail.types'

interface MemberCardProps {
  member: Member
}

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 0) return '?'
  const last = parts[parts.length - 1]
  return last.charAt(0).toUpperCase()
}

const AVATAR_COLORS: Record<string, string> = {
  TEACHER: 'bg-blue-100 text-blue-600',
  STUDENT: 'bg-indigo-100 text-indigo-600',
}

export default function MemberCard({ member }: MemberCardProps) {
  const avatarColorClass = AVATAR_COLORS[member.role] ?? 'bg-gray-100 text-gray-600'
  const initials = getInitials(member.fullName)
  const roleLabel = member.role === 'TEACHER' ? 'Giảng viên' : 'Sinh viên'

  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
      <div
        className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold shrink-0 ${avatarColorClass}`}
      >
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{member.fullName}</p>
        <p className="text-xs text-gray-500">
          {roleLabel}
          {member.studentCode != null && (
            <span className="ml-1 text-gray-400">· {member.studentCode}</span>
          )}
        </p>
      </div>
    </div>
  )
}
