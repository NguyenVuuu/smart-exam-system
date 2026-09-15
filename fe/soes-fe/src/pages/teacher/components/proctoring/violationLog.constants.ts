import type { ViolationRecord } from '../../types/teacher-exam.types'

export const violationTypeLabels: Record<ViolationRecord['type'], string> = {
  TAB_SWITCH: 'Chuyển tab',
  FULLSCREEN_EXIT: 'Thoát toàn màn hình',
  COPY_PASTE: 'Sao chép/dán',
  RIGHT_CLICK: 'Chuột phải',
  NO_FACE: 'Không thấy mặt',
  MULTIPLE_FACES: 'Nhiều khuôn mặt',
  LOOKING_AWAY: 'Nhìn lệch khỏi màn hình',
  CAMERA_BLOCKED: 'Camera bị chặn',
  CAMERA_DISCONNECTED: 'Camera mất kết nối',
  CAMERA_PERMISSION_DENIED: 'Mất quyền camera',
  SCREEN_SHARE_STOPPED: 'Dừng chia sẻ màn hình',
  SCREEN_PERMISSION_DENIED: 'Mất quyền màn hình',
  PROCTOR_WEBCAM_CAPTURE: 'Giảng viên chụp webcam',
  PROCTOR_SCREEN_CAPTURE: 'Giảng viên chụp màn hình',
  IP_CHANGED: 'Thay đổi địa chỉ IP',
  HEARTBEAT_MISSED: 'Mất kết nối giám sát',
  MULTIPLE_ACTIVE_SESSIONS: 'Nhiều phiên thi hoạt động',
  INACTIVITY: 'Không hoạt động',
}
