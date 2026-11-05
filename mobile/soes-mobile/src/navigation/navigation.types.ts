import type { Href } from 'expo-router'
import type { LucideIcon } from 'lucide-react-native'

export interface NavigationItem {
  key: string
  label: string
  href: Href
  icon: LucideIcon
}

export interface NavigationGroup {
  title: string
  items: NavigationItem[]
}
