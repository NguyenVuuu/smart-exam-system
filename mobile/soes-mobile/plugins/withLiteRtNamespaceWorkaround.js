const { withGradleProperties } = require('@expo/config-plugins')

const PROPERTY_KEY = 'android.uniquePackageNames'

function setLiteRtNamespaceWorkaround(properties) {
  const withoutExisting = properties.filter(
    (property) => property.type !== 'property' || property.key !== PROPERTY_KEY
  )

  return [
    ...withoutExisting,
    // LiteRT support and support-api share a namespace. AGP 9 otherwise rejects
    // their manifests during the Expo development build.
    { type: 'property', key: PROPERTY_KEY, value: 'false' },
  ]
}

function withLiteRtNamespaceWorkaround(config) {
  return withGradleProperties(config, (config) => {
    config.modResults = setLiteRtNamespaceWorkaround(config.modResults)
    return config
  })
}

module.exports = withLiteRtNamespaceWorkaround
module.exports.setLiteRtNamespaceWorkaround = setLiteRtNamespaceWorkaround
