export function displayFileName(name: string): string {
  try { return decodeURIComponent(name).replace(/\\/g, '/').split('/').pop() || name }
  catch { return name.replace(/\\/g, '/').split('/').pop() || name }
}

export function formatFileSize(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.ceil(bytes / 1024))} KB`
}
