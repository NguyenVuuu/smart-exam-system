import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

const ACCESS_TOKEN_KEY = 'accessToken'
const REFRESH_TOKEN_KEY = 'refreshToken'

function getWebStorage(): Storage | null {
  return typeof localStorage === 'undefined' ? null : localStorage
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') return getWebStorage()?.getItem(key) ?? null
  return SecureStore.getItemAsync(key)
}

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    getWebStorage()?.setItem(key, value)
    return
  }
  await SecureStore.setItemAsync(key, value)
}

async function removeItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    getWebStorage()?.removeItem(key)
    return
  }
  await SecureStore.deleteItemAsync(key)
}

export const tokenStorage = {
  getAccessToken: () => getItem(ACCESS_TOKEN_KEY),
  setAccessToken: (token: string) => setItem(ACCESS_TOKEN_KEY, token),
  removeAccessToken: () => removeItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => getItem(REFRESH_TOKEN_KEY),
  setRefreshToken: (token: string) => setItem(REFRESH_TOKEN_KEY, token),
  removeRefreshToken: () => removeItem(REFRESH_TOKEN_KEY),
  async clear(): Promise<void> {
    await Promise.all([removeItem(ACCESS_TOKEN_KEY), removeItem(REFRESH_TOKEN_KEY)])
  },
}
