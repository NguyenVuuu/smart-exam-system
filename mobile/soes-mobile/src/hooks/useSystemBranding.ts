import { useEffect, useState } from 'react'
import { getSystemBranding, type SystemBranding } from '../api/system-branding.api'

let cached: SystemBranding | null = null
let pending: Promise<SystemBranding> | null = null

export function useSystemBranding() {
  const [branding, setBranding] = useState<SystemBranding | null>(cached)
  useEffect(() => {
    let active = true
    pending ??= getSystemBranding().then((value) => { cached = value; return value }).finally(() => { pending = null })
    pending.then((value) => { if (active) setBranding(value) }).catch(() => { /* Fallback mark remains visible. */ })
    return () => { active = false }
  }, [])
  return branding
}
