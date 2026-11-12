const fallbackIceServers: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }]

export function getRtcConfiguration(): RTCConfiguration {
  const value = import.meta.env.VITE_RTC_ICE_SERVERS
  if (!value) return { iceServers: fallbackIceServers }
  try {
    const servers: unknown = JSON.parse(value)
    if (Array.isArray(servers) && servers.length > 0 && servers.every((server) =>
      server && typeof server === 'object' &&
      ('urls' in server) &&
      (typeof server.urls === 'string' || Array.isArray(server.urls))
    )) return { iceServers: servers as RTCIceServer[] }
  } catch { /* Invalid configuration falls back to STUN. */ }
  return { iceServers: fallbackIceServers }
}
