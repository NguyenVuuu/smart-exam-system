const assert = require('node:assert/strict')
const { it } = require('node:test')
const withWorkaround = require('./withLiteRtNamespaceWorkaround')

it('sets the LiteRT Gradle property once, even when prebuild runs again', async () => {
  const config = withWorkaround({ name: 'test', slug: 'test' })
  const existing = [
    { type: 'property', key: 'org.gradle.jvmargs', value: '-Xmx2048m' },
    { type: 'property', key: 'android.uniquePackageNames', value: 'true' },
  ]
  const first = await config.mods.android.gradleProperties({ modResults: existing, modRequest: {} })
  const second = await config.mods.android.gradleProperties(first)

  assert.deepEqual(second.modResults, [
    existing[0],
    { type: 'property', key: 'android.uniquePackageNames', value: 'false' },
  ])
})
