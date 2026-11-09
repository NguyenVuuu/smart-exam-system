const assert = require('node:assert/strict')
const { describe, it } = require('node:test')
const { injectRegistration } = require('./withFaceLivenessIosRegistration')
const withNativeLiveness = require('@blacktomang/expo-aws-liveness/plugin/withAwsLiveness')
const withRegistration = require('./withFaceLivenessIosRegistration')

describe('Expo SDK 58 Face Liveness registration', () => {
  it('registers the native implementation before the app delegate returns', () => {
    const source = `internal import Expo
import React

class AppDelegate: ExpoAppDelegate {
  func application() -> Bool {
    reactNativeFactory = factory
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
}`
    const result = injectRegistration(source)
    assert.match(result, /^import ExpoAwsLiveness$/m)
    assert.match(result, /reactNativeFactory = factory\n    ExpoAwsLivenessRegistry\.impl = AppLivenessImpl\(\)\n    return super\.application/)
    assert.equal(injectRegistration(result), result)
  })

  it('fails build when the Expo app delegate pattern changes', () => {
    assert.throws(() => injectRegistration('import Expo\nclass AppDelegate {}'), /factory assignment was not found/)
  })

  it('runs before the package plugin with the Expo SDK 58 AppDelegate', async () => {
    const source = `internal import Expo
class AppDelegate {
  func application() {
    reactNativeFactory = factory
  }
}`
    const config = withRegistration(withNativeLiveness({ name: 'test', slug: 'test' }, {}))
    const result = await config.mods.ios.appDelegate({ modResults: { language: 'swift', contents: source }, modRequest: {} })
    assert.match(result.modResults.contents, /ExpoAwsLivenessRegistry\.impl = AppLivenessImpl\(\)/)
  })
})
