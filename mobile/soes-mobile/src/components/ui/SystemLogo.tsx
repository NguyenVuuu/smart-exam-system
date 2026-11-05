import { useState } from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { API_BASE_URL } from '../../api/client'
import { useSystemBranding } from '../../hooks/useSystemBranding'

export function SystemLogo({ size = 34 }: { size?: number }) {
  const branding = useSystemBranding()
  const [failedUrl, setFailedUrl] = useState('')
  const rawUrl = branding?.logoUrl?.trim() ?? ''
  const origin = API_BASE_URL.replace(/\/api\/?$/, '')
  const logoUrl = rawUrl.startsWith('/') ? `${origin}${rawUrl}` : rawUrl
  return <View style={[styles.mark, { width: size, height: size, borderRadius: Math.round(size * 0.24) }]}>
    {logoUrl && failedUrl !== logoUrl ? <Image source={{ uri: logoUrl }} resizeMode="contain" onError={() => setFailedUrl(logoUrl)} style={styles.image} /> :
      <Text style={[styles.fallback, { fontSize: size * 0.52 }]}>S</Text>}
  </View>
}

const styles = StyleSheet.create({
  mark: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#2563eb', overflow: 'hidden' },
  image: { width: '100%', height: '100%' }, fallback: { color: '#fff', fontWeight: '800' },
})
