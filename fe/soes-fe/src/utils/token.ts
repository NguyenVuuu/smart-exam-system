// Access Token is stored in memory only.
// It is never persisted to localStorage, sessionStorage, or any other storage.
// On page refresh, it is re-obtained via the HttpOnly refresh token cookie.

let memoryAccessToken: string | null = null

export const tokenStorage = {
  getAccessToken(): string | null {
    return memoryAccessToken
  },

  setAccessToken(token: string): void {
    memoryAccessToken = token
  },

  clearAccessToken(): void {
    memoryAccessToken = null
  },
}
