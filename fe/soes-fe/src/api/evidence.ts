import { apiClient } from './axios'

export function protectedEvidencePath(imageUrl: string): string | null {
  const base = new URL(apiClient.defaults.baseURL ?? '/api', window.location.href)
  let url: URL
  try { url = new URL(imageUrl, window.location.href) }
  catch { return null }
  if (!imageUrl.startsWith('/api/') && url.origin !== base.origin) return null
  const prefix = base.pathname.replace(/\/$/, '')
  const pathname = url.pathname.startsWith(`${prefix}/`)
    ? `/api${url.pathname.slice(prefix.length)}` : url.pathname
  if (!/^\/api\/(?:local-evidence\/.+|teacher\/proctoring\/schedules\/[^/]+\/violations\/[^/]+\/evidence\/[^/]+)$/.test(pathname)) return null
  url.searchParams.delete('token')
  return `${pathname.slice(4)}${url.search}`
}
