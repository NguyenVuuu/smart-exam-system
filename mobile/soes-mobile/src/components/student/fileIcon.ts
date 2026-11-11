import { createElement } from 'react'
import {
  Archive, File, FileText, Film, Image, Music2, Presentation, Sheet,
  type LucideIcon,
} from 'lucide-react-native'

function getStudentFileIcon(fileTypeOrName: string): LucideIcon {
  const type = fileTypeOrName.toLowerCase()
  if (type.includes('pdf') || type.includes('word') || type.includes('doc')) return FileText
  if (type.includes('excel') || type.includes('xls') || type.includes('sheet')) return Sheet
  if (type.includes('powerpoint') || type.includes('ppt') || type.includes('presentation')) return Presentation
  if (/image|png|jpe?g|gif|webp/.test(type)) return Image
  if (/zip|rar|7z/.test(type)) return Archive
  if (/video|mp4|mov|avi/.test(type)) return Film
  if (/audio|mp3|wav|aac/.test(type)) return Music2
  return File
}

export function StudentFileIcon({ fileType, size = 20 }: { fileType: string; size?: number }) {
  return createElement(getStudentFileIcon(fileType), { size, color: '#475569' })
}
