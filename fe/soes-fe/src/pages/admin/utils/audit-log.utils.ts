export const toDateRangeIso = (date: string, endOfDay = false) => {
  if (!date) return undefined
  const [year, month, day] = date.split('-').map(Number)
  const boundaryDate = new Date(year, month - 1, day, endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0)
  return boundaryDate.toISOString()
}

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
