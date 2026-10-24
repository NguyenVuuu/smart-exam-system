export const BACKOFFICE_PERMISSION_CATALOG = [
  { key: 'ACADEMIC_VIEW', label: 'Xem học kỳ, bộ môn, môn học, lớp và danh sách ghi danh', group: 'Học vụ', module: 'Học vụ', action: 'VIEW' },
  { key: 'ACADEMIC_MANAGE', label: 'Quản lý học vụ, bổ nhiệm trưởng bộ môn và xếp lớp', group: 'Học vụ', module: 'Học vụ', action: 'MANAGE' },
  { key: 'USERS_VIEW', label: 'Xem người dùng', group: 'Tài khoản', module: 'Người dùng và tài khoản', action: 'VIEW' },
  { key: 'USERS_MANAGE', label: 'Tạo, sửa, nhập tài khoản, khóa và đặt lại mật khẩu', group: 'Tài khoản', module: 'Người dùng và tài khoản', action: 'MANAGE' },
  { key: 'QUESTION_BANK_VIEW', label: 'Xem ngân hàng câu hỏi chung', group: 'Chuyên môn', module: 'Ngân hàng câu hỏi chung', action: 'VIEW' },
  { key: 'QUESTION_BANK_MANAGE', label: 'Gỡ và khôi phục câu hỏi trong ngân hàng chung', group: 'Chuyên môn', module: 'Ngân hàng câu hỏi chung', action: 'MANAGE' },
  { key: 'EXAMS_VIEW', label: 'Theo dõi đề thi', group: 'Chuyên môn', module: 'Theo dõi đề thi', action: 'VIEW' },
  { key: 'REVIEW_GROUP_VIEW', label: 'Xem nhóm duyệt đề của các bộ môn', group: 'Chuyên môn', module: 'Nhóm duyệt đề', action: 'VIEW' },
  { key: 'REVIEW_GROUP_MANAGE_ALL', label: 'Hỗ trợ quản lý nhóm duyệt đề mọi bộ môn', group: 'Chuyên môn', module: 'Nhóm duyệt đề', action: 'MANAGE' },
  { key: 'SCHEDULES_VIEW', label: 'Xem lịch thi', group: 'Tổ chức thi', module: 'Lịch thi và phân công', action: 'VIEW' },
  { key: 'SCHEDULES_MANAGE', label: 'Tạo, sửa, hủy lịch thi và phân công coi thi', group: 'Tổ chức thi', module: 'Lịch thi và phân công', action: 'MANAGE' },
  { key: 'MONITORING_VIEW', label: 'Giám sát kỳ thi', group: 'Tổ chức thi', module: 'Giám sát kỳ thi', action: 'VIEW' },
  { key: 'REPORTS_VIEW', label: 'Xem và xuất báo cáo', group: 'Báo cáo', module: 'Báo cáo', action: 'VIEW' },
  { key: 'AUDIT_VIEW', label: 'Xem, tra cứu và xuất nhật ký hệ thống', group: 'Hệ thống', module: 'Nhật ký hệ thống', action: 'VIEW' },
  { key: 'SETTINGS_VIEW', label: 'Xem cấu hình hệ thống', group: 'Hệ thống', module: 'Cấu hình hệ thống', action: 'VIEW' },
  { key: 'SETTINGS_MANAGE', label: 'Quản lý cấu hình hệ thống', group: 'Hệ thống', module: 'Cấu hình hệ thống', action: 'MANAGE' },
] as const

export type BackofficePermission = (typeof BACKOFFICE_PERMISSION_CATALOG)[number]['key']

export const MANAGE_REQUIRES_VIEW: ReadonlyArray<readonly [BackofficePermission, BackofficePermission]> = [
  ['ACADEMIC_MANAGE', 'ACADEMIC_VIEW'],
  ['USERS_MANAGE', 'USERS_VIEW'],
  ['QUESTION_BANK_MANAGE', 'QUESTION_BANK_VIEW'],
  ['REVIEW_GROUP_MANAGE_ALL', 'REVIEW_GROUP_VIEW'],
  ['SCHEDULES_MANAGE', 'SCHEDULES_VIEW'],
  ['SETTINGS_MANAGE', 'SETTINGS_VIEW'],
]

export function permissionChangesWithDependencies(permission: BackofficePermission, allowed: boolean | null) {
  const changes: Array<{ permission: BackofficePermission; allowed: boolean | null }> = [{ permission, allowed }]
  for (const [manage, view] of MANAGE_REQUIRES_VIEW) {
    if (permission === manage && allowed === true) changes.push({ permission: view, allowed: true })
    if (permission === view && allowed === false) changes.push({ permission: manage, allowed: false })
  }
  return changes
}

export function resolveBackofficePermissions(
  rolePermissions: ReadonlyArray<{ permission: string }>,
  overrides: ReadonlyArray<{ permission: string; allowed: boolean }>,
): BackofficePermission[] {
  const known = new Set<string>(BACKOFFICE_PERMISSION_CATALOG.map(({ key }) => key))
  const effective = new Set<BackofficePermission>()
  const denied = new Set<string>()
  for (const { permission } of rolePermissions) {
    if (known.has(permission)) effective.add(permission as BackofficePermission)
  }
  for (const { permission, allowed } of overrides) {
    if (!known.has(permission)) continue
    const key = permission as BackofficePermission
    if (allowed) effective.add(key)
    else {
      effective.delete(key)
      denied.add(key)
    }
  }
  for (const [manage, view] of MANAGE_REQUIRES_VIEW) {
    if (!effective.has(manage)) continue
    if (denied.has(view)) effective.delete(manage)
    else effective.add(view)
  }
  return BACKOFFICE_PERMISSION_CATALOG.map(({ key }) => key).filter((key) => effective.has(key))
}
