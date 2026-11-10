const assert = require('node:assert/strict')
const { it } = require('node:test')
const { androidStrings, iosStrings, upsertAndroidStrings } = require('./withFaceLivenessVietnamese')

it('translates every Android Liveness label and keeps unrelated app strings', () => {
  const resources = {
    string: [
      { $: { name: 'app_name' }, _: 'soes-mobile' },
      { $: { name: 'amplify_ui_liveness_get_ready_begin_check' }, _: 'Start video check' },
    ],
  }
  upsertAndroidStrings(resources)
  upsertAndroidStrings(resources)

  assert.equal(resources.string[0]._, 'soes-mobile')
  assert.equal(resources.string.length, Object.keys(androidStrings).length + 1)
  for (const [key, value] of Object.entries(androidStrings)) {
    assert.equal(resources.string.find((item) => item.$.name === key)?._, value)
  }
})

it('provides Vietnamese strings for iOS camera instructions and permission errors', () => {
  assert.equal(iosStrings.amplify_ui_liveness_center_your_face_text, 'Đưa mặt vào giữa khung')
  assert.equal(iosStrings.amplify_ui_liveness_camera_permission_button_header, 'Không thể truy cập camera')
  assert.equal(iosStrings.amplify_ui_liveness_challenge_instruction_move_face_back, 'Lùi ra một chút')
})
