const { withAppDelegate } = require('@expo/config-plugins')

function injectRegistration(contents) {
  if (contents.includes('ExpoAwsLivenessRegistry.impl = AppLivenessImpl()')) return contents

  const factoryAssignment = /^([ \t]*)reactNativeFactory = factory\s*$/m
  if (!factoryAssignment.test(contents)) {
    throw new Error('Cannot register Face Liveness: Expo SDK 58 AppDelegate factory assignment was not found')
  }

  let updated = contents
  if (!/^import ExpoAwsLiveness\s*$/m.test(updated)) {
    updated = updated.replace(/^(\s*(?:internal )?import Expo\s*)$/m, '$1\nimport ExpoAwsLiveness')
    if (!/^import ExpoAwsLiveness\s*$/m.test(updated)) {
      throw new Error('Cannot register Face Liveness: Expo import was not found in AppDelegate')
    }
  }

  return updated.replace(factoryAssignment, '$&\n$1ExpoAwsLivenessRegistry.impl = AppLivenessImpl()')
}

module.exports = function withFaceLivenessIosRegistration(config) {
  return withAppDelegate(config, (mod) => {
    if (mod.modResults.language !== 'swift') {
      throw new Error('Face Liveness requires a Swift AppDelegate on iOS')
    }
    mod.modResults.contents = injectRegistration(mod.modResults.contents)
    return mod
  })
}

module.exports.injectRegistration = injectRegistration
