export interface ReviewGroup {
  id: string; name: string; status: 'ACTIVE' | 'INACTIVE'; canManage: boolean
  department: { id: string; code: string; name: string }
  members: { teacherId: string; joinedAt: string; teacher: { teacherCode: string; status: string; user: { fullName: string; status: string } } }[]
}
export interface ReviewGroupCandidate {
  id: string; teacherCode: string; position: 'LECTURER' | 'DEPARTMENT_HEAD'; user: { fullName: string }
}
