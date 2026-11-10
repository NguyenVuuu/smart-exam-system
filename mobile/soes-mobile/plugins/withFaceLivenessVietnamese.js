const path = require('node:path')
const { IOSConfig, withStringsXml, withXcodeProject } = require('@expo/config-plugins')

// Keys from Amplify UI Android Liveness 1.10.0 and Swift Liveness 1.4.4.
const shared = {
  amplify_ui_liveness_get_ready_photosensitivity_title: 'Lưu ý về ánh sáng nhấp nháy',
  amplify_ui_liveness_get_ready_photosensitivity_description: 'Màn hình sẽ nhấp nháy các màu khác nhau. Hãy thận trọng nếu bạn nhạy cảm với ánh sáng.',
  amplify_ui_liveness_get_ready_photosensitivity_dialog_title: 'Lưu ý về ánh sáng nhấp nháy',
  amplify_ui_liveness_get_ready_photosensitivity_dialog_description: 'Ánh sáng nhấp nháy có thể gây khó chịu hoặc co giật ở người nhạy cảm với ánh sáng. Nếu bạn có tiền sử động kinh, hãy chọn cách xác minh khác với người phụ trách.',
  amplify_ui_liveness_get_ready_begin_check: 'Bắt đầu quét khuôn mặt',
  amplify_ui_liveness_challenge_recording_indicator_label: 'Đang quay',
  amplify_ui_liveness_challenge_instruction_hold_face_during_freshness: 'Giữ yên khuôn mặt trong khung',
  amplify_ui_liveness_challenge_instruction_move_face_closer: 'Tiến lại gần',
  amplify_ui_liveness_challenge_instruction_multiple_faces_detected: 'Chỉ một người đứng trước camera',
  amplify_ui_liveness_challenge_connecting: 'Đang kết nối...',
  amplify_ui_liveness_challenge_verifying: 'Đang xác minh...',
}

const androidStrings = {
  ...shared,
  amplify_ui_liveness_get_ready_center_face_label: 'Đưa mặt vào giữa khung',
  amplify_ui_liveness_get_ready_a11y_photosensitivity_icon_content_description: 'Thông tin về ánh sáng nhấp nháy',
  amplify_ui_liveness_get_ready_photosensitivity_dialog_dismiss: 'Đã hiểu',
  amplify_ui_liveness_challenge_instruction_move_face_further: 'Lùi ra một chút',
  amplify_ui_liveness_challenge_instruction_move_face: 'Đưa mặt trước camera',
  amplify_ui_liveness_challenge_a11y_cancel_content_description: 'Hủy xác minh khuôn mặt',
}

const iosStrings = {
  ...shared,
  amplify_ui_liveness_get_ready_page_title: 'Kiểm tra người thật',
  amplify_ui_liveness_get_ready_photosensitivity_icon_a11y: 'Thông tin về ánh sáng nhấp nháy',
  amplify_ui_liveness_challenge_instruction_hold_face_during_countdown: 'Giữ yên khuôn mặt trong lúc đếm ngược.',
  amplify_ui_liveness_challenge_instruction_move_face_back: 'Lùi ra một chút',
  amplify_ui_liveness_challenge_instruction_move_face_in_front_of_camera: 'Đưa mặt trước camera',
  amplify_ui_liveness_challenge_instruction_hold_still: 'Giữ yên khuôn mặt',
  amplify_ui_liveness_challenge_cancel_a11y: 'Hủy xác minh khuôn mặt',
  amplify_ui_liveness_camera_setting_alert_title: 'Cài đặt quyền camera',
  amplify_ui_liveness_camera_setting_alert_message: 'Cho phép ứng dụng sử dụng camera trong Cài đặt.',
  amplify_ui_liveness_camera_setting_alert_update_setting_button_text: 'Mở Cài đặt',
  amplify_ui_liveness_camera_setting_alert_not_now_button_text: 'Để sau',
  amplify_ui_liveness_close_button_a11y: 'Đóng',
  amplify_ui_liveness_center_your_face_text: 'Đưa mặt vào giữa khung',
  amplify_ui_liveness_camera_permission_page_title: 'Kiểm tra người thật',
  amplify_ui_liveness_camera_permission_button_title: 'Mở cài đặt camera',
  amplify_ui_liveness_camera_permission_button_header: 'Không thể truy cập camera',
  amplify_ui_liveness_camera_permission_button_description: 'Hãy cấp quyền camera trong Cài đặt, đóng ứng dụng rồi thử lại.',
  amplify_ui_liveness_face_not_prepared_reason_pendingCheck: ' ',
  amplify_ui_liveness_face_not_prepared_reason_not_in_oval: 'Đưa toàn bộ khuôn mặt vào khung bầu dục',
  amplify_ui_liveness_face_not_prepared_reason_move_face_closer: 'Tiến lại gần',
  amplify_ui_liveness_face_not_prepared_reason_move_face_right: 'Di chuyển mặt sang phải',
  amplify_ui_liveness_face_not_prepared_reason_move_face_left: 'Di chuyển mặt sang trái',
  amplify_ui_liveness_face_not_prepared_reason_move_to_dimmer_area: 'Ánh sáng quá mạnh, hãy chuyển sang nơi dịu hơn',
  amplify_ui_liveness_face_not_prepared_reason_move_to_brighter_area: 'Ánh sáng quá yếu, hãy đến nơi sáng hơn',
  amplify_ui_liveness_face_not_prepared_reason_no_face: 'Đưa mặt trước camera',
  amplify_ui_liveness_face_not_prepared_reason_multiple_faces: 'Chỉ một người đứng trước camera',
  amplify_ui_liveness_face_not_prepared_reason_face_too_close: 'Lùi ra một chút',
}

function upsertAndroidStrings(resources) {
  const strings = resources.string ?? []
  for (const [name, value] of Object.entries(androidStrings)) {
    const current = strings.find((item) => item.$?.name === name)
    if (current) current._ = value
    else strings.push({ $: { name }, _: value })
  }
  resources.string = strings
  return resources
}

function withFaceLivenessVietnamese(config) {
  config = withStringsXml(config, (mod) => {
    mod.modResults.resources = upsertAndroidStrings(mod.modResults.resources)
    return mod
  })

  return withXcodeProject(config, async (mod) => {
    const projectRoot = mod.modRequest.projectRoot
    const projectName = IOSConfig.XcodeUtils.getProjectName(projectRoot)
    const supportingDirectory = path.join(projectRoot, 'ios', projectName, 'Supporting')
    mod.modResults = await IOSConfig.Locales.writeStringsFile({
      localesMap: { Base: iosStrings },
      supportingDirectory,
      fileName: 'Localizable.strings',
      projectName,
      project: mod.modResults,
    })
    return mod
  })
}

module.exports = withFaceLivenessVietnamese
module.exports.upsertAndroidStrings = upsertAndroidStrings
module.exports.androidStrings = androidStrings
module.exports.iosStrings = iosStrings
