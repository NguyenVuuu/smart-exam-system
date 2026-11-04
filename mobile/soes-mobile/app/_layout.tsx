import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import '../global.css'
import { useInitAuth } from '../src/hooks/useInitAuth'

export default function RootLayout() {
  useInitAuth()

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  )
}
