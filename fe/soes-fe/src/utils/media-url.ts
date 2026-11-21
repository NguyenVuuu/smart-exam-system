const apiRoot = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api').replace(/\/api\/?$/, '')

export function resolveApiMediaUrl(value: string) {
  if (/^https?:\/\//i.test(value)) return value
  return `${apiRoot}${value.startsWith('/') ? value : `/${value}`}`
}
