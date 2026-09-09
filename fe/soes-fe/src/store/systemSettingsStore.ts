import { create } from 'zustand'
import { apiClient } from '../api/axios'
import { updateClientSystemDateTimeSettings } from '../utils/date.utils'

export interface PublicSystemSettings {
  organizationName: string
  shortName: string
  slogan: string
  supportEmail: string
  supportHotline: string
  copyright: string
  timezone: string
  dateFormat: string
  logoUrl: string
}

const DEFAULT_PUBLIC_SETTINGS: PublicSystemSettings = {
  organizationName: 'Trường Đại học Công nghệ & Khảo thí SOES',
  shortName: 'SOES',
  slogan: 'Hệ thống thi và đánh giá trực tuyến thông minh',
  supportEmail: 'hotro.khaothi@soes.edu.vn',
  supportHotline: '1900 6868',
  copyright: '© 2026 SOES - Smart Online Exam System. All rights reserved.',
  timezone: 'Asia/Ho_Chi_Minh',
  dateFormat: 'DD/MM/YYYY',
  logoUrl: '',
}

const STORAGE_KEY = 'soes_public_system_settings'

function loadCachedSettings(): PublicSystemSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return { ...DEFAULT_PUBLIC_SETTINGS, ...parsed }
    }
  } catch {
    return DEFAULT_PUBLIC_SETTINGS
  }
  return DEFAULT_PUBLIC_SETTINGS
}

function cacheSettings(settings: PublicSystemSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    return
  }
}

interface SystemSettingsState {
  settings: PublicSystemSettings
  isLoading: boolean
  isLoaded: boolean
  fetchPublicSettings: () => Promise<void>
  setSettings: (newSettings: Partial<PublicSystemSettings>) => void
}

function setFaviconLink(href: string, mimeType: string = 'image/png') {
  if (typeof document === 'undefined') return

  // Select all existing icon tags
  const existingLinks = document.querySelectorAll<HTMLLinkElement>("link[rel*='icon']")
  existingLinks.forEach((el) => el.remove())

  const link = document.createElement('link')
  link.rel = 'icon'
  link.type = mimeType
  link.href = href
  document.head.appendChild(link)

  const shortcutLink = document.createElement('link')
  shortcutLink.rel = 'shortcut icon'
  shortcutLink.type = mimeType
  shortcutLink.href = href
  document.head.appendChild(shortcutLink)

  const appleLink = document.createElement('link')
  appleLink.rel = 'apple-touch-icon'
  appleLink.href = href
  document.head.appendChild(appleLink)
}

function generateDefaultFaviconSvg(letter: string): string {
  const char = (letter || 'S').toUpperCase()
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#2563eb"/>
        <stop offset="100%" stop-color="#1d4ed8"/>
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="16" fill="url(#g)"/>
    <text x="32" y="44" font-size="38" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" fill="#ffffff" text-anchor="middle" dominant-baseline="central">${char}</text>
  </svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

function cropAndScaleFavicon(img: HTMLImageElement): string {
  try {
    const rawCanvas = document.createElement('canvas')
    rawCanvas.width = img.width
    rawCanvas.height = img.height
    const rawCtx = rawCanvas.getContext('2d')
    if (!rawCtx) return ''
    rawCtx.drawImage(img, 0, 0)
    const imgData = rawCtx.getImageData(0, 0, img.width, img.height)
    const { data, width, height } = imgData

    let minX = width
    let minY = height
    let maxX = -1
    let maxY = -1

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const alpha = data[(y * width + x) * 4 + 3]
        if (alpha > 15) {
          if (x < minX) minX = x
          if (x > maxX) maxX = x
          if (y < minY) minY = y
          if (y > maxY) maxY = y
        }
      }
    }

    // Fallback if full image or bounding box not found
    if (maxX < minX || maxY < minY) {
      minX = 0
      minY = 0
      maxX = width - 1
      maxY = height - 1
    }

    const cropW = Math.max(1, maxX - minX + 1)
    const cropH = Math.max(1, maxY - minY + 1)

    const size = 64
    const destCanvas = document.createElement('canvas')
    destCanvas.width = size
    destCanvas.height = size
    const destCtx = destCanvas.getContext('2d')
    if (!destCtx) return ''

    destCtx.clearRect(0, 0, size, size)

    // Scale to fill 96% of the 64x64 canvas, trimming any empty transparent borders
    const targetSize = size * 0.96
    const scale = Math.min(targetSize / cropW, targetSize / cropH)
    const drawW = cropW * scale
    const drawH = cropH * scale
    const drawX = (size - drawW) / 2
    const drawY = (size - drawH) / 2

    destCtx.drawImage(rawCanvas, minX, minY, cropW, cropH, drawX, drawY, drawW, drawH)
    return destCanvas.toDataURL('image/png')
  } catch {
    return ''
  }
}

export function updateDocumentBranding(settings: PublicSystemSettings) {
  if (typeof document === 'undefined') return

  // Update Title on tab
  const title = settings.shortName
    ? `${settings.shortName} - ${settings.slogan || settings.organizationName || 'Smart Online Exam System'}`
    : 'SOES - Smart Online Exam System'
  document.title = title

  // Update Favicon on tab
  if (settings.logoUrl) {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const croppedPng = cropAndScaleFavicon(img)
      if (croppedPng) {
        setFaviconLink(croppedPng, 'image/png')
      } else {
        setFaviconLink(settings.logoUrl, settings.logoUrl.startsWith('data:image/svg') ? 'image/svg+xml' : 'image/png')
      }
    }
    img.onerror = () => {
      setFaviconLink(settings.logoUrl, 'image/png')
    }
    img.src = settings.logoUrl
  } else {
    const defaultSvg = generateDefaultFaviconSvg(settings.shortName?.[0] || 'S')
    setFaviconLink(defaultSvg, 'image/svg+xml')
  }
}

const initialCached = loadCachedSettings()
updateClientSystemDateTimeSettings(initialCached.timezone, initialCached.dateFormat)
updateDocumentBranding(initialCached)

export const useSystemSettingsStore = create<SystemSettingsState>((set) => ({
  settings: initialCached,
  isLoading: false,
  isLoaded: false,

  fetchPublicSettings: async () => {
    set({ isLoading: true })
    try {
      const response = await apiClient.get('/system-settings/public')
      const data = response.data?.data || response.data
      if (data) {
        const merged: PublicSystemSettings = {
          ...DEFAULT_PUBLIC_SETTINGS,
          ...data,
        }
        cacheSettings(merged)
        updateClientSystemDateTimeSettings(merged.timezone, merged.dateFormat)
        updateDocumentBranding(merged)
        set({ settings: merged, isLoaded: true })
      }
    } catch {
      // Keep using cached / defaults silently
    } finally {
      set({ isLoading: false })
    }
  },

  setSettings: (newSettings) => {
    set((state) => {
      const updated = { ...state.settings, ...newSettings }
      cacheSettings(updated)
      updateClientSystemDateTimeSettings(updated.timezone, updated.dateFormat)
      updateDocumentBranding(updated)
      return { settings: updated }
    })
  },
}))
